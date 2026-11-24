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
import { ResourceExplorer2Client } from "@aws-sdk/client-resource-explorer-2";
import { DirectConnectClient } from "@aws-sdk/client-direct-connect";
import { Route53ResolverClient } from "@aws-sdk/client-route53resolver";
import { NetworkFirewallClient } from "@aws-sdk/client-network-firewall";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";
import { Readable } from "stream";
import { withIAMEnforcement } from "./iam-interceptor";

// The emulator runs here (self-signed HTTPS, cert trusted via NODE_EXTRA_CA_CERTS)
const ENDPOINT = process.env.AWS_ENDPOINT_URL || process.env.EMULATOR_ENDPOINT || "https://127.0.0.1:9297";
const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

let endpointHostname = "localhost";
try {
  const parsed = new URL(ENDPOINT).hostname;
  if (parsed && !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(parsed) && !parsed.includes(":")) {
    endpointHostname = parsed;
  }
} catch {
  endpointHostname = "localhost";
}

// --- Shared 5-second timeout HTTP Handler with TLS SNI hostname ---
const ec2HttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  servername: endpointHostname,
});

const defaultHttpHandler = new NodeHttpHandler({
  httpsAgent: ec2HttpsAgent,
  connectionTimeout: 5000,
  requestTimeout: 5000,
});

/**
 * Factory helper for creating new AWS SDK clients with automatic IAM authorization enforcement.
 * Any new AWS service added in the future should be instantiated using this function:
 * e.g.: export const bedrock = createAwsClient(BedrockClient, "bedrock");
 */
export function createAwsClient<T extends { send: (...args: any[]) => any }>(
  ClientClass: new (config: any) => T,
  servicePrefix: string,
  customConfig?: any
): T {
  const client = new ClientClass({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: defaultHttpHandler,
    ...customConfig,
  });
  return withIAMEnforcement(client, servicePrefix);
}

// --- System IAM Client (Unintercepted, reserved exclusively for internal identity resolution) ---
export const systemIam = new IAMClient({
  endpoint: ENDPOINT,
  region: DEFAULT_REGION,
  requestHandler: defaultHttpHandler,
});

// --- EC2 / VPC ---
export const ec2 = withIAMEnforcement(
  new EC2Client({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: defaultHttpHandler,
  }),
  "ec2"
);

// --- ELB v2 (Elastic Load Balancing) ---
export const elbv2 = withIAMEnforcement(
  new ElasticLoadBalancingV2Client({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: defaultHttpHandler,
  }),
  "elasticloadbalancing"
);

// --- Auto Scaling ---
export const autoScaling = withIAMEnforcement(
  new AutoScalingClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: defaultHttpHandler,
  }),
  "autoscaling"
);

// --- S3 ---
export const s3 = withIAMEnforcement(
  new S3Client({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    forcePathStyle: true, // required: emulator doesn't support virtual-hosted buckets
    requestHandler: defaultHttpHandler,
  }),
  "s3"
);

// --- SQS ---
export const sqs = withIAMEnforcement(
  new SQSClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: defaultHttpHandler,
  }),
  "sqs"
);

// --- DynamoDB ---
export const dynamodb = withIAMEnforcement(
  new DynamoDBClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: defaultHttpHandler,
  }),
  "dynamodb"
);

// --- IAM ---
export const iam = withIAMEnforcement(
  new IAMClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: defaultHttpHandler,
  }),
  "iam"
);

// --- STS (Security Token Service – used to verify identity) ---
export const sts = withIAMEnforcement(
  new STSClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: defaultHttpHandler,
  }),
  "sts"
);

// --- Lambda ---
export const lambda = withIAMEnforcement(
  new LambdaClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: defaultHttpHandler,
  }),
  "lambda"
);

// --- Organizations ---
export const organizations = withIAMEnforcement(
  new OrganizationsClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "organizations"
);

// --- KMS (Key Management Service) ---
export const kms = withIAMEnforcement(
  new KMSClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "kms"
);

// --- RAM (Resource Access Manager) ---
export const ram = withIAMEnforcement(
  new RAMClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "ram"
);

// --- Service Quotas ---
export const serviceQuotas = withIAMEnforcement(
  new ServiceQuotasClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "servicequotas"
);

// --- Resource Groups Tagging API ---
export const resourceGroupsTaggingApi = withIAMEnforcement(
  new ResourceGroupsTaggingAPIClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "tag"
);

// --- Resource Groups ---
export const resourceGroups = withIAMEnforcement(
  new ResourceGroupsClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "resource-groups"
);

// --- AWS Account Management ---
export const accountClient = withIAMEnforcement(
  new AccountClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "account"
);

// --- ACM (AWS Certificate Manager) ---
export const acm = withIAMEnforcement(
  new ACMClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "acm"
);

// --- Route 53 (DNS) ---
export const route53 = withIAMEnforcement(
  new Route53Client({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "route53"
);

// --- Secrets Manager ---
export const secretsManager = withIAMEnforcement(
  new SecretsManagerClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "secretsmanager"
);

// --- SSM (Systems Manager / Parameter Store) ---
export const ssm = withIAMEnforcement(
  new SSMClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "ssm"
);

// --- ACM-PCA (AWS Private Certificate Authority) ---
export const acmPca = withIAMEnforcement(
  new ACMPCAClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "acm-pca"
);

// --- CloudHSM V2 ---
export const cloudhsmv2 = withIAMEnforcement(
  new CloudHSMV2Client({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "cloudhsm"
);

// --- Directory Service ---
export const ds = withIAMEnforcement(
  new DirectoryServiceClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "ds"
);

// --- S3 Glacier ---
export const glacier = withIAMEnforcement(
  new GlacierClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "glacier"
);

// --- SNS ---
export const sns = withIAMEnforcement(
  new SNSClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "sns"
);

// --- Amazon Keyspaces (for Apache Cassandra) ---
export const keyspaces = withIAMEnforcement(
  new KeyspacesClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "cassandra"
);

// --- Amazon Timestream ---
export const timestreamWrite = withIAMEnforcement(
  new TimestreamWriteClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "timestream"
);

export const timestreamQuery = withIAMEnforcement(
  new TimestreamQueryClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
  }),
  "timestream"
);

// --- Amazon Kinesis Data Streams ---
export const kinesis = withIAMEnforcement(
  new KinesisClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler(),
  }),
  "kinesis"
);

// --- Amazon CloudWatch Logs ---
export const cloudwatchLogs = withIAMEnforcement(
  new CloudWatchLogsClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler(),
  }),
  "logs"
);

// --- Amazon Elastic Container Registry (ECR) ---
export const ecr = withIAMEnforcement(
  new ECRClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler(),
  }),
  "ecr"
);

// --- Amazon Simple Email Service (SES v1 & v2) ---
export const ses = withIAMEnforcement(
  new SESClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler(),
  }),
  "ses"
);

export const sesv2 = withIAMEnforcement(
  new SESv2Client({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler(),
  }),
  "ses"
);

// --- AWS AppConfig & AppConfigData ---
export const appconfig = withIAMEnforcement(
  new AppConfigClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler(),
  }),
  "appconfig"
);

export const appconfigData = withIAMEnforcement(
  new AppConfigDataClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler(),
  }),
  "appconfig"
);

// Custom HTTPS agent to support subdomain endpoint prefixes in LocationClient (e.g. cp.maps.localhost, cp.tracking.localhost)
const locationHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined,
});

// --- Amazon Location Service ---
export const location = withIAMEnforcement(
  new LocationClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler({ httpsAgent: locationHttpsAgent }),
  }),
  "geo"
);

// Custom HTTPS agent for AWS Cloud Map
const cloudMapHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined,
  servername: "localhost",
});

// --- AWS Cloud Map (Service Discovery) ---
export const serviceDiscovery = withIAMEnforcement(
  new ServiceDiscoveryClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler({ httpsAgent: cloudMapHttpsAgent }),
  }),
  "servicediscovery"
);

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

// --- AWS Resource Explorer (Resource Explorer 2) ---
const resourceExplorerHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  servername: "localhost",
});

export const resourceExplorer = withIAMEnforcement(
  new ResourceExplorer2Client({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler({ httpsAgent: resourceExplorerHttpsAgent }),
  }),
  "resource-explorer-2"
);

// Middleware to normalize numeric or bigDecimal LastUpdatedAt / CreatedAt / LastReportedAt timestamps
// to ISO-8601 strings so that Smithy's RFC-3339 deserializer parses them cleanly
resourceExplorer.middlewareStack.add(
  (next) => async (args: any) => {
    const result: any = await next(args);
    const response: any = result?.response;
    if (response && response.body && typeof response.body.on === "function") {
      const chunks: Buffer[] = [];
      for await (const chunk of response.body) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      let rawText = Buffer.concat(chunks).toString("utf-8");

      // 1. Handle bigDecimal object format: {"string": "1795328675.342319574", "type": "bigDecimal"}
      rawText = rawText.replace(
        /"(LastReportedAt|LastUpdatedAt|CreatedAt)":\s*\{\s*"string":\s*"([^"]+)",\s*"type":\s*"bigDecimal"\s*\}/g,
        (_match, key, strVal) => {
          const sec = parseFloat(strVal);
          const dateStr = !isNaN(sec) ? new Date(sec * 1000).toISOString() : new Date().toISOString();
          return `"${key}": "${dateStr}"`;
        }
      );

      // 2. Handle numeric timestamp format: 1795328667.9542675
      rawText = rawText.replace(
        /"(LastReportedAt|LastUpdatedAt|CreatedAt)":\s*(\d+(?:\.\d+)?)/g,
        (_match, key, num) => {
          const dateStr = new Date(parseFloat(num) * 1000).toISOString();
          return `"${key}": "${dateStr}"`;
        }
      );

      response.body = Readable.from([Buffer.from(rawText, "utf-8")]);
    }
    return result;
  },
  {
    step: "deserialize",
    name: "normalizeResourceExplorerTimestamps",
    priority: "low",
  }
);

// --- Direct Connect ---
export const directConnect = withIAMEnforcement(
  new DirectConnectClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler({ httpsAgent: ec2HttpsAgent }),
  }),
  "directconnect"
);

// --- Route 53 Resolver ---
export const route53Resolver = withIAMEnforcement(
  new Route53ResolverClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler({ httpsAgent: ec2HttpsAgent }),
  }),
  "route53resolver"
);

// --- AWS Network Firewall ---
export const networkFirewall = withIAMEnforcement(
  new NetworkFirewallClient({
    endpoint: ENDPOINT,
    region: DEFAULT_REGION,
    requestHandler: new NodeHttpHandler({ httpsAgent: ec2HttpsAgent }),
  }),
  "network-firewall"
);













