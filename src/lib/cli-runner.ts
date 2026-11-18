/**
 * lib/cli-runner.ts – Server Action to execute CLI commands against the local AWS Emulator
 *
 * Automatically wires emulator credentials, TLS ca.pem, and environment variables.
 * Enforces active identity permissions so read-only users or limited roles are restricted.
 */

"use server";

import { exec } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";
import { s3, sqs, dynamodb, iam, sts } from "./aws";
import { ListBucketsCommand, CreateBucketCommand, DeleteBucketCommand } from "@aws-sdk/client-s3";
import { ListQueuesCommand } from "@aws-sdk/client-sqs";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { ListUsersCommand, ListRolesCommand } from "@aws-sdk/client-iam";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { getActiveIdentity } from "./identity";
import { evaluatePermissions, ActiveIdentity } from "./permissions";

export type CliResult = {
  command: string;
  output: string;
  exitCode: number;
  durationMs: number;
  clear?: boolean;
};

/**
 * Locate emulator files across Windows and WSL
 */
function getEmulatorConfig() {
  const homeDir = os.homedir();
  const port = process.env.EMULATOR_PORT || "9297";
  let emulatorDir = path.join(homeDir, ".aws", "emulator", port);

  if (process.platform === "win32" && !fs.existsSync(emulatorDir)) {
    const wslCandidate = path.join(
      "\\\\wsl.localhost",
      "Ubuntu-24.04",
      "home",
      os.userInfo().username,
      ".aws",
      "emulator",
      port
    );
    if (fs.existsSync(wslCandidate)) {
      emulatorDir = wslCandidate;
    }
  }

  return {
    dir: emulatorDir,
    caCert: path.join(emulatorDir, "ca.pem"),
    credentialsFile: path.join(emulatorDir, "emulator_credentials"),
    configFile: path.join(emulatorDir, "config"),
  };
}

/**
 * Fallback command handler using AWS SDK v3 when aws CLI is not installed or errors
 */
async function fallbackSdkExecution(cmd: string, identity: ActiveIdentity): Promise<string | null> {
  const lower = cmd.trim().toLowerCase();

  // STS caller identity
  if (lower.includes("sts get-caller-identity")) {
    if (identity.type !== "admin" && identity.name !== "emulator") {
      return JSON.stringify(
        {
          UserId: `AIDA${identity.name.toUpperCase()}MOCK`,
          Account: identity.accountId || "000000000000",
          Arn: `arn:aws:iam::${identity.accountId || "000000000000"}:${identity.type === "role" ? "role" : "user"}/${identity.name}`,
        },
        null,
        2
      );
    }
    const res = await sts.send(new GetCallerIdentityCommand({}));
    return JSON.stringify(
      {
        UserId: res.UserId || "AIDAH5I7GEMO7ADXNFAZU",
        Account: res.Account || "000000000000",
        Arn: res.Arn || "arn:aws:iam::000000000000:user/emulator",
      },
      null,
      2
    );
  }

  // S3 commands
  if (lower === "aws s3 ls" || lower === "s3 ls") {
    const res = await s3.send(new ListBucketsCommand({}));
    const buckets = res.Buckets || [];
    if (buckets.length === 0) return "(No buckets found)";
    return buckets
      .map((b) => `${b.CreationDate ? new Date(b.CreationDate).toISOString().split("T")[0] : "2026-01-01"} ${b.Name}`)
      .join("\n");
  }

  if (lower.startsWith("aws s3 mb s3://") || lower.startsWith("s3 mb s3://")) {
    const bucket = cmd.trim().split("s3://")[1]?.trim();
    if (bucket) {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
      return `make_bucket: s3://${bucket}`;
    }
  }

  if (lower.startsWith("aws s3 rb s3://") || lower.startsWith("s3 rb s3://")) {
    const bucket = cmd.trim().split("s3://")[1]?.trim();
    if (bucket) {
      await s3.send(new DeleteBucketCommand({ Bucket: bucket }));
      return `remove_bucket: s3://${bucket}`;
    }
  }

  // SQS commands
  if (lower.includes("sqs list-queues")) {
    const res = await sqs.send(new ListQueuesCommand({}));
    return JSON.stringify({ QueueUrls: res.QueueUrls || [] }, null, 2);
  }

  // DynamoDB commands
  if (lower.includes("dynamodb list-tables")) {
    const res = await dynamodb.send(new ListTablesCommand({}));
    return JSON.stringify({ TableNames: res.TableNames || [] }, null, 2);
  }

  // IAM commands
  if (lower.includes("iam list-users")) {
    const res = await iam.send(new ListUsersCommand({}));
    return JSON.stringify({ Users: res.Users || [] }, null, 2);
  }

  if (lower.includes("iam list-roles")) {
    const res = await iam.send(new ListRolesCommand({}));
    return JSON.stringify({ Roles: res.Roles || [] }, null, 2);
  }

  return null;
}

/**
 * Checks if active identity is authorized for an AWS CLI command.
 */
function checkCliPermissions(cmd: string, identity: ActiveIdentity): { allowed: boolean; errorMsg?: string } {
  if (identity.type === "admin" || identity.name === "emulator") {
    return { allowed: true };
  }

  const lower = cmd.trim().toLowerCase();
  const principalArn = `arn:aws:iam::${identity.accountId}:${identity.type === "role" ? "role" : "user"}/${identity.name}`;

  let requiredAction: string | null = null;
  let resource: string = "*";
  let opName = "Unknown";

  if (lower.includes("s3 mb") || lower.includes("s3api create-bucket")) {
    requiredAction = "s3:CreateBucket";
    opName = "CreateBucket";
  } else if (lower.includes("s3 rb") || lower.includes("s3api delete-bucket")) {
    requiredAction = "s3:DeleteBucket";
    opName = "DeleteBucket";
  } else if (lower.includes("s3 cp") || lower.includes("s3 sync") || lower.includes("s3api put-object")) {
    requiredAction = "s3:PutObject";
    opName = "PutObject";
  } else if (lower.includes("s3 rm") || lower.includes("s3api delete-object")) {
    requiredAction = "s3:DeleteObject";
    opName = "DeleteObject";
  } else if (lower.includes("s3 ls") || lower.includes("s3api list-buckets")) {
    requiredAction = "s3:ListAllMyBuckets";
    opName = "ListBuckets";
  } else if (lower.includes("sqs create-queue")) {
    requiredAction = "sqs:CreateQueue";
    opName = "CreateQueue";
  } else if (lower.includes("sqs delete-queue")) {
    requiredAction = "sqs:DeleteQueue";
    opName = "DeleteQueue";
  } else if (lower.includes("sqs send-message")) {
    requiredAction = "sqs:SendMessage";
    opName = "SendMessage";
  } else if (lower.includes("sqs list-queues")) {
    requiredAction = "sqs:ListQueues";
    opName = "ListQueues";
  } else if (lower.includes("dynamodb create-table")) {
    requiredAction = "dynamodb:CreateTable";
    opName = "CreateTable";
  } else if (lower.includes("dynamodb delete-table")) {
    requiredAction = "dynamodb:DeleteTable";
    opName = "DeleteTable";
  } else if (lower.includes("dynamodb list-tables")) {
    requiredAction = "dynamodb:ListTables";
    opName = "ListTables";
  } else if (lower.includes("iam create-user")) {
    requiredAction = "iam:CreateUser";
    opName = "CreateUser";
  } else if (lower.includes("iam delete-user")) {
    requiredAction = "iam:DeleteUser";
    opName = "DeleteUser";
  } else if (lower.includes("iam attach-user-policy")) {
    requiredAction = "iam:AttachUserPolicy";
    opName = "AttachUserPolicy";
  } else if (lower.includes("iam detach-user-policy")) {
    requiredAction = "iam:DetachUserPolicy";
    opName = "DetachUserPolicy";
  } else if (lower.includes("iam create-role")) {
    requiredAction = "iam:CreateRole";
    opName = "CreateRole";
  } else if (lower.includes("iam delete-role")) {
    requiredAction = "iam:DeleteRole";
    opName = "DeleteRole";
  } else if (lower.includes("iam attach-role-policy")) {
    requiredAction = "iam:AttachRolePolicy";
    opName = "AttachRolePolicy";
  } else if (lower.includes("iam detach-role-policy")) {
    requiredAction = "iam:DetachRolePolicy";
    opName = "DetachRolePolicy";
  } else if (lower.includes("iam list-users")) {
    requiredAction = "iam:ListUsers";
    opName = "ListUsers";
  } else if (lower.includes("iam list-roles")) {
    requiredAction = "iam:ListRoles";
    opName = "ListRoles";
  }

  if (requiredAction) {
    const evalRes = evaluatePermissions(identity, requiredAction, resource);
    if (!evalRes.allowed) {
      return {
        allowed: false,
        errorMsg: `An error occurred (AccessDenied) when calling the ${opName} operation: User: ${principalArn} is not authorized to perform: ${requiredAction} on resource: ${resource} with an explicit/implicit deny.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Executes a CloudShell terminal command against the local AWS Emulator.
 */
export async function executeTerminalCommand(input: string): Promise<CliResult> {
  const startTime = Date.now();
  const raw = input.trim();

  if (!raw) {
    return { command: "", output: "", exitCode: 0, durationMs: 0 };
  }

  if (raw === "clear" || raw === "cls") {
    return { command: raw, output: "", exitCode: 0, durationMs: 0, clear: true };
  }

  if (raw === "help") {
    return {
      command: raw,
      output: `AWS CloudShell (Local Emulator Edition)
Available commands:
  aws sts get-caller-identity        Get emulator account & user identity
  aws s3 ls                          List all S3 buckets
  aws s3 mb s3://<bucket>            Create an S3 bucket
  aws s3 rb s3://<bucket>            Delete an S3 bucket
  aws sqs list-queues                List all SQS message queues
  aws dynamodb list-tables           List all DynamoDB tables
  aws iam list-users                 List all IAM users
  aws iam list-roles                 List all IAM roles
  clear                              Clear terminal screen
  help                               Show this help menu`,
      exitCode: 0,
      durationMs: Date.now() - startTime,
    };
  }

  const identity = await getActiveIdentity();

  // Normalize command if user omitted 'aws'
  let normalizedCmd = raw;
  if (!normalizedCmd.startsWith("aws ") && !normalizedCmd.startsWith("aws.exe ")) {
    if (
      normalizedCmd.startsWith("s3 ") ||
      normalizedCmd.startsWith("sqs ") ||
      normalizedCmd.startsWith("dynamodb ") ||
      normalizedCmd.startsWith("iam ") ||
      normalizedCmd.startsWith("sts ")
    ) {
      normalizedCmd = `aws ${normalizedCmd}`;
    }
  }

  // Intercept sts get-caller-identity when switched to non-admin identity
  if (normalizedCmd.includes("sts get-caller-identity") && identity.type !== "admin" && identity.name !== "emulator") {
    const callerIdJson = JSON.stringify(
      {
        UserId: `AIDA${identity.name.toUpperCase()}MOCK`,
        Account: identity.accountId || "000000000000",
        Arn: `arn:aws:iam::${identity.accountId || "000000000000"}:${identity.type === "role" ? "role" : "user"}/${identity.name}`,
      },
      null,
      2
    );
    return {
      command: raw,
      output: callerIdJson,
      exitCode: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Permission boundary check
  const permCheck = checkCliPermissions(normalizedCmd, identity);
  if (!permCheck.allowed) {
    return {
      command: raw,
      output: permCheck.errorMsg || "An error occurred (AccessDenied): Action denied by IAM policy.",
      exitCode: 254,
      durationMs: Date.now() - startTime,
    };
  }

  const { caCert, credentialsFile, configFile } = getEmulatorConfig();

  const env = {
    ...process.env,
    AWS_SHARED_CREDENTIALS_FILE: credentialsFile,
    AWS_CONFIG_FILE: configFile,
    AWS_CA_BUNDLE: caCert,
    AWS_EC2_METADATA_DISABLED: "true",
    AWS_DEFAULT_REGION: "us-east-1",
  };

  return new Promise<CliResult>((resolve) => {
    exec(
      normalizedCmd,
      {
        env,
        timeout: 12000,
        maxBuffer: 1024 * 1024 * 2, // 2MB
      },
      async (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;

        if (!error) {
          resolve({
            command: raw,
            output: stdout.trim() || stderr.trim() || "(Command executed successfully)",
            exitCode: 0,
            durationMs,
          });
          return;
        }

        // If native CLI had an issue, attempt SDK fallback
        try {
          const fallbackOutput = await fallbackSdkExecution(raw, identity);
          if (fallbackOutput !== null) {
            resolve({
              command: raw,
              output: fallbackOutput,
              exitCode: 0,
              durationMs,
            });
            return;
          }
        } catch (fallbackErr: any) {
          resolve({
            command: raw,
            output: fallbackErr.message || String(fallbackErr),
            exitCode: 1,
            durationMs,
          });
          return;
        }

        resolve({
          command: raw,
          output: (stderr.trim() || stdout.trim() || error.message).trim(),
          exitCode: error.code || 1,
          durationMs,
        });
      }
    );
  });
}
