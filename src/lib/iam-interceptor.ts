/**
 * src/lib/iam-interceptor.ts – Universal IAM Policy Enforcement Interceptor
 *
 * Automatically intercepts every AWS SDK client command sent to the emulator
 * across all existing and future services, evaluating the active identity's
 * policies (Implicit Deny, Explicit Allow, Explicit Deny, Group inheritance)
 * to provide authentic AWS-fidelity authorization.
 */

import { ActiveIdentity, PolicyDocument } from "./permissions";

/**
 * Service prefix mapping for AWS SDK clients where service name differs
 * from constructor / package name (e.g. CloudWatch Logs -> logs).
 */
export const SERVICE_PREFIXES: Record<string, string> = {
  ec2: "ec2",
  s3: "s3",
  dynamodb: "dynamodb",
  lambda: "lambda",
  sqs: "sqs",
  sns: "sns",
  kms: "kms",
  iam: "iam",
  sts: "sts",
  route53: "route53",
  secretsManager: "secretsmanager",
  ssm: "ssm",
  cloudwatchLogs: "logs",
  acm: "acm",
  acmPca: "acm-pca",
  ecr: "ecr",
  ses: "ses",
  sesv2: "ses",
  organizations: "organizations",
  ram: "ram",
  serviceQuotas: "servicequotas",
  resourceGroups: "resource-groups",
  resourceGroupsTagging: "tag",
  account: "account",
  cloudhsm: "cloudhsm",
  directoryService: "ds",
  glacier: "glacier",
  keyspaces: "cassandra",
  timestreamWrite: "timestream",
  timestreamQuery: "timestream",
  kinesis: "kinesis",
  appconfig: "appconfig",
  appconfigdata: "appconfig",
  location: "geo",
  serviceDiscovery: "servicediscovery",
  resourceExplorer: "resource-explorer-2",
  directConnect: "directconnect",
  route53Resolver: "route53resolver",
};

/**
 * Extracts a candidate resource ARN from standard AWS SDK command inputs.
 */
function extractResourceArn(servicePrefix: string, commandName: string, input: any, accountId: string): string {
  if (!input || typeof input !== "object") return "*";

  try {
    switch (servicePrefix) {
      case "s3":
        if (input.Bucket) {
          return input.Key ? `arn:aws:s3:::${input.Bucket}/${input.Key}` : `arn:aws:s3:::${input.Bucket}`;
        }
        break;

      case "dynamodb":
        if (input.TableName) {
          return `arn:aws:dynamodb:us-east-1:${accountId}:table/${input.TableName}`;
        }
        break;

      case "lambda":
        if (input.FunctionName) {
          return input.FunctionName.startsWith("arn:")
            ? input.FunctionName
            : `arn:aws:lambda:us-east-1:${accountId}:function:${input.FunctionName}`;
        }
        break;

      case "sqs":
        if (input.QueueUrl) return input.QueueUrl;
        break;

      case "sns":
        if (input.TopicArn) return input.TopicArn;
        break;

      case "kms":
        if (input.KeyId) {
          return input.KeyId.startsWith("arn:") ? input.KeyId : `arn:aws:kms:us-east-1:${accountId}:key/${input.KeyId}`;
        }
        break;

      case "secretsmanager":
        if (input.SecretId) {
          return input.SecretId.startsWith("arn:")
            ? input.SecretId
            : `arn:aws:secretsmanager:us-east-1:${accountId}:secret:${input.SecretId}`;
        }
        break;

      case "logs":
        if (input.logGroupName) {
          return `arn:aws:logs:us-east-1:${accountId}:log-group:${input.logGroupName}`;
        }
        break;

      case "ec2":
        if (input.InstanceIds && Array.isArray(input.InstanceIds) && input.InstanceIds[0]) {
          return `arn:aws:ec2:us-east-1:${accountId}:instance/${input.InstanceIds[0]}`;
        }
        if (input.GroupId) {
          return `arn:aws:ec2:us-east-1:${accountId}:security-group/${input.GroupId}`;
        }
        if (input.VolumeId) {
          return `arn:aws:ec2:us-east-1:${accountId}:volume/${input.VolumeId}`;
        }
        if (input.KeyName) {
          return `arn:aws:ec2:us-east-1:${accountId}:key-pair/${input.KeyName}`;
        }
        break;
    }
  } catch {
    // Fallback safely to wildcard
  }

  return "*";
}

/**
 * Intercepts an AWS SDK command and validates permissions against the active identity.
 */
export async function enforceIAMAuthorization(servicePrefix: string, command: any): Promise<void> {
  // Dynamic import of getActiveIdentity and assertPermission avoids circular module initialization
  const { getActiveIdentity } = await import("./identity");
  const { assertPermission } = await import("./permissions");

  const identity = await getActiveIdentity();

  // Root Administrator / Emulator master user has unrestricted access
  if (identity.type === "admin" || identity.name === "emulator") {
    return;
  }

  // Derive operation name from command constructor (e.g. "RunInstancesCommand" -> "RunInstances")
  const commandName = command?.constructor?.name || "";
  const operation = commandName.replace(/Command$/, "") || "UnknownOperation";
  const action = `${servicePrefix}:${operation}`;
  const resource = extractResourceArn(servicePrefix, commandName, command?.input, identity.accountId || "000000000000");

  // Throws standard AWS AccessDeniedException if unauthorized
  assertPermission(identity, action, resource);
}

/**
 * Wraps an AWS SDK client with universal IAM policy enforcement.
 */
export function withIAMEnforcement<T extends { send: (...args: any[]) => any }>(client: T, servicePrefix: string): T {
  const originalSend = client.send.bind(client);

  client.send = async function (command: any, ...args: any[]) {
    await enforceIAMAuthorization(servicePrefix, command);
    return originalSend(command, ...args);
  } as any;

  return client;
}
