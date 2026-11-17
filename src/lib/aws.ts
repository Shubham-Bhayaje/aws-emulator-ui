/**
 * lib/aws.ts – Central place for all AWS SDK v3 clients.
 *
 * Every client points at the local AWS Emulator (https://127.0.0.1:9297).
 * Credentials and region are picked up automatically from the shared
 * credentials/config files via the default provider chain (set through
 * environment variables in the npm dev script).
 *
 * IMPORTANT:
 *  - S3 uses "path style" (bucket name in the URL path, not subdomain).
 *  - We never disable TLS – instead we pass the emulator CA via
 *    NODE_EXTRA_CA_CERTS at startup time.
 */

import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { IAMClient } from "@aws-sdk/client-iam";
import { STSClient } from "@aws-sdk/client-sts";

// The emulator runs here (self-signed HTTPS, cert trusted via NODE_EXTRA_CA_CERTS)
const ENDPOINT = "https://127.0.0.1:9297";

// --- S3 ---
export const s3 = new S3Client({
  endpoint: ENDPOINT,
  forcePathStyle: true, // required: emulator doesn't support virtual-hosted buckets
});

// --- SQS ---
export const sqs = new SQSClient({
  endpoint: ENDPOINT,
});

// --- DynamoDB ---
export const dynamodb = new DynamoDBClient({
  endpoint: ENDPOINT,
});

// --- IAM ---
export const iam = new IAMClient({
  endpoint: ENDPOINT,
});

// --- STS (Security Token Service – used to verify identity) ---
export const sts = new STSClient({
  endpoint: ENDPOINT,
});
