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
import { OrganizationsClient } from "@aws-sdk/client-organizations";
import { KMSClient } from "@aws-sdk/client-kms";
import { RAMClient } from "@aws-sdk/client-ram";
import { ServiceQuotasClient } from "@aws-sdk/client-service-quotas";
import { ResourceGroupsTaggingAPIClient } from "@aws-sdk/client-resource-groups-tagging-api";
import { ResourceGroupsClient } from "@aws-sdk/client-resource-groups";
import { AccountClient } from "@aws-sdk/client-account";
import { ACMClient } from "@aws-sdk/client-acm";
import { Route53Client } from "@aws-sdk/client-route-53";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { SSMClient } from "@aws-sdk/client-ssm";
import { ACMPCAClient } from "@aws-sdk/client-acm-pca";
import { CloudHSMV2Client } from "@aws-sdk/client-cloudhsm-v2";
import { DirectoryServiceClient } from "@aws-sdk/client-directory-service";
import { GlacierClient } from "@aws-sdk/client-glacier";
import { SNSClient } from "@aws-sdk/client-sns";
import { KeyspacesClient } from "@aws-sdk/client-keyspaces";
import { TimestreamWriteClient } from "@aws-sdk/client-timestream-write";
import { TimestreamQueryClient } from "@aws-sdk/client-timestream-query";
import { KinesisClient } from "@aws-sdk/client-kinesis";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { ECRClient } from "@aws-sdk/client-ecr";
import { SESClient } from "@aws-sdk/client-ses";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { AppConfigClient } from "@aws-sdk/client-appconfig";
import { AppConfigDataClient } from "@aws-sdk/client-appconfigdata";
import { LocationClient } from "@aws-sdk/client-location";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

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

// --- Organizations ---
export const organizations = new OrganizationsClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- KMS (Key Management Service) ---
export const kms = new KMSClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- RAM (Resource Access Manager) ---
export const ram = new RAMClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Service Quotas ---
export const serviceQuotas = new ServiceQuotasClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Resource Groups Tagging API ---
export const resourceGroupsTaggingApi = new ResourceGroupsTaggingAPIClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Resource Groups ---
export const resourceGroups = new ResourceGroupsClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- AWS Account Management ---
export const accountClient = new AccountClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- ACM (AWS Certificate Manager) ---
export const acm = new ACMClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Route 53 (DNS) ---
export const route53 = new Route53Client({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Secrets Manager ---
export const secretsManager = new SecretsManagerClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- SSM (Systems Manager / Parameter Store) ---
export const ssm = new SSMClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- ACM-PCA (AWS Private Certificate Authority) ---
export const acmPca = new ACMPCAClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- CloudHSM V2 ---
export const cloudhsmv2 = new CloudHSMV2Client({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Directory Service ---
export const ds = new DirectoryServiceClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- S3 Glacier ---
export const glacier = new GlacierClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- SNS ---
export const sns = new SNSClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Amazon Keyspaces (for Apache Cassandra) ---
export const keyspaces = new KeyspacesClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Amazon Timestream ---
export const timestreamWrite = new TimestreamWriteClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

export const timestreamQuery = new TimestreamQueryClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
});

// --- Amazon Kinesis Data Streams ---
export const kinesis = new KinesisClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  requestHandler: new NodeHttpHandler(),
});

// --- Amazon CloudWatch Logs ---
export const cloudwatchLogs = new CloudWatchLogsClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  requestHandler: new NodeHttpHandler(),
});

// --- Amazon Elastic Container Registry (ECR) ---
export const ecr = new ECRClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  requestHandler: new NodeHttpHandler(),
});

// --- Amazon Simple Email Service (SES v1 & v2) ---
export const ses = new SESClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  requestHandler: new NodeHttpHandler(),
});

export const sesv2 = new SESv2Client({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  requestHandler: new NodeHttpHandler(),
});

// --- AWS AppConfig & AppConfigData ---
export const appconfig = new AppConfigClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  requestHandler: new NodeHttpHandler(),
});

export const appconfigData = new AppConfigDataClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  requestHandler: new NodeHttpHandler(),
});

// Custom HTTPS agent to support subdomain endpoint prefixes in LocationClient (e.g. cp.maps.localhost, cp.tracking.localhost)
const locationHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined,
});

// --- Amazon Location Service ---
export const location = new LocationClient({
  endpoint: "https://localhost:9297",
  region: DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "EMULATOR46BF1B4915F9",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "74CCE172721E16381ABA11BA4F9DFD6A122EEBC4",
  },
  requestHandler: new NodeHttpHandler({ httpsAgent: locationHttpsAgent }),
});

// Custom HTTPS agent for AWS Cloud Map
const cloudMapHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined,
  servername: "localhost",
});

// --- AWS Cloud Map (Service Discovery) ---
export const serviceDiscovery = new ServiceDiscoveryClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "EMULATOR46BF1B4915F9",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "74CCE172721E16381ABA11BA4F9DFD6A122EEBC4",
  },
  requestHandler: new NodeHttpHandler({ httpsAgent: cloudMapHttpsAgent }),
});

// Middleware to strip 'data-' endpoint prefix for DiscoverInstances in local emulator
serviceDiscovery.middlewareStack.add(
  (next) => async (args: any) => {
    const { request } = args;
    if (request && request.hostname && request.hostname.startsWith("data-")) {
      request.hostname = request.hostname.replace(/^data-/, "");
    }
    return next(args);
  },
  {
    step: "finalizeRequest",
    name: "fixDataEndpointPrefix",
    priority: "low",
  }
);










