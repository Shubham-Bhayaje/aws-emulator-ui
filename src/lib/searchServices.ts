/**
 * src/lib/searchServices.ts – Advanced AWS Console-Style Search Engine.
 * Token-based matching, acronym expansion, alias matching, feature discovery,
 * and intelligent relevance ranking.
 * Zero emojis, Cloudscape enterprise standard.
 */

import { ALL_SERVICES, ServiceDefinition } from "./services-catalog";

export interface ServiceFeatureItem {
  id: string;
  name: string;
  href: string;
  serviceId: string;
  serviceName: string;
  category: string;
  desc: string;
  color?: string;
  aliases: string[];
}

export interface SearchMatchResult {
  services: ServiceDefinition[];
  features: ServiceFeatureItem[];
  totalMatches: number;
}

// Sub-service feature deep links across console
export const COMMON_FEATURES: ServiceFeatureItem[] = [
  // Systems Manager
  {
    id: "feat-ssm-params",
    name: "Parameter Store",
    href: "/systems-manager/parameter-store",
    serviceId: "systems-manager",
    serviceName: "AWS Systems Manager",
    category: "Management & Governance",
    desc: "Hierarchical configuration and secrets storage (String, StringList, SecureString)",
    color: "#C925D1",
    aliases: [
      "parameter store",
      "ssm parameters",
      "securestring",
      "config store",
      "parameters",
      "ssm parameter store",
      "systems manager parameter store",
    ],
  },
  {
    id: "feat-ssm-params-create",
    name: "Create parameter",
    href: "/systems-manager/parameter-store/create",
    serviceId: "systems-manager",
    serviceName: "AWS Systems Manager",
    category: "Management & Governance",
    desc: "Create standard or advanced parameter with KMS encryption",
    color: "#C925D1",
    aliases: ["create parameter", "new parameter", "add parameter", "store parameter"],
  },
  {
    id: "feat-ssm-fleet",
    name: "Fleet Manager",
    href: "/systems-manager",
    serviceId: "systems-manager",
    serviceName: "AWS Systems Manager",
    category: "Management & Governance",
    desc: "Centrally manage hybrid cloud nodes, patch compliance, and instance health",
    color: "#C925D1",
    aliases: ["fleet manager", "managed nodes", "ssm fleet", "node management"],
  },
  {
    id: "feat-ssm-session",
    name: "Session Manager",
    href: "/systems-manager/session-manager",
    serviceId: "systems-manager",
    serviceName: "AWS Systems Manager",
    category: "Management & Governance",
    desc: "Browser-based shell access to managed nodes without bastion hosts",
    color: "#C925D1",
    aliases: ["session manager", "ssh", "terminal", "bastionless", "ssm shell"],
  },

  // Secrets Manager
  {
    id: "feat-sm-new",
    name: "Store a new secret",
    href: "/secretsmanager/new",
    serviceId: "secretsmanager",
    serviceName: "AWS Secrets Manager",
    category: "Security, Identity, & Compliance",
    desc: "Create and encrypt database credentials, OAuth tokens, or API keys",
    color: "#DD3522",
    aliases: ["create secret", "new secret", "store secret", "store password", "save credentials"],
  },
  {
    id: "feat-sm-secrets",
    name: "Secrets inventory",
    href: "/secretsmanager",
    serviceId: "secretsmanager",
    serviceName: "AWS Secrets Manager",
    category: "Security, Identity, & Compliance",
    desc: "View and manage active, encrypted, and scheduled-for-deletion secrets",
    color: "#DD3522",
    aliases: ["secrets", "passwords", "credentials", "api keys", "secret list"],
  },

  // Certificate Manager (ACM)
  {
    id: "feat-acm-request",
    name: "Request a certificate",
    href: "/acm/request",
    serviceId: "acm",
    serviceName: "AWS Certificate Manager",
    category: "Security, Identity, & Compliance",
    desc: "Request a public SSL/TLS certificate with DNS (Route 53) or email validation",
    color: "#E7157B",
    aliases: ["request certificate", "new ssl certificate", "create certificate", "tls request", "ssl cert"],
  },
  {
    id: "feat-acm-import",
    name: "Import a certificate",
    href: "/acm/import",
    serviceId: "acm",
    serviceName: "AWS Certificate Manager",
    category: "Security, Identity, & Compliance",
    desc: "Import an existing X.509 certificate, private key, and certificate chain",
    color: "#E7157B",
    aliases: ["import certificate", "upload certificate", "pem certificate", "custom cert"],
  },
  {
    id: "feat-acm-pca",
    name: "AWS Private CA",
    href: "/acm/pca",
    serviceId: "acm-pca",
    serviceName: "AWS Private CA",
    category: "Security, Identity, & Compliance",
    desc: "Private Certificate Authority for internal enterprise services",
    color: "#E7157B",
    aliases: [
      "private ca",
      "pca",
      "private certificate authority",
      "internal ca",
      "root ca",
      "subordinate ca",
      "certificate authority",
      "x.509",
    ],
  },
  {
    id: "feat-acm-pca-create",
    name: "Create a private CA",
    href: "/acm/pca/create",
    serviceId: "acm-pca",
    serviceName: "AWS Private CA",
    category: "Security, Identity, & Compliance",
    desc: "Create a root or subordinate private certificate authority with custom CRL and algorithms",
    color: "#E7157B",
    aliases: ["create private ca", "new ca", "create root ca", "create subordinate ca", "create certificate authority"],
  },

  // CloudHSM
  {
    id: "feat-cloudhsm-clusters",
    name: "CloudHSM Clusters",
    href: "/cloudhsm",
    serviceId: "cloudhsm",
    serviceName: "AWS CloudHSM",
    category: "Security, Identity, & Compliance",
    desc: "Dedicated hardware security module (HSM) clusters and cryptographic key storage",
    color: "#E7157B",
    aliases: [
      "cloudhsm",
      "clusters",
      "hsm clusters",
      "hardware security module",
      "hsm",
      "pkcs11",
      "cryptographic operations",
    ],
  },
  {
    id: "feat-cloudhsm-create",
    name: "Create CloudHSM cluster",
    href: "/cloudhsm/create",
    serviceId: "cloudhsm",
    serviceName: "AWS CloudHSM",
    category: "Security, Identity, & Compliance",
    desc: "Create a FIPS 140-2 Level 3 validated CloudHSM cluster across VPC subnets",
    color: "#E7157B",
    aliases: ["create cluster", "new cluster", "create cloudhsm", "new hsm cluster", "provision hsm"],
  },
  {
    id: "feat-cloudhsm-backups",
    name: "CloudHSM Backups",
    href: "/cloudhsm/backups",
    serviceId: "cloudhsm",
    serviceName: "AWS CloudHSM",
    category: "Security, Identity, & Compliance",
    desc: "Automated and manual backups of CloudHSM clusters",
    color: "#E7157B",
    aliases: ["cloudhsm backups", "hsm backups", "cluster backups", "hsm snapshots"],
  },

  // Directory Service
  {
    id: "feat-ds-directories",
    name: "Active Directory Directories",
    href: "/directoryservice",
    serviceId: "directoryservice",
    serviceName: "AWS Directory Service",
    category: "Security, Identity, & Compliance",
    desc: "Managed Microsoft AD, Simple AD, and AD Connector directories in the cloud",
    color: "#E7157B",
    aliases: [
      "directoryservice",
      "directories",
      "active directory",
      "simple ad",
      "managed ad",
      "microsoft ad",
      "ad connector",
      "ldap",
      "domain controller",
      "single sign-on",
      "sso",
    ],
  },
  {
    id: "feat-ds-setup",
    name: "Set up directory",
    href: "/directoryservice/setup",
    serviceId: "directoryservice",
    serviceName: "AWS Directory Service",
    category: "Security, Identity, & Compliance",
    desc: "Set up a new AWS Managed Microsoft AD, Simple AD, or AD Connector directory",
    color: "#E7157B",
    aliases: [
      "create directory",
      "new directory",
      "setup directory",
      "create ad",
      "new active directory",
      "deploy domain controller",
    ],
  },

  // KMS
  {
    id: "feat-kms-customer",
    name: "Customer managed keys",
    href: "/kms",
    serviceId: "kms",
    serviceName: "AWS KMS",
    category: "Security, Identity, & Compliance",
    desc: "KMS encryption keys created, owned, and managed by your AWS account",
    color: "#E7157B",
    aliases: ["customer keys", "cmk", "kms keys", "encryption keys", "customer managed keys"],
  },
  {
    id: "feat-kms-aws",
    name: "AWS managed keys",
    href: "/kms/default-keys",
    serviceId: "kms",
    serviceName: "AWS KMS",
    category: "Security, Identity, & Compliance",
    desc: "Default service encryption keys managed on your behalf by AWS (aws/s3, aws/ssm)",
    color: "#E7157B",
    aliases: ["aws keys", "default keys", "aws/ssm", "aws/s3", "managed keys"],
  },
  {
    id: "feat-kms-create",
    name: "Create KMS key",
    href: "/kms/keys/create",
    serviceId: "kms",
    serviceName: "AWS KMS",
    category: "Security, Identity, & Compliance",
    desc: "Step-by-step wizard to create symmetric or asymmetric KMS keys with IAM policy",
    color: "#E7157B",
    aliases: ["create key", "new key", "generate key", "create kms key"],
  },

  // S3
  {
    id: "feat-s3-buckets",
    name: "S3 Buckets",
    href: "/s3",
    serviceId: "s3",
    serviceName: "Amazon S3",
    category: "Storage",
    desc: "Scalable object storage containers for files, backups, and static websites",
    color: "#3F8624",
    aliases: ["buckets", "s3 buckets", "file storage", "object storage", "blobs", "bucket list"],
  },

  // SQS
  {
    id: "feat-sqs-queues",
    name: "SQS Queues",
    href: "/sqs",
    serviceId: "sqs",
    serviceName: "Amazon SQS",
    category: "Application Integration",
    desc: "Standard and FIFO message queues for decoupling distributed software",
    color: "#E7157B",
    aliases: ["queues", "message queue", "fifo queue", "dead letter queue", "dlq"],
  },
  {
    id: "feat-sqs-create",
    name: "Create Queue",
    href: "/sqs/create",
    serviceId: "sqs",
    serviceName: "Amazon SQS",
    category: "Application Integration",
    desc: "Create a new Standard or FIFO Amazon SQS message queue",
    color: "#E7157B",
    aliases: ["create queue", "new queue", "add queue", "create sqs queue"],
  },

  // DynamoDB
  {
    id: "feat-ddb-tables",
    name: "DynamoDB Tables",
    href: "/dynamodb/tables",
    serviceId: "dynamodb",
    serviceName: "Amazon DynamoDB",
    category: "Database",
    desc: "Fast, flexible NoSQL database tables with single-digit millisecond latency",
    color: "#2E27AD",
    aliases: ["tables", "nosql tables", "dynamo tables", "items", "json database"],
  },
  {
    id: "feat-ddb-create-table",
    name: "Create DynamoDB table",
    href: "/dynamodb/tables/create",
    serviceId: "dynamodb",
    serviceName: "Amazon DynamoDB",
    category: "Database",
    desc: "Create a new Amazon DynamoDB NoSQL table with partition key and sort key",
    color: "#2E27AD",
    aliases: ["create table", "new table", "add table", "create dynamodb table"],
  },
  {
    id: "feat-ddb-explore-items",
    name: "Explore items",
    href: "/dynamodb/explore",
    serviceId: "dynamodb",
    serviceName: "Amazon DynamoDB",
    category: "Database",
    desc: "Scan and query items across your Amazon DynamoDB tables",
    color: "#2E27AD",
    aliases: ["explore items", "scan items", "query items", "scan table", "query table"],
  },
  {
    id: "feat-ddb-backups",
    name: "DynamoDB Backups",
    href: "/dynamodb/backups",
    serviceId: "dynamodb",
    serviceName: "Amazon DynamoDB",
    category: "Database",
    desc: "Manage on-demand backups and point-in-time recovery for DynamoDB tables",
    color: "#2E27AD",
    aliases: ["backups", "table backups", "pitr", "restore table"],
  },

  // IAM
  {
    id: "feat-iam-users",
    name: "IAM Users",
    href: "/iam/users",
    serviceId: "iam",
    serviceName: "AWS IAM",
    category: "Security, Identity, & Compliance",
    desc: "Create and manage individual user identities, passwords, and access keys",
    color: "#DD3522",
    aliases: ["users", "iam users", "credentials", "access keys"],
  },
  {
    id: "feat-iam-roles",
    name: "IAM Roles",
    href: "/iam/roles",
    serviceId: "iam",
    serviceName: "AWS IAM",
    category: "Security, Identity, & Compliance",
    desc: "Delegable identities with specific permissions assumed by AWS services and users",
    color: "#DD3522",
    aliases: ["roles", "iam roles", "instance profile", "service role"],
  },
  {
    id: "feat-iam-policies",
    name: "IAM Policies",
    href: "/iam/policies",
    serviceId: "iam",
    serviceName: "AWS IAM",
    category: "Security, Identity, & Compliance",
    desc: "JSON permission documents defining allowable actions and resources",
    color: "#DD3522",
    aliases: ["policies", "iam policies", "permissions", "json policy"],
  },

  // EC2
  {
    id: "feat-ec2-instances",
    name: "EC2 Instances",
    href: "/ec2/instances",
    serviceId: "ec2",
    serviceName: "Amazon EC2",
    category: "Compute",
    desc: "Launch, inspect, start, stop, and terminate virtual cloud server instances",
    color: "#FF9900",
    aliases: ["instances", "virtual machines", "servers", "vms", "ec2 instances"],
  },
  {
    id: "feat-ec2-elbv2",
    name: "Load Balancers",
    href: "/ec2/load-balancers",
    serviceId: "ec2",
    serviceName: "Amazon EC2",
    category: "Networking & Content Delivery",
    desc: "Distribute incoming application traffic across multiple targets (ALB / NLB)",
    color: "#8C4FFF",
    aliases: ["load balancers", "alb", "nlb", "elb", "elastic load balancing"],
  },
  {
    id: "feat-ec2-target-groups",
    name: "Target Groups",
    href: "/ec2/target-groups",
    serviceId: "ec2",
    serviceName: "Amazon EC2",
    category: "Networking & Content Delivery",
    desc: "Route requests to registered compute targets with configurable health checks",
    color: "#8C4FFF",
    aliases: ["target groups", "backend targets", "health check targets"],
  },
  {
    id: "feat-ec2-asg",
    name: "Auto Scaling Groups",
    href: "/ec2/auto-scaling-groups",
    serviceId: "ec2",
    serviceName: "Amazon EC2",
    category: "Compute",
    desc: "Automatically add or remove compute instances to match traffic demand",
    color: "#FF9900",
    aliases: ["auto scaling", "asg", "scaling policies", "dynamic scaling"],
  },

  // Resource Groups & Tag Editor
  {
    id: "feat-tag-editor",
    name: "Tag Editor",
    href: "/resource-groups/tag-editor",
    serviceId: "resource-groups",
    serviceName: "Resource Groups",
    category: "Management & Governance",
    desc: "Search resources across AWS services and Regions to bulk edit or remove tags",
    color: "#C925D1",
    aliases: ["tag editor", "bulk tagging", "find resources by tag", "tags"],
  },

  // Service Quotas
  {
    id: "feat-quota-requests",
    name: "Quota Increase Requests",
    href: "/service-quotas/requests",
    serviceId: "service-quotas",
    serviceName: "Service Quotas",
    category: "Management & Governance",
    desc: "Track and review requested quota increases across all AWS services",
    color: "#C925D1",
    aliases: ["quota requests", "request increase", "increase limit", "limit increase"],
  },

  // Account Management
  {
    id: "feat-account-contacts",
    name: "Alternate Contacts",
    href: "/account/alternate-contacts",
    serviceId: "account",
    serviceName: "Account Management",
    category: "Management & Governance",
    desc: "Configure Billing, Operations, and Security alternate notification contacts",
    color: "#C925D1",
    aliases: ["alternate contacts", "billing contact", "security contact", "ops contact"],
  },
  {
    id: "feat-account-regions",
    name: "AWS Regions Opt-in",
    href: "/account/regions",
    serviceId: "account",
    serviceName: "Account Management",
    category: "Management & Governance",
    desc: "Enable or disable global AWS Region availability for your account",
    color: "#C925D1",
    aliases: ["regions", "opt-in regions", "enable region", "region availability"],
  },
  // Amazon S3 Glacier
  {
    id: "feat-glacier-vaults",
    name: "Glacier Vaults",
    href: "/glacier",
    serviceId: "glacier",
    serviceName: "Amazon S3 Glacier",
    category: "Storage",
    desc: "Manage S3 Glacier vaults, view archives, and initiate inventory jobs",
    color: "#3B8526",
    aliases: ["glacier", "s3 glacier", "vaults", "cold storage", "glacier archives"],
  },
  {
    id: "feat-glacier-create",
    name: "Create vault",
    href: "/glacier/create",
    serviceId: "glacier",
    serviceName: "Amazon S3 Glacier",
    category: "Storage",
    desc: "Create a new Amazon S3 Glacier vault with optional event notifications",
    color: "#3B8526",
    aliases: ["create vault", "new vault", "add vault", "create glacier vault"],
  },
  {
    id: "feat-glacier-settings",
    name: "Data retrieval policies",
    href: "/glacier/settings",
    serviceId: "glacier",
    serviceName: "Amazon S3 Glacier",
    category: "Storage",
    desc: "Manage Glacier data retrieval rate limits and Free Tier policies",
    color: "#3B8526",
    aliases: ["glacier settings", "data retrieval policies", "retrieval rate", "free tier retrieval"],
  },
  // Amazon SNS
  {
    id: "feat-sns-topics",
    name: "SNS Topics",
    href: "/sns/topics",
    serviceId: "sns",
    serviceName: "Amazon Simple Notification Service",
    category: "Application Integration",
    desc: "Manage SNS notification topics, publish messages, and configure subscriptions",
    color: "#FF4F8B",
    aliases: ["sns", "topics", "publish", "pubsub", "fanout"],
  },
  {
    id: "feat-sns-create-topic",
    name: "Create topic",
    href: "/sns/topics/create",
    serviceId: "sns",
    serviceName: "Amazon Simple Notification Service",
    category: "Application Integration",
    desc: "Create a new Standard or FIFO Amazon SNS notification topic",
    color: "#FF4F8B",
    aliases: ["create topic", "new topic", "add topic", "create sns topic"],
  },
  {
    id: "feat-sns-subscriptions",
    name: "SNS Subscriptions",
    href: "/sns/subscriptions",
    serviceId: "sns",
    serviceName: "Amazon Simple Notification Service",
    category: "Application Integration",
    desc: "View and manage topic endpoints for SQS, Lambda, email, and HTTP/S",
    color: "#FF4F8B",
    aliases: ["subscriptions", "subscribers", "endpoints", "sqs subscription"],
  },
  {
    id: "feat-sns-create-sub",
    name: "Create subscription",
    href: "/sns/subscriptions/create",
    serviceId: "sns",
    serviceName: "Amazon Simple Notification Service",
    category: "Application Integration",
    desc: "Subscribe an SQS queue, Lambda function, email, or HTTP/S endpoint to an SNS topic",
    color: "#FF4F8B",
    aliases: ["create subscription", "subscribe", "new subscription", "add subscription"],
  },
  // Amazon Keyspaces (for Apache Cassandra)
  {
    id: "feat-keyspaces-list",
    name: "Keyspaces",
    href: "/keyspaces",
    serviceId: "keyspaces",
    serviceName: "Amazon Keyspaces",
    category: "Database",
    desc: "Manage Apache Cassandra-compatible keyspaces and tables",
    color: "#2E27AD",
    aliases: ["keyspaces", "cassandra", "cql", "keyspace", "nosql"],
  },
  {
    id: "feat-keyspaces-create",
    name: "Create keyspace",
    href: "/keyspaces/create",
    serviceId: "keyspaces",
    serviceName: "Amazon Keyspaces",
    category: "Database",
    desc: "Create a new Amazon Keyspaces keyspace with replication settings",
    color: "#2E27AD",
    aliases: ["create keyspace", "new keyspace", "add keyspace"],
  },
  {
    id: "feat-keyspaces-config",
    name: "Keyspaces configuration",
    href: "/keyspaces/configuration",
    serviceId: "keyspaces",
    serviceName: "Amazon Keyspaces",
    category: "Database",
    desc: "View Cassandra endpoints, TLS connectivity, and service quotas",
    color: "#2E27AD",
    aliases: ["keyspaces config", "cassandra endpoint", "cql connection"],
  },
  // Amazon Timestream
  {
    id: "feat-timestream-databases",
    name: "Timestream databases",
    href: "/timestream",
    serviceId: "timestream",
    serviceName: "Amazon Timestream",
    category: "Database",
    desc: "Manage serverless time-series databases and tables",
    color: "#2E27AD",
    aliases: ["timestream", "time series", "timeseries", "telemetry", "iot database"],
  },
  {
    id: "feat-timestream-create-db",
    name: "Create Timestream database",
    href: "/timestream/databases/create",
    serviceId: "timestream",
    serviceName: "Amazon Timestream",
    category: "Database",
    desc: "Create a new Amazon Timestream database with KMS encryption",
    color: "#2E27AD",
    aliases: ["create database", "new database", "timestream db"],
  },
  {
    id: "feat-timestream-query",
    name: "Timestream query editor",
    href: "/timestream/query",
    serviceId: "timestream",
    serviceName: "Amazon Timestream",
    category: "Database",
    desc: "Query time-series telemetry data using SQL",
    color: "#2E27AD",
    aliases: ["timestream query", "sql query", "time series query"],
  },
  {
    id: "feat-timestream-influxdb",
    name: "Timestream for InfluxDB",
    href: "/timestream/influxdb",
    serviceId: "timestream",
    serviceName: "Amazon Timestream",
    category: "Database",
    desc: "Managed open-source InfluxDB time-series instances",
    color: "#2E27AD",
    aliases: ["influxdb", "influx", "flux", "timestream influxdb"],
  },
  // Amazon Kinesis Data Streams
  {
    id: "feat-kinesis-streams",
    name: "Kinesis data streams",
    href: "/kinesis",
    serviceId: "kinesis",
    serviceName: "Amazon Kinesis Data Streams",
    category: "Analytics",
    desc: "Real-time streaming data ingestion, shards, and consumer processing",
    color: "#8C4FFF",
    aliases: ["kinesis", "data streams", "streaming", "kinesis streams", "shards", "kds"],
  },
  {
    id: "feat-kinesis-create-stream",
    name: "Create data stream",
    href: "/kinesis/streams/create",
    serviceId: "kinesis",
    serviceName: "Amazon Kinesis Data Streams",
    category: "Analytics",
    desc: "Create a new Kinesis data stream with on-demand or provisioned capacity",
    color: "#8C4FFF",
    aliases: ["create stream", "new stream", "create data stream", "kinesis create"],
  },
  // Amazon Elastic Container Registry (ECR)
  {
    id: "feat-ecr-repositories",
    name: "ECR repositories",
    href: "/ecr/repositories",
    serviceId: "ecr",
    serviceName: "Amazon Elastic Container Registry",
    category: "Containers",
    desc: "Store, manage, and deploy Docker container images and OCI artifacts",
    color: "#FF9900",
    aliases: ["ecr", "repositories", "docker", "images", "container registry", "private repositories"],
  },
  {
    id: "feat-ecr-create-repo",
    name: "Create ECR repository",
    href: "/ecr/repositories/create",
    serviceId: "ecr",
    serviceName: "Amazon Elastic Container Registry",
    category: "Containers",
    desc: "Create a new private or public container image repository",
    color: "#FF9900",
    aliases: ["create repository", "new repository", "create ecr", "new ecr repo"],
  },
  {
    id: "feat-ecr-registry-settings",
    name: "ECR registry settings",
    href: "/ecr/registry-settings",
    serviceId: "ecr",
    serviceName: "Amazon Elastic Container Registry",
    category: "Containers",
    desc: "Configure container vulnerability scanning, replication, and pull through cache rules",
    color: "#FF9900",
    aliases: ["registry settings", "ecr settings", "pull through cache", "ecr replication"],
  },
  // Amazon Simple Email Service (SES)
  {
    id: "feat-ses-identities",
    name: "Verified identities",
    href: "/ses/identities",
    serviceId: "ses",
    serviceName: "Amazon Simple Email Service",
    category: "Business Applications",
    desc: "Manage verified email addresses and domains for sending emails",
    color: "#DD344C",
    aliases: ["ses", "identities", "verified identities", "domains", "email addresses", "dkim", "mail"],
  },
  {
    id: "feat-ses-create-identity",
    name: "Create identity",
    href: "/ses/identities/create",
    serviceId: "ses",
    serviceName: "Amazon Simple Email Service",
    category: "Business Applications",
    desc: "Verify a new domain or email address to authorize email sending",
    color: "#DD344C",
    aliases: ["create identity", "verify domain", "verify email", "add email", "add domain"],
  },
  {
    id: "feat-ses-templates",
    name: "Email templates",
    href: "/ses/templates",
    serviceId: "ses",
    serviceName: "Amazon Simple Email Service",
    category: "Business Applications",
    desc: "Create and manage reusable HTML and text email templates with replacement tags",
    color: "#DD344C",
    aliases: ["email templates", "ses templates", "templates", "mustache", "html email"],
  },
  {
    id: "feat-ses-config-sets",
    name: "Configuration sets",
    href: "/ses/configuration-sets",
    serviceId: "ses",
    serviceName: "Amazon Simple Email Service",
    category: "Business Applications",
    desc: "Manage rules and event destinations for tracking email delivery, bounces, and opens",
    color: "#DD344C",
    aliases: ["configuration sets", "config sets", "event destinations", "ses tracking"],
  },
  {
    id: "feat-ses-smtp",
    name: "SMTP settings",
    href: "/ses/smtp",
    serviceId: "ses",
    serviceName: "Amazon Simple Email Service",
    category: "Business Applications",
    desc: "View SMTP endpoints, ports, and generate IAM credentials for SMTP sending",
    color: "#DD344C",
    aliases: ["smtp", "smtp settings", "smtp credentials", "mail server", "smtp credentials"],
  },
  {
    id: "feat-ses-suppression",
    name: "Suppression list",
    href: "/ses/suppression-list",
    serviceId: "ses",
    serviceName: "Amazon Simple Email Service",
    category: "Business Applications",
    desc: "Manage account-level suppression list for bounced and complained recipients",
    color: "#DD344C",
    aliases: ["suppression list", "suppressed", "bounces", "complaints", "blocklist"],
  },

  // AWS AppConfig
  {
    id: "feat-appconfig-applications",
    name: "AppConfig Applications",
    href: "/appconfig/applications",
    serviceId: "appconfig",
    serviceName: "AWS AppConfig",
    category: "Management & Governance",
    desc: "Create and manage applications, environments, and configuration profiles",
    color: "#C925D1",
    aliases: ["appconfig applications", "applications", "apps", "app config"],
  },
  {
    id: "feat-appconfig-strategies",
    name: "Deployment Strategies",
    href: "/appconfig/deployment-strategies",
    serviceId: "appconfig",
    serviceName: "AWS AppConfig",
    category: "Management & Governance",
    desc: "Configure deployment duration, growth type, and bake time for safe deployments",
    color: "#C925D1",
    aliases: ["deployment strategies", "deployment strategy", "bake time", "linear", "canary", "allatonce"],
  },
  {
    id: "feat-appconfig-feature-flags",
    name: "Feature Flags",
    href: "/appconfig/applications",
    serviceId: "appconfig",
    serviceName: "AWS AppConfig",
    category: "Management & Governance",
    desc: "Safely create, toggle, and deploy dynamic feature flags to applications",
    color: "#C925D1",
    aliases: ["feature flags", "feature flag", "flags", "toggles", "appconfig flags"],
  },
  // Amazon Location Service
  {
    id: "feat-location-maps",
    name: "Maps",
    href: "/location/maps",
    serviceId: "location",
    serviceName: "Amazon Location Service",
    category: "Front-End Web & Mobile",
    desc: "Create and configure interactive map resources styled with Esri, HERE, and Open Data",
    color: "#00A4A6",
    aliases: ["maps", "map", "esri", "vector maps", "location maps", "tiles", "map style"],
  },
  {
    id: "feat-location-trackers",
    name: "Trackers",
    href: "/location/trackers",
    serviceId: "location",
    serviceName: "Amazon Location Service",
    category: "Front-End Web & Mobile",
    desc: "Receive, filter, and track real-time IoT and device location updates",
    color: "#00A4A6",
    aliases: ["trackers", "tracker", "device tracking", "device positions", "telemetry", "asset tracking"],
  },
  {
    id: "feat-location-geofences",
    name: "Geofence Collections",
    href: "/location/geofences",
    serviceId: "location",
    serviceName: "Amazon Location Service",
    category: "Front-End Web & Mobile",
    desc: "Define virtual geographic boundaries and evaluate entry/exit events",
    color: "#00A4A6",
    aliases: ["geofences", "geofence", "geofence collections", "perimeter", "circles", "polygons"],
  },
  {
    id: "feat-location-routes",
    name: "Route Calculators",
    href: "/location/routes",
    serviceId: "location",
    serviceName: "Amazon Location Service",
    category: "Front-End Web & Mobile",
    desc: "Calculate travel time, distance, and optimal directions between coordinates",
    color: "#00A4A6",
    aliases: ["routes", "route calculators", "routing", "directions", "distance matrix", "travel time"],
  },
  {
    id: "feat-location-places",
    name: "Place Indexes",
    href: "/location/places",
    serviceId: "location",
    serviceName: "Amazon Location Service",
    category: "Front-End Web & Mobile",
    desc: "Search for addresses, points of interest, and reverse geocode coordinates",
    color: "#00A4A6",
    aliases: ["places", "place index", "geocoding", "reverse geocoding", "search places", "addresses"],
  },
  {
    id: "feat-location-api-keys",
    name: "API Keys",
    href: "/location/api-keys",
    serviceId: "location",
    serviceName: "Amazon Location Service",
    category: "Front-End Web & Mobile",
    desc: "Manage API keys for public client applications and web map rendering",
    color: "#00A4A6",
    aliases: ["api keys", "location api keys", "map keys", "credentials", "access keys"],
  },
];

// Acronym and common synonym expansion dictionary
const ACRONYM_MAP: Record<string, string[]> = {
  location: ["location", "maps", "trackers", "geofences", "routes", "places", "gis", "geospatial", "coordinates"],
  geo: ["location", "service", "maps", "geofencing", "tracking"],
  appconfig: ["appconfig", "app", "config", "feature", "flags", "deployment", "strategy", "configuration", "profiles"],
  ses: ["simple", "email", "service", "smtp", "mail", "identities", "templates", "dkim", "sendmail"],
  ecr: ["elastic", "container", "registry", "docker", "images", "repositories", "oci", "containers"],
  kinesis: ["kinesis", "kds", "streams", "streaming", "shards", "analytics", "records", "data streams"],
  kds: ["kinesis", "data", "streams"],
  timestream: ["timestream", "timeseries", "telemetry", "database", "influxdb", "metrics"],
  keyspaces: ["keyspaces", "cassandra", "cql", "database", "tables"],
  sns: ["simple", "notification", "service", "pubsub", "topics"],
  ssm: ["systems", "manager", "parameter", "store"],
  acm: ["certificate", "manager", "ssl", "tls"],
  kms: ["key", "management", "service", "encryption"],
  sqs: ["simple", "queue", "service", "messaging"],
  iam: ["identity", "access", "management", "users", "roles"],
  elb: ["elastic", "load", "balancing", "balancer"],
  alb: ["application", "load", "balancer"],
  nlb: ["network", "load", "balancer"],
  asg: ["auto", "scaling", "group"],
  ram: ["resource", "access", "manager", "sharing"],
  ddb: ["dynamodb", "nosql", "tables"],
  sm: ["secrets", "manager", "credentials"],
  ec2: ["elastic", "compute", "cloud", "instances", "virtual", "machines"],
  s3: ["simple", "storage", "service", "buckets", "objects"],
  r53: ["route", "53", "dns", "domains"],
  cw: ["cloudwatch", "logs", "metrics"],
  cfn: ["cloudformation", "templates"],
  ebs: ["elastic", "block", "store", "volumes"],
  vpc: ["virtual", "private", "cloud", "networking"],
};

/**
 * Calculates a match score for a searchable item against query and tokens.
 */
function calculateScore(
  name: string,
  shortName: string,
  desc: string,
  category: string,
  aliases: string[] = [],
  status?: string,
  rawQuery: string = "",
  tokens: string[] = []
): number {
  const query = rawQuery.toLowerCase().trim();
  if (!query) return 0;

  const nameLower = name.toLowerCase();
  const shortLower = shortName.toLowerCase();
  const descLower = desc.toLowerCase();
  const catLower = category.toLowerCase();
  const aliasLower = aliases.map((a) => a.toLowerCase());
  const combined = `${nameLower} ${shortLower} ${aliasLower.join(" ")} ${descLower} ${catLower}`;

  let score = 0;

  // 1. Exact full query match
  if (nameLower === query || shortLower === query) {
    score += 350;
  } else if (aliasLower.some((a) => a === query)) {
    score += 300;
  } else if (nameLower.startsWith(query) || shortLower.startsWith(query)) {
    score += 220;
  } else if (nameLower.includes(query) || shortLower.includes(query)) {
    score += 180;
  } else if (aliasLower.some((a) => a.includes(query))) {
    score += 150;
  } else if (combined.includes(query)) {
    score += 110;
  }

  // 2. Multi-token evaluation
  let matchedTokens = 0;
  for (const t of tokens) {
    if (!t) continue;
    let hit = false;

    if (nameLower.includes(t)) {
      score += 45;
      hit = true;
    }
    if (shortLower.includes(t)) {
      score += 40;
      hit = true;
    }
    if (aliasLower.some((a) => a.includes(t))) {
      score += 35;
      hit = true;
    }
    if (descLower.includes(t)) {
      score += 15;
      hit = true;
    }
    if (catLower.includes(t)) {
      score += 10;
      hit = true;
    }

    if (hit) matchedTokens++;
  }

  // If query had multiple tokens and all matched, provide significant bonus
  if (tokens.length > 1 && matchedTokens === tokens.length) {
    score += 90;
  }

  // If no tokens matched and no direct full query match, score is 0
  if (matchedTokens === 0 && !combined.includes(query)) {
    return 0;
  }

  // Filter out weak partial matches when many tokens were given
  if (tokens.length >= 3 && matchedTokens < Math.ceil(tokens.length * 0.5)) {
    return 0;
  }

  // If there was no match, score remains 0
  if (score <= 0) {
    return 0;
  }

  // Functional/emulator boost so usable pages rise to top
  if (status === "functional" || status === "emulator") {
    score += 30;
  }

  return score;
}

/**
 * Searches across all AWS Services and Features with intelligent ranking.
 */
export function searchServicesAndFeatures(rawQuery: string): SearchMatchResult {
  const query = rawQuery.toLowerCase().trim();
  if (!query) {
    return { services: [], features: [], totalMatches: 0 };
  }

  // Build token set including acronym expansions
  const baseTokens = query
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const expandedTokens = new Set<string>(baseTokens);
  for (const t of baseTokens) {
    if (ACRONYM_MAP[t]) {
      ACRONYM_MAP[t].forEach((word) => expandedTokens.add(word));
    }
  }
  const allTokens = Array.from(expandedTokens);

  // Score Services
  const scoredServices = ALL_SERVICES.map((s) => {
    const score = calculateScore(
      s.name,
      s.shortName,
      s.desc,
      s.category,
      s.aliases || [],
      s.status,
      query,
      allTokens
    );
    return { service: s, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.service);

  // Score Features
  const scoredFeatures = COMMON_FEATURES.map((f) => {
    const score = calculateScore(
      f.name,
      f.serviceName,
      f.desc,
      f.category,
      f.aliases,
      "functional",
      query,
      allTokens
    );
    return { feature: f, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.feature);

  return {
    services: scoredServices.slice(0, 10),
    features: scoredFeatures.slice(0, 6),
    totalMatches: scoredServices.length + scoredFeatures.length,
  };
}
