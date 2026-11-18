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
import { EC2Client } from "@aws-sdk/client-ec2";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import { AutoScalingClient } from "@aws-sdk/client-auto-scaling";

// The emulator runs here (self-signed HTTPS, cert trusted via NODE_EXTRA_CA_CERTS)
const ENDPOINT = "https://127.0.0.1:9297";
const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

// --- EC2 ---
export const ec2 = new EC2Client({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- ELB v2 (Elastic Load Balancing) ---
export const elbv2 = new ElasticLoadBalancingV2Client({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Auto Scaling ---
export const autoScaling = new AutoScalingClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- S3 ---
export const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  forcePathStyle: true, // required: emulator doesn't support virtual-hosted buckets
});

// --- SQS ---
export const sqs = new SQSClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- DynamoDB ---
export const dynamodb = new DynamoDBClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- IAM ---
export const iam = new IAMClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- STS (Security Token Service – used to verify identity) ---
export const sts = new STSClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Lambda ---
export const lambda = new LambdaClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

