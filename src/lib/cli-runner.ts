/**
 * lib/cli-runner.ts – Server Action to execute CLI commands against the local AWS Emulator
 *
 * Automatically wires emulator credentials, TLS ca.pem, and environment variables.
 * Supports executing via native `aws` CLI, with an intelligent AWS SDK v3 fallback
 * so commands always work out-of-the-box.
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
async function fallbackSdkExecution(cmd: string): Promise<string | null> {
  const lower = cmd.trim().toLowerCase();

  // STS caller identity
  if (lower.includes("sts get-caller-identity")) {
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
          const fallbackOutput = await fallbackSdkExecution(raw);
          if (fallbackOutput !== null) {
            resolve({
              command: raw,
              output: fallbackOutput,
              exitCode: 0,
              durationMs: Date.now() - startTime,
            });
            return;
          }
        } catch { /* fallback failed */ }

        const errorOutput = stderr.trim() || stdout.trim() || error.message;
        resolve({
          command: raw,
          output: errorOutput,
          exitCode: error.code || 1,
          durationMs,
        });
      }
    );
  });
}
