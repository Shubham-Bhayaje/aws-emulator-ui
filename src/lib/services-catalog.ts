/**
 * AWS Services Catalog – Full catalog of 200+ AWS services.
 * Curated for the AWS Emulator UI.
 */

export interface ServiceDefinition {
  id: string;
  name: string;
  shortName: string;
  href: string;
  category: string;
  desc: string;
  color?: string;
  status?: "functional" | "emulator" | "preview" | "mock" | "coming-soon";
  aliases?: string[];
}

export interface ServiceCategory {
  category: string;
  services: ServiceDefinition[];
}

/**
 * Set of service IDs that are 100% built, fully functional, and verified with the local AWS emulator.
 * Strict exact IDs only – never partial or substring matches.
 */
export const FULLY_BUILT_SERVICE_IDS = new Set<string>([
  "ec2",
  "lambda",
  "s3",
  "dynamodb",
  "sqs",
  "iam",
  "kms",
  "acm",
  "acm-pca",
  "pca",
  "private-ca",
  "cloudhsm",
  "directoryservice",
  "directory-service",
  "ds",
  "secretsmanager",
  "systems-manager",
  "ssm-parameter-store",
  "organizations",
  "ram",
  "resource-groups",
  "service-quotas",
  "account",
  "glacier",
  "s3-glacier",
  "s3glacier",
  "sns",
  "dynamodb",
  "keyspaces",
  "timestream",
  "kinesis",
  "ecr",
  "ses",
  "simple-email-service",
  "amazon-ses",
  "appconfig",
  "aws-appconfig",
]);

export function isServiceFullyBuilt(idOrHref: string): boolean {
  if (!idOrHref) return false;
  const clean = idOrHref.toLowerCase().trim().replace(/^\//, "");
  if (FULLY_BUILT_SERVICE_IDS.has(clean)) return true;
  if (clean === "appconfig" || clean.startsWith("appconfig/")) return true;
  if (clean === "ecr" || clean.startsWith("ecr/")) return true;
  if (clean === "ses" || clean.startsWith("ses/")) return true;
  if (clean === "kinesis" || clean.startsWith("kinesis/")) return true;
  if (clean === "timestream" || clean.startsWith("timestream/")) return true;
  if (clean === "keyspaces" || clean.startsWith("keyspaces/")) return true;
  if (clean === "glacier" || clean.startsWith("glacier/") || clean === "s3-glacier" || clean === "s3glacier") return true;
  if (clean === "systems-manager/parameter-store") return true;
  if (clean === "acm/pca" || clean === "acm-pca" || clean === "pca" || clean === "private-ca") return true;
  if (clean === "cloudhsm" || clean.startsWith("cloudhsm/")) return true;
  if (clean === "directoryservice" || clean.startsWith("directoryservice/") || clean === "directory-service" || clean === "ds") return true;
  if (clean === "cloudwatch" || clean.startsWith("cloudwatch/") || clean === "logs" || clean.startsWith("logs/")) return true;
  return false;
}

export const ALL_SERVICES: ServiceDefinition[] = [
  {
    "id": "ec2",
    "name": "Amazon EC2",
    "shortName": "EC2",
    "href": "/ec2",
    "category": "Compute",
    "color": "#FF9900",
    "status": "functional",
    "desc": "Virtual servers in the cloud with scalable capacity",
    "aliases": ["ec2", "instances", "virtual machines", "virtual machine", "servers", "vms", "compute", "ami"]
  },
  {
    "id": "lambda",
    "name": "AWS Lambda",
    "shortName": "Lambda",
    "href": "/lambda",
    "category": "Compute",
    "color": "#FF9900",
    "status": "functional",
    "desc": "Run code without thinking about servers or clusters"
  },
  {
    "id": "elasticbeanstalk",
    "name": "AWS Elastic Beanstalk",
    "shortName": "Elastic Beanstalk",
    "href": "/elasticbeanstalk",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Deploy and scale web applications and services quickly"
  },
  {
    "id": "lightsail",
    "name": "Amazon Lightsail",
    "shortName": "Lightsail",
    "href": "/lightsail",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Easy-to-use virtual private server instances and databases"
  },
  {
    "id": "batch",
    "name": "AWS Batch",
    "shortName": "Batch",
    "href": "/batch",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Run fully managed batch computing jobs at any scale"
  },
  {
    "id": "apprunner",
    "name": "AWS App Runner",
    "shortName": "App Runner",
    "href": "/apprunner",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Build and run containerized web apps and APIs at scale"
  },
  {
    "id": "outposts",
    "name": "AWS Outposts",
    "shortName": "Outposts",
    "href": "/outposts",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Run AWS infrastructure and services on-premises for a consistent hybrid experience"
  },
  {
    "id": "serverlessrepo",
    "name": "AWS Serverless Application Repository",
    "shortName": "Serverless Repo",
    "href": "/serverlessrepo",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Discover, deploy, and publish serverless applications"
  },
  {
    "id": "wavelength",
    "name": "AWS Wavelength",
    "shortName": "Wavelength",
    "href": "/wavelength",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Deliver ultra-low latency applications for 5G devices"
  },
  {
    "id": "vmware-cloud",
    "name": "VMware Cloud on AWS",
    "shortName": "VMware Cloud",
    "href": "/vmware-cloud",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Migrate and extend VMware environments to AWS cloud"
  },
  {
    "id": "localzones",
    "name": "AWS Local Zones",
    "shortName": "Local Zones",
    "href": "/localzones",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Run latency-sensitive applications closer to end users"
  },
  {
    "id": "image-builder",
    "name": "EC2 Image Builder",
    "shortName": "Image Builder",
    "href": "/image-builder",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Build and maintain secure, compliant operating system images"
  },
  {
    "id": "simspaceweaver",
    "name": "AWS SimSpace Weaver",
    "shortName": "SimSpace Weaver",
    "href": "/simspaceweaver",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Run large-scale spatial simulations in the cloud"
  },
  {
    "id": "mainframe-modernization",
    "name": "AWS Mainframe Modernization",
    "shortName": "Mainframe Modernization",
    "href": "/mainframe-modernization",
    "category": "Compute",
    "color": "#FF9900",
    "desc": "Migrate, modernize, and run mainframe workloads on AWS"
  },
  {
    "id": "ecs",
    "name": "Amazon Elastic Container Service",
    "shortName": "ECS",
    "href": "/ecs",
    "category": "Containers",
    "color": "#FF9900",
    "desc": "Highly secure, reliable, and scalable way to run containers"
  },
  {
    "id": "eks",
    "name": "Amazon Elastic Kubernetes Service",
    "shortName": "EKS",
    "href": "/eks",
    "category": "Containers",
    "color": "#FF9900",
    "desc": "Run managed Kubernetes container clusters on AWS"
  },
  {
    "id": "ecr",
    "name": "Amazon Elastic Container Registry",
    "shortName": "ECR",
    "href": "/ecr",
    "category": "Containers",
    "color": "#FF9900",
    "desc": "Easily store, manage, share, and deploy container images"
  },
  {
    "id": "rosa",
    "name": "Red Hat OpenShift on AWS",
    "shortName": "ROSA",
    "href": "/rosa",
    "category": "Containers",
    "color": "#FF9900",
    "desc": "Managed Red Hat OpenShift service on AWS infrastructure"
  },
  {
    "id": "app2container",
    "name": "AWS App2Container",
    "shortName": "App2Container",
    "href": "/app2container",
    "category": "Containers",
    "color": "#FF9900",
    "desc": "Containerize and migrate existing Java and .NET web applications"
  },
  {
    "id": "eks-anywhere",
    "name": "Amazon EKS Anywhere",
    "shortName": "EKS Anywhere",
    "href": "/eks-anywhere",
    "category": "Containers",
    "color": "#FF9900",
    "desc": "Create and operate Kubernetes clusters on customer-managed infrastructure"
  },
  {
    "id": "ecs-anywhere",
    "name": "Amazon ECS Anywhere",
    "shortName": "ECS Anywhere",
    "href": "/ecs-anywhere",
    "category": "Containers",
    "color": "#FF9900",
    "desc": "Run container workloads on customer infrastructure with ECS"
  },
  {
    "id": "s3",
    "name": "Amazon Simple Storage Service",
    "shortName": "S3",
    "href": "/s3",
    "category": "Storage",
    "color": "#3F8624",
    "status": "functional",
    "desc": "Scalable object storage in the cloud with industry-leading durability",
    "aliases": ["s3", "buckets", "bucket", "object storage", "objects", "blobs", "amazon s3"]
  },
  {
    "id": "efs",
    "name": "Amazon Elastic File System",
    "shortName": "EFS",
    "href": "/efs",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "Serverless, fully elastic file storage for EC2 and containers"
  },
  {
    "id": "fsx",
    "name": "Amazon FSx",
    "shortName": "FSx",
    "href": "/fsx",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "Fully managed third-party file systems (NetApp, Windows, Lustre, OpenZFS)"
  },
  {
    "id": "glacier",
    "name": "Amazon S3 Glacier",
    "shortName": "S3 Glacier",
    "href": "/glacier",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "Low-cost archive storage in the cloud for compliance and long-term retention",
    "aliases": ["glacier", "s3glacier", "s3-glacier", "s3 glacier", "glaciervaults", "glacier-vaults", "vaults", "archive", "archives", "cold storage"]
  },
  {
    "id": "backup",
    "name": "AWS Backup",
    "shortName": "Backup",
    "href": "/backup",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "Centralized backup management across AWS services and hybrid workloads"
  },
  {
    "id": "storagegateway",
    "name": "AWS Storage Gateway",
    "shortName": "Storage Gateway",
    "href": "/storagegateway",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "Hybrid cloud storage with local caching for seamless on-premises access"
  },
  {
    "id": "ebs",
    "name": "Amazon Elastic Block Store",
    "shortName": "EBS",
    "href": "/ebs",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "High-performance block storage volumes designed for Amazon EC2"
  },
  {
    "id": "snowball",
    "name": "AWS Snow Family",
    "shortName": "Snow Family",
    "href": "/snowball",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "Physical edge computing and data migration devices for extreme environments"
  },
  {
    "id": "datasync",
    "name": "AWS DataSync",
    "shortName": "DataSync",
    "href": "/datasync",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "Automate high-speed data transfer between on-premises and AWS storage"
  },
  {
    "id": "drs",
    "name": "AWS Elastic Disaster Recovery",
    "shortName": "Disaster Recovery",
    "href": "/drs",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "Fast, reliable recovery of physical, virtual, and cloud servers"
  },
  {
    "id": "transfer",
    "name": "AWS Transfer Family",
    "shortName": "Transfer Family",
    "href": "/transfer",
    "category": "Storage",
    "color": "#3F8624",
    "desc": "Fully managed SFTP, FTPS, and FTP support for Amazon S3 and EFS"
  },
  {
    "id": "dynamodb",
    "name": "Amazon DynamoDB",
    "shortName": "DynamoDB",
    "href": "/dynamodb",
    "category": "Database",
    "color": "#2E27AD",
    "status": "functional",
    "desc": "Managed NoSQL key-value and document database with single-digit millisecond latency",
    "aliases": ["dynamo", "dynamodb", "nosql", "tables", "table", "key-value database", "items", "ddb"]
  },
  {
    "id": "rds",
    "name": "Amazon Relational Database Service",
    "shortName": "RDS",
    "href": "/rds",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "Managed relational database service for MySQL, PostgreSQL, MariaDB, Oracle, SQL Server"
  },
  {
    "id": "aurora",
    "name": "Amazon Aurora",
    "shortName": "Aurora",
    "href": "/aurora",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "High performance MySQL and PostgreSQL compatible enterprise database"
  },
  {
    "id": "elasticache",
    "name": "Amazon ElastiCache",
    "shortName": "ElastiCache",
    "href": "/elasticache",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "In-memory caching service for Redis and Memcached with microsecond latency"
  },
  {
    "id": "memorydb",
    "name": "Amazon MemoryDB for Redis",
    "shortName": "MemoryDB",
    "href": "/memorydb",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "Redis-compatible, durable in-memory database service with ultra-fast performance"
  },
  {
    "id": "redshift",
    "name": "Amazon Redshift",
    "shortName": "Redshift",
    "href": "/redshift",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "Fast, simple, cost-effective data warehousing and analytics at petabyte scale"
  },
  {
    "id": "neptune",
    "name": "Amazon Neptune",
    "shortName": "Neptune",
    "href": "/neptune",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "Fast, reliable graph database built for highly connected datasets"
  },
  {
    "id": "documentdb",
    "name": "Amazon DocumentDB",
    "shortName": "DocumentDB",
    "href": "/documentdb",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "Fully managed MongoDB-compatible document database with JSON workload support"
  },
  {
    "id": "keyspaces",
    "name": "Amazon Keyspaces",
    "shortName": "Keyspaces",
    "href": "/keyspaces",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "Managed Apache Cassandra-compatible database service"
  },
  {
    "id": "timestream",
    "name": "Amazon Timestream",
    "shortName": "Timestream",
    "href": "/timestream",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "Fast, scalable time-series database for IoT and telemetry applications"
  },
  {
    "id": "qldb",
    "name": "Amazon QLDB",
    "shortName": "QLDB",
    "href": "/qldb",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "Fully managed ledger database providing a transparent, immutable transaction log"
  },
  {
    "id": "rds-custom",
    "name": "Amazon RDS Custom",
    "shortName": "RDS Custom",
    "href": "/rds-custom",
    "category": "Database",
    "color": "#2E27AD",
    "desc": "Managed database with OS and database environment customization"
  },
  {
    "id": "vpc",
    "name": "Amazon Virtual Private Cloud",
    "shortName": "VPC",
    "href": "/vpc",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Isolated cloud resources and virtual networks with granular routing controls"
  },
  {
    "id": "cloudfront",
    "name": "Amazon CloudFront",
    "shortName": "CloudFront",
    "href": "/cloudfront",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Global content delivery network (CDN) for low-latency web distribution"
  },
  {
    "id": "route53",
    "name": "Amazon Route 53",
    "shortName": "Route 53",
    "href": "/route53",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Highly available and scalable Domain Name System (DNS) web service"
  },
  {
    "id": "apigateway",
    "name": "Amazon API Gateway",
    "shortName": "API Gateway",
    "href": "/apigateway",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Build, publish, maintain, monitor, and secure REST, HTTP, and WebSocket APIs"
  },
  {
    "id": "directconnect",
    "name": "AWS Direct Connect",
    "shortName": "Direct Connect",
    "href": "/directconnect",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Dedicated private network connection from on-premises to AWS"
  },
  {
    "id": "elb",
    "name": "Elastic Load Balancing",
    "shortName": "ELB",
    "href": "/elb",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Distribute incoming traffic automatically across multiple targets and availability zones"
  },
  {
    "id": "transitgateway",
    "name": "AWS Transit Gateway",
    "shortName": "Transit Gateway",
    "href": "/transitgateway",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Easily connect VPCs and on-premises networks to a central hub"
  },
  {
    "id": "globalaccelerator",
    "name": "AWS Global Accelerator",
    "shortName": "Global Accelerator",
    "href": "/globalaccelerator",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Improve application availability and performance using the AWS global network"
  },
  {
    "id": "privatelink",
    "name": "AWS PrivateLink",
    "shortName": "PrivateLink",
    "href": "/privatelink",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Establish private connectivity between VPCs and AWS services without public IPs"
  },
  {
    "id": "cloudwan",
    "name": "AWS Cloud WAN",
    "shortName": "Cloud WAN",
    "href": "/cloudwan",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Build, manage, and monitor global wide area networks across clouds and data centers"
  },
  {
    "id": "appmesh",
    "name": "AWS App Mesh",
    "shortName": "App Mesh",
    "href": "/appmesh",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Application-level networking for microservices across compute environments"
  },
  {
    "id": "networkfirewall",
    "name": "AWS Network Firewall",
    "shortName": "Network Firewall",
    "href": "/networkfirewall",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Stateful network inspection and firewall protection for Amazon VPCs"
  },
  {
    "id": "verifiedaccess",
    "name": "AWS Verified Access",
    "shortName": "Verified Access",
    "href": "/verifiedaccess",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Provide secure access to corporate applications without a VPN"
  },
  {
    "id": "route53-arc",
    "name": "Route 53 Application Recovery Controller",
    "shortName": "Route 53 ARC",
    "href": "/route53-arc",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Continuously monitor application recovery readiness and manage automated failover"
  },
  {
    "id": "vpn",
    "name": "AWS Client VPN",
    "shortName": "Client VPN",
    "href": "/vpn",
    "category": "Networking & Content Delivery",
    "color": "#8C4FFF",
    "desc": "Securely connect users to AWS or on-premises networks from any location"
  },
  {
    "id": "iam",
    "name": "AWS Identity and Access Management",
    "shortName": "IAM",
    "href": "/iam",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "status": "functional",
    "desc": "Securely manage access to AWS services, users, groups, and IAM policies",
    "aliases": ["iam", "identity", "users", "roles", "policies", "permissions", "access management"]
  },
  {
    "id": "identity-center",
    "name": "AWS IAM Identity Center",
    "shortName": "IAM Identity Center",
    "href": "/identity-center",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Centralize Single Sign-On (SSO) access to multiple AWS accounts and cloud apps"
  },
  {
    "id": "cognito",
    "name": "Amazon Cognito",
    "shortName": "Cognito",
    "href": "/cognito",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Identity for your web and mobile applications with sign-up and sign-in support"
  },
  {
    "id": "secretsmanager",
    "name": "AWS Secrets Manager",
    "shortName": "Secrets Manager",
    "href": "/secretsmanager",
    "category": "Security, Identity, & Compliance",
    "color": "#DD3522",
    "status": "functional",
    "desc": "Rotate, manage, and retrieve database credentials, API keys, and other secrets",
    "aliases": ["secrets", "secret", "credentials", "passwords", "api keys", "secrets manager", "sm", "rotation", "tokens"]
  },
  {
    "id": "kms",
    "name": "AWS Key Management Service",
    "shortName": "KMS",
    "href": "/kms",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "status": "functional",
    "desc": "Managed creation and centralized control of cryptographic keys used to protect data",
    "aliases": ["kms", "keys", "key", "encryption", "decrypt", "cmk", "cryptographic keys", "key management"]
  },
  {
    "id": "acm",
    "name": "AWS Certificate Manager",
    "shortName": "Certificate Manager",
    "href": "/acm",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "status": "functional",
    "desc": "Provision, manage, and deploy public and private SSL/TLS certificates",
    "aliases": ["acm", "certificatemanager", "certificate-manager", "certificate manager", "certificates", "certificate", "ssl", "tls", "https", "domain validation"]
  },
  {
    "id": "acm-pca",
    "name": "AWS Private Certificate Authority",
    "shortName": "Private CA",
    "href": "/acm/pca",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "status": "functional",
    "desc": "Create and manage private certificate authorities to issue private X.509 certificates",
    "aliases": ["acm-pca", "pca", "private ca", "private certificate authority", "ca", "root ca", "subordinate ca", "sub ca", "certificate authority", "issue certificate", "crl", "x.509"]
  },
  {
    "id": "guardduty",
    "name": "Amazon GuardDuty",
    "shortName": "GuardDuty",
    "href": "/guardduty",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Intelligent threat detection to protect your AWS accounts, workloads, and data"
  },
  {
    "id": "inspector",
    "name": "Amazon Inspector",
    "shortName": "Inspector",
    "href": "/inspector",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Automated vulnerability management for EC2, container images, and Lambda functions"
  },
  {
    "id": "macie",
    "name": "Amazon Macie",
    "shortName": "Macie",
    "href": "/macie",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Discover and protect sensitive data at scale in Amazon S3 using machine learning"
  },
  {
    "id": "waf",
    "name": "AWS WAF",
    "shortName": "WAF",
    "href": "/waf",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Protect web applications and APIs from common web exploits and bots"
  },
  {
    "id": "shield",
    "name": "AWS Shield",
    "shortName": "Shield",
    "href": "/shield",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Managed DDoS protection service for applications running on AWS"
  },
  {
    "id": "securityhub",
    "name": "AWS Security Hub",
    "shortName": "Security Hub",
    "href": "/securityhub",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Comprehensive cloud security posture management and compliance checks"
  },
  {
    "id": "directoryservice",
    "name": "AWS Directory Service",
    "shortName": "Directory Service",
    "href": "/directoryservice",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "status": "functional",
    "desc": "Managed Microsoft Active Directory in the cloud",
    "aliases": ["directoryservice", "directory service", "active directory", "ad", "simple ad", "managed microsoft ad", "ad connector", "ldap", "kerberos", "domain controller", "sso"]
  },
  {
    "id": "cloudhsm",
    "name": "AWS CloudHSM",
    "shortName": "CloudHSM",
    "href": "/cloudhsm",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "status": "functional",
    "desc": "Dedicated hardware security module (HSM) appliances for regulatory compliance",
    "aliases": ["cloudhsm", "hsm", "hardware security module", "fips 140-2", "cryptographic keys", "clusters", "pkcs11", "hsm2m.medium"]
  },
  {
    "id": "network-access-analyzer",
    "name": "Network Access Analyzer",
    "shortName": "Network Analyzer",
    "href": "/network-access-analyzer",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Identify network paths that lead to unintended resource access across VPCs"
  },
  {
    "id": "auditmanager",
    "name": "AWS Audit Manager",
    "shortName": "Audit Manager",
    "href": "/auditmanager",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Continuously audit AWS usage to simplify risk and regulatory assessment"
  },
  {
    "id": "verified-permissions",
    "name": "Amazon Verified Permissions",
    "shortName": "Verified Permissions",
    "href": "/verified-permissions",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "Fine-grained permissions management and authorization service for custom applications"
  },
  {
    "id": "artifact",
    "name": "AWS Artifact",
    "shortName": "Artifact",
    "href": "/artifact",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "desc": "On-demand access to AWS security and compliance reports and certifications"
  },
  {
    "id": "ram",
    "name": "AWS Resource Access Manager",
    "shortName": "RAM",
    "href": "/ram",
    "category": "Security, Identity, & Compliance",
    "color": "#E7157B",
    "status": "functional",
    "desc": "Simple, secure service to share AWS resources across AWS accounts or within your Organization",
    "aliases": ["ram", "resource sharing", "share resources", "resource access manager", "cross account"]
  },
  {
    "id": "cloudwatch",
    "name": "Amazon CloudWatch",
    "shortName": "CloudWatch",
    "href": "/cloudwatch",
    "category": "Management & Governance",
    "color": "#E7157B",
    "status": "functional",
    "desc": "Observability and monitoring for AWS resources and applications with CloudWatch Logs, metrics, and alarms",
    "aliases": ["cloudwatch", "cloudwatch logs", "logs", "log groups", "log streams", "metrics", "alarms", "cwl"]
  },
  {
    "id": "cloudwatch-logs",
    "name": "CloudWatch Logs",
    "shortName": "Logs",
    "href": "/cloudwatch/logs",
    "category": "Management & Governance",
    "color": "#E7157B",
    "status": "functional",
    "desc": "Monitor, store, and access your log files from AWS resources",
    "aliases": ["cloudwatch logs", "logs", "log groups", "log streams", "cwl", "insights", "live tail"]
  },
  {
    "id": "cloudtrail",
    "name": "AWS CloudTrail",
    "shortName": "CloudTrail",
    "href": "/cloudtrail",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Track user activity and API usage across AWS accounts for governance and auditing"
  },
  {
    "id": "cloudformation",
    "name": "AWS CloudFormation",
    "shortName": "CloudFormation",
    "href": "/cloudformation",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Model, provision, and manage AWS and third-party resources as code templates"
  },
  {
    "id": "appconfig",
    "name": "AWS AppConfig",
    "shortName": "AppConfig",
    "href": "/appconfig",
    "category": "Management & Governance",
    "color": "#C925D1",
    "status": "functional",
    "desc": "Quickly and safely deploy application configuration and feature flags across applications and environments",
    "aliases": ["appconfig", "app config", "feature flags", "feature flag", "configuration profiles", "deployment strategy", "application configuration"]
  },
  {
    "id": "systems-manager",
    "name": "AWS Systems Manager",
    "shortName": "Systems Manager",
    "href": "/systems-manager",
    "category": "Management & Governance",
    "color": "#C925D1",
    "status": "functional",
    "desc": "Unified operational hub for managing hybrid cloud nodes, Parameter Store, Fleet Manager, and applications",
    "aliases": ["ssm", "systems manager", "parameter store", "fleet manager", "session manager", "run command", "patch manager"]
  },
  {
    "id": "ssm-parameter-store",
    "name": "AWS Systems Manager Parameter Store",
    "shortName": "Parameter Store",
    "href": "/systems-manager/parameter-store",
    "category": "Management & Governance",
    "color": "#C925D1",
    "status": "functional",
    "desc": "Secure, hierarchical storage for configuration data management and secrets management",
    "aliases": ["ssm", "parameter store", "parameters", "parameter", "config store", "systems manager parameter store", "ssm parameter store", "securestring"]
  },
  {
    "id": "organizations",
    "name": "AWS Organizations",
    "shortName": "Organizations",
    "href": "/organizations",
    "category": "Management & Governance",
    "color": "#C925D1",
    "status": "functional",
    "desc": "Centralized management and governance for multiple AWS accounts with policy enforcement",
    "aliases": ["organizations", "org", "scp", "member accounts", "multi account", "service control policies"]
  },
  {
    "id": "service-quotas",
    "name": "Service Quotas",
    "shortName": "Service Quotas",
    "href": "/service-quotas",
    "category": "Management & Governance",
    "color": "#C925D1",
    "status": "functional",
    "desc": "View and manage quotas for AWS services from a central location as your workloads grow",
    "aliases": ["service quotas", "quotas", "limits", "quota requests", "request increase", "increase limit"]
  },
  {
    "id": "resource-groups",
    "name": "AWS Resource Groups & Tag Editor",
    "shortName": "Resource Groups & Tag Editor",
    "href": "/resource-groups",
    "category": "Management & Governance",
    "color": "#C925D1",
    "status": "functional",
    "desc": "Organize AWS resources, manage tags across services and Regions, and automate tasks on resource collections",
    "aliases": ["resource groups", "tags", "tag editor", "tagging", "bulk tagging", "find resources by tag"]
  },
  {
    "id": "account",
    "name": "AWS Account Management",
    "shortName": "Account Management",
    "href": "/account",
    "category": "Management & Governance",
    "color": "#C925D1",
    "status": "functional",
    "desc": "Manage account information, primary and alternate contacts, AWS Region availability, and account settings",
    "aliases": ["account", "account management", "contacts", "alternate contacts", "regions", "opt-in regions", "close account"]
  },
  {
    "id": "controltower",
    "name": "AWS Control Tower",
    "shortName": "Control Tower",
    "href": "/controltower",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Set up and govern a secure, compliant multi-account AWS environment with guardrails"
  },
  {
    "id": "config",
    "name": "AWS Config",
    "shortName": "Config",
    "href": "/config",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Assess, audit, and evaluate configurations of your AWS resources over time"
  },
  {
    "id": "autoscaling",
    "name": "AWS Auto Scaling",
    "shortName": "Auto Scaling",
    "href": "/autoscaling",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Optimize performance and availability by scaling multiple resources automatically"
  },
  {
    "id": "opsworks",
    "name": "AWS OpsWorks",
    "shortName": "OpsWorks",
    "href": "/opsworks",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Automate configuration, deployment, and management with Chef and Puppet"
  },
  {
    "id": "servicecatalog",
    "name": "AWS Service Catalog",
    "shortName": "Service Catalog",
    "href": "/servicecatalog",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Create and manage catalogs of IT services approved for use on AWS"
  },
  {
    "id": "trustedadvisor",
    "name": "AWS Trusted Advisor",
    "shortName": "Trusted Advisor",
    "href": "/trustedadvisor",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Optimize costs, increase performance, improve security, and monitor quotas"
  },
  {
    "id": "wellarchitected",
    "name": "AWS Well-Architected Tool",
    "shortName": "Well-Architected Tool",
    "href": "/wellarchitected",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Review workloads against AWS architectural best practices"
  },
  {
    "id": "license-manager",
    "name": "AWS License Manager",
    "shortName": "License Manager",
    "href": "/license-manager",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Track and manage software licenses from vendors such as Microsoft, SAP, Oracle"
  },
  {
    "id": "health",
    "name": "AWS Health Dashboard",
    "shortName": "Health Dashboard",
    "href": "/health",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "View personalized events and service status affecting your AWS environment"
  },
  {
    "id": "proton",
    "name": "AWS Proton",
    "shortName": "Proton",
    "href": "/proton",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Automated deployment management for container and serverless applications"
  },
  {
    "id": "grafana",
    "name": "Amazon Managed Grafana",
    "shortName": "Managed Grafana",
    "href": "/grafana",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Fully managed data visualization and analytics service built on Grafana"
  },
  {
    "id": "prometheus",
    "name": "Amazon Managed Service for Prometheus",
    "shortName": "Managed Prometheus",
    "href": "/prometheus",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Secure, highly available, and scalable Prometheus monitoring service"
  },
  {
    "id": "cloudshell",
    "name": "AWS CloudShell",
    "shortName": "CloudShell",
    "href": "/cloudshell",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Browser-based pre-authenticated shell environment with AWS CLI"
  },
  {
    "id": "compute-optimizer",
    "name": "AWS Compute Optimizer",
    "shortName": "Compute Optimizer",
    "href": "/compute-optimizer",
    "category": "Management & Governance",
    "color": "#545b64",
    "desc": "Machine learning-driven recommendations to reduce costs and improve performance"
  },
  {
    "id": "athena",
    "name": "Amazon Athena",
    "shortName": "Athena",
    "href": "/athena",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Query data directly in Amazon S3 using standard SQL without servers"
  },
  {
    "id": "emr",
    "name": "Amazon EMR",
    "shortName": "EMR",
    "href": "/emr",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Run big data frameworks like Apache Spark, Hadoop, Hive, and Presto"
  },
  {
    "id": "opensearch",
    "name": "Amazon OpenSearch Service",
    "shortName": "OpenSearch",
    "href": "/opensearch",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Search, visualize, and analyze petabytes of text and log data"
  },
  {
    "id": "kinesis",
    "name": "Amazon Kinesis Data Streams",
    "shortName": "Kinesis",
    "href": "/kinesis",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Collect and process large streams of data records in real time"
  },
  {
    "id": "kinesis-firehose",
    "name": "Amazon Kinesis Data Firehose",
    "shortName": "Kinesis Firehose",
    "href": "/kinesis-firehose",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Reliably load streaming data into data lakes, warehouses, and analytics services"
  },
  {
    "id": "kinesis-video",
    "name": "Amazon Kinesis Video Streams",
    "shortName": "Kinesis Video Streams",
    "href": "/kinesis-video",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Capture, process, and store video streams for analytics, machine learning, and playback"
  },
  {
    "id": "quicksight",
    "name": "Amazon QuickSight",
    "shortName": "QuickSight",
    "href": "/quicksight",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Serverless business intelligence service with natural language querying"
  },
  {
    "id": "glue",
    "name": "AWS Glue",
    "shortName": "Glue",
    "href": "/glue",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Serverless data integration service that makes it easy to discover, prepare, and combine data"
  },
  {
    "id": "lakeformation",
    "name": "AWS Lake Formation",
    "shortName": "Lake Formation",
    "href": "/lakeformation",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Build, secure, and manage data lakes with fine-grained access control"
  },
  {
    "id": "msk",
    "name": "Amazon Managed Streaming for Apache Kafka",
    "shortName": "MSK",
    "href": "/msk",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Fully managed Apache Kafka service for real-time streaming pipelines"
  },
  {
    "id": "cleanrooms",
    "name": "AWS Clean Rooms",
    "shortName": "Clean Rooms",
    "href": "/cleanrooms",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Collaborate with business partners without sharing underlying raw data"
  },
  {
    "id": "dataexchange",
    "name": "AWS Data Exchange",
    "shortName": "Data Exchange",
    "href": "/dataexchange",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Find, subscribe to, and use third-party data in the cloud"
  },
  {
    "id": "cloudsearch",
    "name": "Amazon CloudSearch",
    "shortName": "CloudSearch",
    "href": "/cloudsearch",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Managed search service for websites and applications"
  },
  {
    "id": "entity-resolution",
    "name": "AWS Entity Resolution",
    "shortName": "Entity Resolution",
    "href": "/entity-resolution",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Match, link, and deduplicate customer and business records across applications"
  },
  {
    "id": "finspace",
    "name": "Amazon FinSpace",
    "shortName": "FinSpace",
    "href": "/finspace",
    "category": "Analytics",
    "color": "#8C4FFF",
    "desc": "Data management and analytics service purpose-built for the financial services industry"
  },
  {
    "id": "sagemaker",
    "name": "Amazon SageMaker",
    "shortName": "SageMaker",
    "href": "/sagemaker",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Build, train, and deploy machine learning models for any use case"
  },
  {
    "id": "bedrock",
    "name": "Amazon Bedrock",
    "shortName": "Bedrock",
    "href": "/bedrock",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Build generative AI applications with foundational models from top AI companies"
  },
  {
    "id": "amazon-q",
    "name": "Amazon Q",
    "shortName": "Amazon Q",
    "href": "/amazon-q",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Generative AI-powered assistant for work and software development"
  },
  {
    "id": "comprehend",
    "name": "Amazon Comprehend",
    "shortName": "Comprehend",
    "href": "/comprehend",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Natural language processing (NLP) service to uncover valuable insights in unstructured text"
  },
  {
    "id": "rekognition",
    "name": "Amazon Rekognition",
    "shortName": "Rekognition",
    "href": "/rekognition",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Automate image and video analysis with machine learning computer vision"
  },
  {
    "id": "textract",
    "name": "Amazon Textract",
    "shortName": "Textract",
    "href": "/textract",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Extract printed text, handwriting, and data from documents automatically"
  },
  {
    "id": "transcribe",
    "name": "Amazon Transcribe",
    "shortName": "Transcribe",
    "href": "/transcribe",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Automatic speech recognition (ASR) to convert audio to accurate text"
  },
  {
    "id": "translate",
    "name": "Amazon Translate",
    "shortName": "Translate",
    "href": "/translate",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Fast, high-quality, and customizable neural machine translation"
  },
  {
    "id": "polly",
    "name": "Amazon Polly",
    "shortName": "Polly",
    "href": "/polly",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Turn text into lifelike speech with natural sounding voices"
  },
  {
    "id": "lex",
    "name": "Amazon Lex",
    "shortName": "Lex",
    "href": "/lex",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Build conversational chatbots with voice and text capabilities"
  },
  {
    "id": "kendra",
    "name": "Amazon Kendra",
    "shortName": "Kendra",
    "href": "/kendra",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Intelligent enterprise search service powered by machine learning"
  },
  {
    "id": "personalize",
    "name": "Amazon Personalize",
    "shortName": "Personalize",
    "href": "/personalize",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Deliver tailored product recommendations with machine learning"
  },
  {
    "id": "forecast",
    "name": "Amazon Forecast",
    "shortName": "Forecast",
    "href": "/forecast",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Accurate time-series forecasting service based on machine learning"
  },
  {
    "id": "fraud-detector",
    "name": "Amazon Fraud Detector",
    "shortName": "Fraud Detector",
    "href": "/fraud-detector",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Identify potentially fraudulent online activities using ML models"
  },
  {
    "id": "a2i",
    "name": "Amazon Augmented AI (A2I)",
    "shortName": "Augmented AI",
    "href": "/a2i",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Easily implement human review of machine learning predictions"
  },
  {
    "id": "deepracer",
    "name": "AWS DeepRacer",
    "shortName": "DeepRacer",
    "href": "/deepracer",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Autonomous 1/18th scale race car driven by reinforcement learning"
  },
  {
    "id": "codewhisperer",
    "name": "Amazon Q Developer",
    "shortName": "Q Developer",
    "href": "/codewhisperer",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "AI code companion and generative assistant for developers"
  },
  {
    "id": "healthlake",
    "name": "AWS HealthLake",
    "shortName": "HealthLake",
    "href": "/healthlake",
    "category": "Machine Learning",
    "color": "#01A88D",
    "desc": "Store, transform, query, and analyze health data at scale"
  },
  {
    "id": "codecommit",
    "name": "AWS CodeCommit",
    "shortName": "CodeCommit",
    "href": "/codecommit",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Secure, highly scalable private Git repositories"
  },
  {
    "id": "codebuild",
    "name": "AWS CodeBuild",
    "shortName": "CodeBuild",
    "href": "/codebuild",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Build and test code with continuous scaling and pay-per-minute billing"
  },
  {
    "id": "codedeploy",
    "name": "AWS CodeDeploy",
    "shortName": "CodeDeploy",
    "href": "/codedeploy",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Automate software deployments to EC2, ECS, Lambda, and on-premises"
  },
  {
    "id": "codepipeline",
    "name": "AWS CodePipeline",
    "shortName": "CodePipeline",
    "href": "/codepipeline",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Release software using continuous delivery and release pipelines"
  },
  {
    "id": "codeartifact",
    "name": "AWS CodeArtifact",
    "shortName": "CodeArtifact",
    "href": "/codeartifact",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Secure, scalable artifact repository service for software development"
  },
  {
    "id": "cloud9",
    "name": "AWS Cloud9",
    "shortName": "Cloud9",
    "href": "/cloud9",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Cloud-based integrated development environment (IDE) for writing code"
  },
  {
    "id": "xray",
    "name": "AWS X-Ray",
    "shortName": "X-Ray",
    "href": "/xray",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Analyze and debug distributed microservice applications"
  },
  {
    "id": "codecatalyst",
    "name": "Amazon CodeCatalyst",
    "shortName": "CodeCatalyst",
    "href": "/codecatalyst",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Unified software development service to accelerate application delivery"
  },
  {
    "id": "fis",
    "name": "AWS Fault Injection Service",
    "shortName": "Fault Injection",
    "href": "/fis",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Managed chaos engineering service to improve application resiliency"
  },
  {
    "id": "cli",
    "name": "AWS Command Line Interface",
    "shortName": "AWS CLI",
    "href": "/cli",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Unified tool to manage your AWS services from the terminal"
  },
  {
    "id": "cdk",
    "name": "AWS Cloud Development Kit",
    "shortName": "AWS CDK",
    "href": "/cdk",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Define cloud infrastructure using familiar modern programming languages"
  },
  {
    "id": "sam",
    "name": "AWS Serverless Application Model",
    "shortName": "AWS SAM",
    "href": "/sam",
    "category": "Developer Tools",
    "color": "#0073bb",
    "desc": "Open-source framework for building serverless applications"
  },
  {
    "id": "sqs",
    "name": "Amazon Simple Queue Service",
    "shortName": "SQS",
    "href": "/sqs",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "status": "functional",
    "desc": "Fully managed message queuing service for standard and FIFO message queues",
    "aliases": ["sqs", "queues", "queue", "message queue", "messaging", "fifo", "dlq"]
  },
  {
    "id": "sns",
    "name": "Amazon Simple Notification Service",
    "shortName": "SNS",
    "href": "/sns",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "desc": "High-throughput pub/sub messaging and mobile push notifications"
  },
  {
    "id": "stepfunctions",
    "name": "AWS Step Functions",
    "shortName": "Step Functions",
    "href": "/stepfunctions",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "desc": "Coordinate distributed applications and microservices using visual workflows"
  },
  {
    "id": "eventbridge",
    "name": "Amazon EventBridge",
    "shortName": "EventBridge",
    "href": "/eventbridge",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "desc": "Serverless event bus that ingests and routes events from SaaS applications"
  },
  {
    "id": "amazon-mq",
    "name": "Amazon MQ",
    "shortName": "Amazon MQ",
    "href": "/amazon-mq",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "desc": "Managed message broker for Apache ActiveMQ and RabbitMQ"
  },
  {
    "id": "appflow",
    "name": "Amazon AppFlow",
    "shortName": "AppFlow",
    "href": "/appflow",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "desc": "Secure data transfer between software-as-a-service (SaaS) apps and AWS"
  },
  {
    "id": "swf",
    "name": "Amazon Simple Workflow Service",
    "shortName": "SWF",
    "href": "/swf",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "desc": "Coordinate work across distributed application components"
  },
  {
    "id": "mwaa",
    "name": "Amazon Managed Workflows for Apache Airflow",
    "shortName": "MWAA",
    "href": "/mwaa",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "desc": "Managed Apache Airflow service for end-to-end data pipeline workflows"
  },
  {
    "id": "b2b-data-interchange",
    "name": "AWS B2B Data Interchange",
    "shortName": "B2B Data Interchange",
    "href": "/b2b-data-interchange",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "desc": "Automate Electronic Data Interchange (EDI) transformation and workflows"
  },
  {
    "id": "pipes",
    "name": "Amazon EventBridge Pipes",
    "shortName": "EventBridge Pipes",
    "href": "/pipes",
    "category": "Application Integration",
    "color": "#FF4F8B",
    "desc": "Create point-to-point integrations between event producers and consumers"
  },
  {
    "id": "amplify",
    "name": "AWS Amplify",
    "shortName": "Amplify",
    "href": "/amplify",
    "category": "Front-End Web & Mobile",
    "color": "#FF9900",
    "desc": "Build, ship, host, and scale fullstack web and mobile apps"
  },
  {
    "id": "appsync",
    "name": "AWS AppSync",
    "shortName": "AppSync",
    "href": "/appsync",
    "category": "Front-End Web & Mobile",
    "color": "#FF9900",
    "desc": "Build serverless GraphQL and Pub/Sub APIs with real-time subscriptions"
  },
  {
    "id": "devicefarm",
    "name": "AWS Device Farm",
    "shortName": "Device Farm",
    "href": "/devicefarm",
    "category": "Front-End Web & Mobile",
    "color": "#FF9900",
    "desc": "Test web and mobile apps across desktop browsers and real devices in the cloud"
  },
  {
    "id": "location",
    "name": "Amazon Location Service",
    "shortName": "Location Service",
    "href": "/location",
    "category": "Front-End Web & Mobile",
    "color": "#FF9900",
    "desc": "Add location data, maps, geocoding, and tracking to applications securely"
  },
  {
    "id": "pinpoint",
    "name": "Amazon Pinpoint",
    "shortName": "Pinpoint",
    "href": "/pinpoint",
    "category": "Front-End Web & Mobile",
    "color": "#FF9900",
    "desc": "Engage customers with targeted multichannel notifications and marketing"
  },
  {
    "id": "mobile-sdk",
    "name": "AWS Mobile SDK",
    "shortName": "Mobile SDK",
    "href": "/mobile-sdk",
    "category": "Front-End Web & Mobile",
    "color": "#FF9900",
    "desc": "Software development kits for iOS, Android, React Native, and Flutter"
  },
  {
    "id": "chime-sdk",
    "name": "Amazon Chime SDK",
    "shortName": "Chime SDK",
    "href": "/chime-sdk",
    "category": "Front-End Web & Mobile",
    "color": "#FF9900",
    "desc": "Add real-time voice, video, screen sharing, and messaging to applications"
  },
  {
    "id": "connect",
    "name": "Amazon Connect",
    "shortName": "Connect",
    "href": "/connect",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "Cloud-based contact center service with AI-powered conversational routing"
  },
  {
    "id": "workspaces",
    "name": "Amazon WorkSpaces",
    "shortName": "WorkSpaces",
    "href": "/workspaces",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "Secure, fully managed cloud desktop service for remote work"
  },
  {
    "id": "workspaces-web",
    "name": "Amazon WorkSpaces Web",
    "shortName": "WorkSpaces Web",
    "href": "/workspaces-web",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "Low-cost, secure browser access to internal websites and SaaS applications"
  },
  {
    "id": "appstream",
    "name": "Amazon AppStream 2.0",
    "shortName": "AppStream 2.0",
    "href": "/appstream",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "Stream desktop applications securely to any web browser"
  },
  {
    "id": "workdocs",
    "name": "Amazon WorkDocs",
    "shortName": "WorkDocs",
    "href": "/workdocs",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "Secure enterprise document collaboration and storage service"
  },
  {
    "id": "ses",
    "name": "Amazon Simple Email Service",
    "shortName": "SES",
    "href": "/ses",
    "category": "Business Applications",
    "color": "#DD344C",
    "status": "functional",
    "desc": "Cost-effective, flexible email service for sending transactional messages, marketing emails, and managing verified domains",
    "aliases": ["ses", "email", "simple email service", "smtp", "mail", "templates", "identities", "dkim", "suppression list", "configuration sets"]
  },
  {
    "id": "chime",
    "name": "Amazon Chime",
    "shortName": "Chime",
    "href": "/chime",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "Communications service for online meetings, chat, and voice calls"
  },
  {
    "id": "wickr",
    "name": "AWS Wickr",
    "shortName": "Wickr",
    "href": "/wickr",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "End-to-end encrypted messaging and collaboration for security-conscious teams"
  },
  {
    "id": "supply-chain",
    "name": "AWS Supply Chain",
    "shortName": "Supply Chain",
    "href": "/supply-chain",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "Cloud-based supply chain management application with predictive insights"
  },
  {
    "id": "honeycode",
    "name": "Amazon Honeycode",
    "shortName": "Honeycode",
    "href": "/honeycode",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "Build custom mobile and web apps without writing code"
  },
  {
    "id": "simplepay",
    "name": "Amazon Pay for AWS",
    "shortName": "Amazon Pay",
    "href": "/simplepay",
    "category": "Business Applications",
    "color": "#0073bb",
    "desc": "Payment integration service for digital billing and processing"
  },
  {
    "id": "iot-core",
    "name": "AWS IoT Core",
    "shortName": "IoT Core",
    "href": "/iot-core",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Connect billions of IoT devices and route trillions of messages to AWS"
  },
  {
    "id": "iot-greengrass",
    "name": "AWS IoT Greengrass",
    "shortName": "IoT Greengrass",
    "href": "/iot-greengrass",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Build intelligent IoT devices with local compute, messaging, and data caching"
  },
  {
    "id": "iot-1click",
    "name": "AWS IoT 1-Click",
    "shortName": "IoT 1-Click",
    "href": "/iot-1click",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Trigger AWS Lambda functions with simple push-button IoT devices"
  },
  {
    "id": "iot-analytics",
    "name": "AWS IoT Analytics",
    "shortName": "IoT Analytics",
    "href": "/iot-analytics",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Collect, preprocess, store, and analyze massive volumes of IoT data"
  },
  {
    "id": "iot-device-defender",
    "name": "AWS IoT Device Defender",
    "shortName": "Device Defender",
    "href": "/iot-device-defender",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Security management and automated anomaly detection for IoT device fleets"
  },
  {
    "id": "iot-device-management",
    "name": "AWS IoT Device Management",
    "shortName": "Device Management",
    "href": "/iot-device-management",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Onboard, organize, monitor, and remotely manage fleets of IoT connected devices"
  },
  {
    "id": "iot-events",
    "name": "AWS IoT Events",
    "shortName": "IoT Events",
    "href": "/iot-events",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Detect and respond to events from IoT sensors and application telemetry"
  },
  {
    "id": "iot-sitewise",
    "name": "AWS IoT SiteWise",
    "shortName": "IoT SiteWise",
    "href": "/iot-sitewise",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Collect, store, organize, and monitor industrial equipment data at scale"
  },
  {
    "id": "iot-fleetwise",
    "name": "AWS IoT FleetWise",
    "shortName": "IoT FleetWise",
    "href": "/iot-fleetwise",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Collect, transform, and transfer vehicle sensor and telemetry data to the cloud"
  },
  {
    "id": "freertos",
    "name": "FreeRTOS",
    "shortName": "FreeRTOS",
    "href": "/freertos",
    "category": "Internet of Things",
    "color": "#3F8624",
    "desc": "Real-time operating system for microcontrollers with cloud connectivity"
  },
  {
    "id": "migrationhub",
    "name": "AWS Migration Hub",
    "shortName": "Migration Hub",
    "href": "/migrationhub",
    "category": "Migration & Transfer",
    "color": "#3F8624",
    "desc": "Centralized tracking of cloud migrations across AWS and partner tools"
  },
  {
    "id": "mgn",
    "name": "AWS Application Migration Service",
    "shortName": "Application Migration",
    "href": "/mgn",
    "category": "Migration & Transfer",
    "color": "#3F8624",
    "desc": "Automate lift-and-shift server migration to AWS with minimal cutover time"
  },
  {
    "id": "dms",
    "name": "AWS Database Migration Service",
    "shortName": "DMS",
    "href": "/dms",
    "category": "Migration & Transfer",
    "color": "#3F8624",
    "desc": "Migrate relational and NoSQL databases to AWS with virtually zero downtime"
  },
  {
    "id": "sms",
    "name": "AWS Server Migration Service",
    "shortName": "Server Migration",
    "href": "/sms",
    "category": "Migration & Transfer",
    "color": "#3F8624",
    "desc": "Migrate on-premises virtual machine workloads to Amazon EC2"
  },
  {
    "id": "discovery",
    "name": "AWS Application Discovery Service",
    "shortName": "Application Discovery",
    "href": "/discovery",
    "category": "Migration & Transfer",
    "color": "#3F8624",
    "desc": "Plan migration projects by discovering on-premises data center inventory and performance"
  },
  {
    "id": "schema-conversion",
    "name": "AWS Schema Conversion Tool",
    "shortName": "Schema Conversion",
    "href": "/schema-conversion",
    "category": "Migration & Transfer",
    "color": "#3F8624",
    "desc": "Convert commercial database schemas to open-source database targets on AWS"
  },
  {
    "id": "migration-evaluator",
    "name": "Migration Evaluator",
    "shortName": "Migration Evaluator",
    "href": "/migration-evaluator",
    "category": "Migration & Transfer",
    "color": "#3F8624",
    "desc": "Create business cases and directional cloud cost estimates for AWS migration"
  },
  {
    "id": "launch-wizard",
    "name": "AWS Launch Wizard",
    "shortName": "Launch Wizard",
    "href": "/launch-wizard",
    "category": "Migration & Transfer",
    "color": "#3F8624",
    "desc": "Guide the sizing, configuration, and deployment of enterprise applications"
  },
  {
    "id": "mediaconnect",
    "name": "AWS Elemental MediaConnect",
    "shortName": "MediaConnect",
    "href": "/mediaconnect",
    "category": "Media Services",
    "color": "#FF9900",
    "desc": "High-quality, reliable, and secure live video transport service"
  },
  {
    "id": "mediaconvert",
    "name": "AWS Elemental MediaConvert",
    "shortName": "MediaConvert",
    "href": "/mediaconvert",
    "category": "Media Services",
    "color": "#FF9900",
    "desc": "Broadcast-grade file-based video processing and transcoding service"
  },
  {
    "id": "medialive",
    "name": "AWS Elemental MediaLive",
    "shortName": "MediaLive",
    "href": "/medialive",
    "category": "Media Services",
    "color": "#FF9900",
    "desc": "Broadcast-grade live video processing service for streaming channels"
  },
  {
    "id": "mediapackage",
    "name": "AWS Elemental MediaPackage",
    "shortName": "MediaPackage",
    "href": "/mediapackage",
    "category": "Media Services",
    "color": "#FF9900",
    "desc": "Reliably prepare and protect video streams for delivery to Internet devices"
  },
  {
    "id": "mediastore",
    "name": "AWS Elemental MediaStore",
    "shortName": "MediaStore",
    "href": "/mediastore",
    "category": "Media Services",
    "color": "#FF9900",
    "desc": "Storage service optimized for media delivery with low latency and high concurrency"
  },
  {
    "id": "mediatailor",
    "name": "AWS Elemental MediaTailor",
    "shortName": "MediaTailor",
    "href": "/mediatailor",
    "category": "Media Services",
    "color": "#FF9900",
    "desc": "Scalable server-side ad insertion and linear channel assembly"
  },
  {
    "id": "ivs",
    "name": "Amazon Interactive Video Service",
    "shortName": "IVS",
    "href": "/ivs",
    "category": "Media Services",
    "color": "#FF9900",
    "desc": "Managed live streaming solution designed to power interactive video experiences"
  },
  {
    "id": "nimblestudio",
    "name": "Amazon Nimble Studio",
    "shortName": "Nimble Studio",
    "href": "/nimblestudio",
    "category": "Media Services",
    "color": "#FF9900",
    "desc": "Build virtual visual effects, animation, and interactive content studios"
  },
  {
    "id": "cost-explorer",
    "name": "AWS Cost Explorer",
    "shortName": "Cost Explorer",
    "href": "/cost-explorer",
    "category": "Cloud Financial Management",
    "color": "#3F8624",
    "desc": "Visualize, understand, and manage your AWS costs and usage over time"
  },
  {
    "id": "budgets",
    "name": "AWS Budgets",
    "shortName": "Budgets",
    "href": "/budgets",
    "category": "Cloud Financial Management",
    "color": "#3F8624",
    "desc": "Set custom cost and usage budgets that alert you when thresholds are exceeded"
  },
  {
    "id": "cur",
    "name": "AWS Cost and Usage Report",
    "shortName": "Cost and Usage Report",
    "href": "/cur",
    "category": "Cloud Financial Management",
    "color": "#3F8624",
    "desc": "Deep dive into comprehensive data on your AWS costs and resource usage"
  },
  {
    "id": "savingsplans",
    "name": "AWS Savings Plans",
    "shortName": "Savings Plans",
    "href": "/savingsplans",
    "category": "Cloud Financial Management",
    "color": "#3F8624",
    "desc": "Flexible pricing model offering low prices on EC2, Fargate, and Lambda usage"
  },
  {
    "id": "marketplace",
    "name": "AWS Marketplace",
    "shortName": "Marketplace",
    "href": "/marketplace",
    "category": "Cloud Financial Management",
    "color": "#3F8624",
    "desc": "Digital catalog to find, test, buy, and deploy cloud software and third-party data"
  },
  {
    "id": "billing-conductor",
    "name": "AWS Billing Conductor",
    "shortName": "Billing Conductor",
    "href": "/billing-conductor",
    "category": "Cloud Financial Management",
    "color": "#3F8624",
    "desc": "Customize billing rates and invoice presentation for business units and customers"
  },
  {
    "id": "pricing-calculator",
    "name": "AWS Pricing Calculator",
    "shortName": "Pricing Calculator",
    "href": "/pricing-calculator",
    "category": "Cloud Financial Management",
    "color": "#3F8624",
    "desc": "Estimate the cost for your AWS architecture and infrastructure solution"
  },
  {
    "id": "braket",
    "name": "Amazon Braket",
    "shortName": "Braket",
    "href": "/braket",
    "category": "Quantum Technologies & Robotics",
    "color": "#8C4FFF",
    "desc": "Explore and experiment with quantum computing hardware from multiple quantum providers"
  },
  {
    "id": "robomaker",
    "name": "AWS RoboMaker",
    "shortName": "RoboMaker",
    "href": "/robomaker",
    "category": "Quantum Technologies & Robotics",
    "color": "#8C4FFF",
    "desc": "Develop, simulate, and deploy intelligent robotics applications in the cloud"
  },
  {
    "id": "iot-roborunner",
    "name": "AWS IoT RoboRunner",
    "shortName": "IoT RoboRunner",
    "href": "/iot-roborunner",
    "category": "Quantum Technologies & Robotics",
    "color": "#8C4FFF",
    "desc": "Build applications to manage fleets of autonomous mobile robots"
  },
  {
    "id": "managedblockchain",
    "name": "Amazon Managed Blockchain",
    "shortName": "Managed Blockchain",
    "href": "/managedblockchain",
    "category": "Blockchain",
    "color": "#2E27AD",
    "desc": "Create and manage scalable blockchain networks using Ethereum and Hyperledger Fabric"
  },
  {
    "id": "blockchain-query",
    "name": "Amazon Managed Blockchain Query",
    "shortName": "Blockchain Query",
    "href": "/blockchain-query",
    "category": "Blockchain",
    "color": "#2E27AD",
    "desc": "Query standardized blockchain datasets across multiple public blockchains without running nodes"
  },
  {
    "id": "workspaces-core",
    "name": "Amazon WorkSpaces Core",
    "shortName": "WorkSpaces Core",
    "href": "/workspaces-core",
    "category": "End User Computing",
    "color": "#0073bb",
    "desc": "API-driven virtual desktop infrastructure for third-party VDI management solutions"
  },
  {
    "id": "appstream-fleet",
    "name": "Amazon AppStream Fleets",
    "shortName": "AppStream Fleets",
    "href": "/appstream-fleet",
    "category": "End User Computing",
    "color": "#0073bb",
    "desc": "Manage scalable streaming compute resources for enterprise software"
  },
  {
    "id": "workspaces-thin-client",
    "name": "Amazon WorkSpaces Thin Client",
    "shortName": "Thin Client",
    "href": "/workspaces-thin-client",
    "category": "End User Computing",
    "color": "#0073bb",
    "desc": "Low-cost hardware device designed for simple, secure access to virtual desktops"
  },
  {
    "id": "worklink",
    "name": "Amazon WorkLink",
    "shortName": "WorkLink",
    "href": "/worklink",
    "category": "End User Computing",
    "color": "#0073bb",
    "desc": "Secure, one-click access to internal corporate web apps from mobile devices"
  }
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    "category": "Compute",
    "services": [
      {
        "id": "ec2",
        "name": "Amazon EC2",
        "shortName": "EC2",
        "href": "/ec2",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Virtual servers in the cloud with scalable capacity"
      },
      {
        "id": "lambda",
        "name": "AWS Lambda",
        "shortName": "Lambda",
        "href": "/lambda",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Run code without thinking about servers or clusters"
      },
      {
        "id": "elasticbeanstalk",
        "name": "AWS Elastic Beanstalk",
        "shortName": "Elastic Beanstalk",
        "href": "/elasticbeanstalk",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Deploy and scale web applications and services quickly"
      },
      {
        "id": "lightsail",
        "name": "Amazon Lightsail",
        "shortName": "Lightsail",
        "href": "/lightsail",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Easy-to-use virtual private server instances and databases"
      },
      {
        "id": "batch",
        "name": "AWS Batch",
        "shortName": "Batch",
        "href": "/batch",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Run fully managed batch computing jobs at any scale"
      },
      {
        "id": "apprunner",
        "name": "AWS App Runner",
        "shortName": "App Runner",
        "href": "/apprunner",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Build and run containerized web apps and APIs at scale"
      },
      {
        "id": "outposts",
        "name": "AWS Outposts",
        "shortName": "Outposts",
        "href": "/outposts",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Run AWS infrastructure and services on-premises for a consistent hybrid experience"
      },
      {
        "id": "serverlessrepo",
        "name": "AWS Serverless Application Repository",
        "shortName": "Serverless Repo",
        "href": "/serverlessrepo",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Discover, deploy, and publish serverless applications"
      },
      {
        "id": "wavelength",
        "name": "AWS Wavelength",
        "shortName": "Wavelength",
        "href": "/wavelength",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Deliver ultra-low latency applications for 5G devices"
      },
      {
        "id": "vmware-cloud",
        "name": "VMware Cloud on AWS",
        "shortName": "VMware Cloud",
        "href": "/vmware-cloud",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Migrate and extend VMware environments to AWS cloud"
      },
      {
        "id": "localzones",
        "name": "AWS Local Zones",
        "shortName": "Local Zones",
        "href": "/localzones",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Run latency-sensitive applications closer to end users"
      },
      {
        "id": "image-builder",
        "name": "EC2 Image Builder",
        "shortName": "Image Builder",
        "href": "/image-builder",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Build and maintain secure, compliant operating system images"
      },
      {
        "id": "simspaceweaver",
        "name": "AWS SimSpace Weaver",
        "shortName": "SimSpace Weaver",
        "href": "/simspaceweaver",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Run large-scale spatial simulations in the cloud"
      },
      {
        "id": "mainframe-modernization",
        "name": "AWS Mainframe Modernization",
        "shortName": "Mainframe Modernization",
        "href": "/mainframe-modernization",
        "category": "Compute",
        "color": "#FF9900",
        "desc": "Migrate, modernize, and run mainframe workloads on AWS"
      }
    ]
  },
  {
    "category": "Containers",
    "services": [
      {
        "id": "ecs",
        "name": "Amazon Elastic Container Service",
        "shortName": "ECS",
        "href": "/ecs",
        "category": "Containers",
        "color": "#FF9900",
        "desc": "Highly secure, reliable, and scalable way to run containers"
      },
      {
        "id": "eks",
        "name": "Amazon Elastic Kubernetes Service",
        "shortName": "EKS",
        "href": "/eks",
        "category": "Containers",
        "color": "#FF9900",
        "desc": "Run managed Kubernetes container clusters on AWS"
      },
      {
        "id": "ecr",
        "name": "Amazon Elastic Container Registry",
        "shortName": "ECR",
        "href": "/ecr",
        "category": "Containers",
        "color": "#FF9900",
        "desc": "Easily store, manage, share, and deploy container images"
      },
      {
        "id": "rosa",
        "name": "Red Hat OpenShift on AWS",
        "shortName": "ROSA",
        "href": "/rosa",
        "category": "Containers",
        "color": "#FF9900",
        "desc": "Managed Red Hat OpenShift service on AWS infrastructure"
      },
      {
        "id": "app2container",
        "name": "AWS App2Container",
        "shortName": "App2Container",
        "href": "/app2container",
        "category": "Containers",
        "color": "#FF9900",
        "desc": "Containerize and migrate existing Java and .NET web applications"
      },
      {
        "id": "eks-anywhere",
        "name": "Amazon EKS Anywhere",
        "shortName": "EKS Anywhere",
        "href": "/eks-anywhere",
        "category": "Containers",
        "color": "#FF9900",
        "desc": "Create and operate Kubernetes clusters on customer-managed infrastructure"
      },
      {
        "id": "ecs-anywhere",
        "name": "Amazon ECS Anywhere",
        "shortName": "ECS Anywhere",
        "href": "/ecs-anywhere",
        "category": "Containers",
        "color": "#FF9900",
        "desc": "Run container workloads on customer infrastructure with ECS"
      }
    ]
  },
  {
    "category": "Storage",
    "services": [
      {
        "id": "s3",
        "name": "Amazon Simple Storage Service",
        "shortName": "S3",
        "href": "/s3",
        "category": "Storage",
        "color": "#3F8624",
        "status": "functional",
        "desc": "Scalable object storage in the cloud with industry-leading durability"
      },
      {
        "id": "efs",
        "name": "Amazon Elastic File System",
        "shortName": "EFS",
        "href": "/efs",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "Serverless, fully elastic file storage for EC2 and containers"
      },
      {
        "id": "fsx",
        "name": "Amazon FSx",
        "shortName": "FSx",
        "href": "/fsx",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "Fully managed third-party file systems (NetApp, Windows, Lustre, OpenZFS)"
      },
      {
        "id": "glacier",
        "name": "Amazon S3 Glacier",
        "shortName": "S3 Glacier",
        "href": "/glacier",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "Low-cost archive storage in the cloud for compliance and long-term retention",
        "aliases": ["glacier", "s3glacier", "s3-glacier", "s3 glacier", "glaciervaults", "glacier-vaults", "vaults", "archive", "archives", "cold storage"]
      },
      {
        "id": "backup",
        "name": "AWS Backup",
        "shortName": "Backup",
        "href": "/backup",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "Centralized backup management across AWS services and hybrid workloads"
      },
      {
        "id": "storagegateway",
        "name": "AWS Storage Gateway",
        "shortName": "Storage Gateway",
        "href": "/storagegateway",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "Hybrid cloud storage with local caching for seamless on-premises access"
      },
      {
        "id": "ebs",
        "name": "Amazon Elastic Block Store",
        "shortName": "EBS",
        "href": "/ebs",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "High-performance block storage volumes designed for Amazon EC2"
      },
      {
        "id": "snowball",
        "name": "AWS Snow Family",
        "shortName": "Snow Family",
        "href": "/snowball",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "Physical edge computing and data migration devices for extreme environments"
      },
      {
        "id": "datasync",
        "name": "AWS DataSync",
        "shortName": "DataSync",
        "href": "/datasync",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "Automate high-speed data transfer between on-premises and AWS storage"
      },
      {
        "id": "drs",
        "name": "AWS Elastic Disaster Recovery",
        "shortName": "Disaster Recovery",
        "href": "/drs",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "Fast, reliable recovery of physical, virtual, and cloud servers"
      },
      {
        "id": "transfer",
        "name": "AWS Transfer Family",
        "shortName": "Transfer Family",
        "href": "/transfer",
        "category": "Storage",
        "color": "#3F8624",
        "desc": "Fully managed SFTP, FTPS, and FTP support for Amazon S3 and EFS"
      }
    ]
  },
  {
    "category": "Database",
    "services": [
      {
        "id": "dynamodb",
        "name": "Amazon DynamoDB",
        "shortName": "DynamoDB",
        "href": "/dynamodb",
        "category": "Database",
        "color": "#2E27AD",
        "status": "emulator",
        "desc": "Managed NoSQL key-value and document database with single-digit millisecond latency"
      },
      {
        "id": "rds",
        "name": "Amazon Relational Database Service",
        "shortName": "RDS",
        "href": "/rds",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "Managed relational database service for MySQL, PostgreSQL, MariaDB, Oracle, SQL Server"
      },
      {
        "id": "aurora",
        "name": "Amazon Aurora",
        "shortName": "Aurora",
        "href": "/aurora",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "High performance MySQL and PostgreSQL compatible enterprise database"
      },
      {
        "id": "elasticache",
        "name": "Amazon ElastiCache",
        "shortName": "ElastiCache",
        "href": "/elasticache",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "In-memory caching service for Redis and Memcached with microsecond latency"
      },
      {
        "id": "memorydb",
        "name": "Amazon MemoryDB for Redis",
        "shortName": "MemoryDB",
        "href": "/memorydb",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "Redis-compatible, durable in-memory database service with ultra-fast performance"
      },
      {
        "id": "redshift",
        "name": "Amazon Redshift",
        "shortName": "Redshift",
        "href": "/redshift",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "Fast, simple, cost-effective data warehousing and analytics at petabyte scale"
      },
      {
        "id": "neptune",
        "name": "Amazon Neptune",
        "shortName": "Neptune",
        "href": "/neptune",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "Fast, reliable graph database built for highly connected datasets"
      },
      {
        "id": "documentdb",
        "name": "Amazon DocumentDB",
        "shortName": "DocumentDB",
        "href": "/documentdb",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "Fully managed MongoDB-compatible document database with JSON workload support"
      },
      {
        "id": "keyspaces",
        "name": "Amazon Keyspaces",
        "shortName": "Keyspaces",
        "href": "/keyspaces",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "Managed Apache Cassandra-compatible database service"
      },
      {
        "id": "timestream",
        "name": "Amazon Timestream",
        "shortName": "Timestream",
        "href": "/timestream",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "Fast, scalable time-series database for IoT and telemetry applications"
      },
      {
        "id": "qldb",
        "name": "Amazon QLDB",
        "shortName": "QLDB",
        "href": "/qldb",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "Fully managed ledger database providing a transparent, immutable transaction log"
      },
      {
        "id": "rds-custom",
        "name": "Amazon RDS Custom",
        "shortName": "RDS Custom",
        "href": "/rds-custom",
        "category": "Database",
        "color": "#2E27AD",
        "desc": "Managed database with OS and database environment customization"
      }
    ]
  },
  {
    "category": "Networking & Content Delivery",
    "services": [
      {
        "id": "vpc",
        "name": "Amazon Virtual Private Cloud",
        "shortName": "VPC",
        "href": "/vpc",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Isolated cloud resources and virtual networks with granular routing controls"
      },
      {
        "id": "cloudfront",
        "name": "Amazon CloudFront",
        "shortName": "CloudFront",
        "href": "/cloudfront",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Global content delivery network (CDN) for low-latency web distribution"
      },
      {
        "id": "route53",
        "name": "Amazon Route 53",
        "shortName": "Route 53",
        "href": "/route53",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Highly available and scalable Domain Name System (DNS) web service"
      },
      {
        "id": "apigateway",
        "name": "Amazon API Gateway",
        "shortName": "API Gateway",
        "href": "/apigateway",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Build, publish, maintain, monitor, and secure REST, HTTP, and WebSocket APIs"
      },
      {
        "id": "directconnect",
        "name": "AWS Direct Connect",
        "shortName": "Direct Connect",
        "href": "/directconnect",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Dedicated private network connection from on-premises to AWS"
      },
      {
        "id": "elb",
        "name": "Elastic Load Balancing",
        "shortName": "ELB",
        "href": "/elb",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Distribute incoming traffic automatically across multiple targets and availability zones"
      },
      {
        "id": "transitgateway",
        "name": "AWS Transit Gateway",
        "shortName": "Transit Gateway",
        "href": "/transitgateway",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Easily connect VPCs and on-premises networks to a central hub"
      },
      {
        "id": "globalaccelerator",
        "name": "AWS Global Accelerator",
        "shortName": "Global Accelerator",
        "href": "/globalaccelerator",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Improve application availability and performance using the AWS global network"
      },
      {
        "id": "privatelink",
        "name": "AWS PrivateLink",
        "shortName": "PrivateLink",
        "href": "/privatelink",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Establish private connectivity between VPCs and AWS services without public IPs"
      },
      {
        "id": "cloudwan",
        "name": "AWS Cloud WAN",
        "shortName": "Cloud WAN",
        "href": "/cloudwan",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Build, manage, and monitor global wide area networks across clouds and data centers"
      },
      {
        "id": "appmesh",
        "name": "AWS App Mesh",
        "shortName": "App Mesh",
        "href": "/appmesh",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Application-level networking for microservices across compute environments"
      },
      {
        "id": "networkfirewall",
        "name": "AWS Network Firewall",
        "shortName": "Network Firewall",
        "href": "/networkfirewall",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Stateful network inspection and firewall protection for Amazon VPCs"
      },
      {
        "id": "verifiedaccess",
        "name": "AWS Verified Access",
        "shortName": "Verified Access",
        "href": "/verifiedaccess",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Provide secure access to corporate applications without a VPN"
      },
      {
        "id": "route53-arc",
        "name": "Route 53 Application Recovery Controller",
        "shortName": "Route 53 ARC",
        "href": "/route53-arc",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Continuously monitor application recovery readiness and manage automated failover"
      },
      {
        "id": "vpn",
        "name": "AWS Client VPN",
        "shortName": "Client VPN",
        "href": "/vpn",
        "category": "Networking & Content Delivery",
        "color": "#8C4FFF",
        "desc": "Securely connect users to AWS or on-premises networks from any location"
      }
    ]
  },
  {
    "category": "Security, Identity, & Compliance",
    "services": [
      {
        "id": "iam",
        "name": "AWS Identity and Access Management",
        "shortName": "IAM",
        "href": "/iam",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "status": "emulator",
        "desc": "Securely manage access to AWS services, users, groups, and IAM policies"
      },
      {
        "id": "identity-center",
        "name": "AWS IAM Identity Center",
        "shortName": "IAM Identity Center",
        "href": "/identity-center",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Centralize Single Sign-On (SSO) access to multiple AWS accounts and cloud apps"
      },
      {
        "id": "cognito",
        "name": "Amazon Cognito",
        "shortName": "Cognito",
        "href": "/cognito",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Identity for your web and mobile applications with sign-up and sign-in support"
      },
      {
        "id": "secretsmanager",
        "name": "AWS Secrets Manager",
        "shortName": "Secrets Manager",
        "href": "/secretsmanager",
        "category": "Security, Identity, & Compliance",
        "color": "#DD3522",
        "status": "functional",
        "desc": "Rotate, manage, and retrieve database credentials, API keys, and other secrets"
      },
      {
        "id": "kms",
        "name": "AWS Key Management Service",
        "shortName": "KMS",
        "href": "/kms",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "status": "functional",
        "desc": "Managed creation and centralized control of cryptographic keys used to protect data"
      },
      {
        "id": "acm",
        "name": "AWS Certificate Manager",
        "shortName": "Certificate Manager",
        "href": "/acm",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "status": "functional",
        "desc": "Provision, manage, and deploy public and private SSL/TLS certificates",
        "aliases": ["acm", "certificatemanager", "certificate-manager", "certificate manager", "certificates", "certificate", "ssl", "tls", "https", "domain validation"]
      },
      {
        "id": "acm-pca",
        "name": "AWS Private Certificate Authority",
        "shortName": "Private CA",
        "href": "/acm/pca",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Create and manage private certificate authorities to issue private X.509 certificates"
      },
      {
        "id": "guardduty",
        "name": "Amazon GuardDuty",
        "shortName": "GuardDuty",
        "href": "/guardduty",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Intelligent threat detection to protect your AWS accounts, workloads, and data"
      },
      {
        "id": "inspector",
        "name": "Amazon Inspector",
        "shortName": "Inspector",
        "href": "/inspector",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Automated vulnerability management for EC2, container images, and Lambda functions"
      },
      {
        "id": "macie",
        "name": "Amazon Macie",
        "shortName": "Macie",
        "href": "/macie",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Discover and protect sensitive data at scale in Amazon S3 using machine learning"
      },
      {
        "id": "waf",
        "name": "AWS WAF",
        "shortName": "WAF",
        "href": "/waf",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Protect web applications and APIs from common web exploits and bots"
      },
      {
        "id": "shield",
        "name": "AWS Shield",
        "shortName": "Shield",
        "href": "/shield",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Managed DDoS protection service for applications running on AWS"
      },
      {
        "id": "securityhub",
        "name": "AWS Security Hub",
        "shortName": "Security Hub",
        "href": "/securityhub",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Comprehensive cloud security posture management and compliance checks"
      },
      {
        "id": "directoryservice",
        "name": "AWS Directory Service",
        "shortName": "Directory Service",
        "href": "/directoryservice",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "status": "functional",
        "desc": "Managed Microsoft Active Directory in the cloud",
        "aliases": ["directoryservice", "directory service", "active directory", "ad", "simple ad", "managed microsoft ad", "ad connector", "ldap", "kerberos", "domain controller", "sso"]
      },
      {
        "id": "cloudhsm",
        "name": "AWS CloudHSM",
        "shortName": "CloudHSM",
        "href": "/cloudhsm",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Dedicated hardware security module (HSM) appliances for regulatory compliance"
      },
      {
        "id": "network-access-analyzer",
        "name": "Network Access Analyzer",
        "shortName": "Network Analyzer",
        "href": "/network-access-analyzer",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Identify network paths that lead to unintended resource access across VPCs"
      },
      {
        "id": "auditmanager",
        "name": "AWS Audit Manager",
        "shortName": "Audit Manager",
        "href": "/auditmanager",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Continuously audit AWS usage to simplify risk and regulatory assessment"
      },
      {
        "id": "verified-permissions",
        "name": "Amazon Verified Permissions",
        "shortName": "Verified Permissions",
        "href": "/verified-permissions",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "Fine-grained permissions management and authorization service for custom applications"
      },
      {
        "id": "artifact",
        "name": "AWS Artifact",
        "shortName": "Artifact",
        "href": "/artifact",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "desc": "On-demand access to AWS security and compliance reports and certifications"
      },
      {
        "id": "ram",
        "name": "AWS Resource Access Manager",
        "shortName": "RAM",
        "href": "/ram",
        "category": "Security, Identity, & Compliance",
        "color": "#E7157B",
        "status": "functional",
        "desc": "Simple, secure service to share AWS resources across AWS accounts or within your Organization"
      }
    ]
  },
  {
    "category": "Management & Governance",
    "services": [
      {
        "id": "cloudwatch",
        "name": "Amazon CloudWatch",
        "shortName": "CloudWatch",
        "href": "/cloudwatch",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Observability and monitoring for AWS resources and applications in real time"
      },
      {
        "id": "cloudtrail",
        "name": "AWS CloudTrail",
        "shortName": "CloudTrail",
        "href": "/cloudtrail",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Track user activity and API usage across AWS accounts for governance and auditing"
      },
      {
        "id": "cloudformation",
        "name": "AWS CloudFormation",
        "shortName": "CloudFormation",
        "href": "/cloudformation",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Model, provision, and manage AWS and third-party resources as code templates"
      },
      {
        "id": "systems-manager",
        "name": "AWS Systems Manager",
        "shortName": "Systems Manager",
        "href": "/systems-manager",
        "category": "Management & Governance",
        "color": "#C925D1",
        "status": "functional",
        "desc": "Unified operational hub for managing hybrid cloud nodes, Parameter Store, Fleet Manager, and applications",
        "aliases": ["ssm", "systems manager", "parameter store", "fleet manager", "session manager", "run command", "patch manager"]
      },
      {
        "id": "ssm-parameter-store",
        "name": "AWS Systems Manager Parameter Store",
        "shortName": "Parameter Store",
        "href": "/systems-manager/parameter-store",
        "category": "Management & Governance",
        "color": "#C925D1",
        "status": "functional",
        "desc": "Secure, hierarchical storage for configuration data management and secrets management",
        "aliases": ["ssm", "parameter store", "parameters", "parameter", "config store", "systems manager parameter store", "ssm parameter store", "securestring"]
      },
      {
        "id": "organizations",
        "name": "AWS Organizations",
        "shortName": "Organizations",
        "href": "/organizations",
        "category": "Management & Governance",
        "color": "#C925D1",
        "status": "functional",
        "desc": "Centralized management and governance for multiple AWS accounts with policy enforcement"
      },
      {
        "id": "service-quotas",
        "name": "Service Quotas",
        "shortName": "Service Quotas",
        "href": "/service-quotas",
        "category": "Management & Governance",
        "color": "#C925D1",
        "status": "functional",
        "desc": "View and manage quotas for AWS services from a central location as your workloads grow"
      },
      {
        "id": "resource-groups",
        "name": "AWS Resource Groups & Tag Editor",
        "shortName": "Resource Groups & Tag Editor",
        "href": "/resource-groups",
        "category": "Management & Governance",
        "color": "#C925D1",
        "status": "functional",
        "desc": "Organize AWS resources, manage tags across services and Regions, and automate tasks on resource collections"
      },
      {
        "id": "account",
        "name": "AWS Account Management",
        "shortName": "Account Management",
        "href": "/account",
        "category": "Management & Governance",
        "color": "#C925D1",
        "status": "functional",
        "desc": "Manage account information, primary and alternate contacts, AWS Region availability, and account settings"
      },
      {
        "id": "controltower",
        "name": "AWS Control Tower",
        "shortName": "Control Tower",
        "href": "/controltower",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Set up and govern a secure, compliant multi-account AWS environment with guardrails"
      },
      {
        "id": "config",
        "name": "AWS Config",
        "shortName": "Config",
        "href": "/config",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Assess, audit, and evaluate configurations of your AWS resources over time"
      },
      {
        "id": "autoscaling",
        "name": "AWS Auto Scaling",
        "shortName": "Auto Scaling",
        "href": "/autoscaling",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Optimize performance and availability by scaling multiple resources automatically"
      },
      {
        "id": "opsworks",
        "name": "AWS OpsWorks",
        "shortName": "OpsWorks",
        "href": "/opsworks",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Automate configuration, deployment, and management with Chef and Puppet"
      },
      {
        "id": "servicecatalog",
        "name": "AWS Service Catalog",
        "shortName": "Service Catalog",
        "href": "/servicecatalog",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Create and manage catalogs of IT services approved for use on AWS"
      },
      {
        "id": "trustedadvisor",
        "name": "AWS Trusted Advisor",
        "shortName": "Trusted Advisor",
        "href": "/trustedadvisor",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Optimize costs, increase performance, improve security, and monitor quotas"
      },
      {
        "id": "wellarchitected",
        "name": "AWS Well-Architected Tool",
        "shortName": "Well-Architected Tool",
        "href": "/wellarchitected",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Review workloads against AWS architectural best practices"
      },
      {
        "id": "license-manager",
        "name": "AWS License Manager",
        "shortName": "License Manager",
        "href": "/license-manager",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Track and manage software licenses from vendors such as Microsoft, SAP, Oracle"
      },
      {
        "id": "health",
        "name": "AWS Health Dashboard",
        "shortName": "Health Dashboard",
        "href": "/health",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "View personalized events and service status affecting your AWS environment"
      },
      {
        "id": "proton",
        "name": "AWS Proton",
        "shortName": "Proton",
        "href": "/proton",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Automated deployment management for container and serverless applications"
      },
      {
        "id": "grafana",
        "name": "Amazon Managed Grafana",
        "shortName": "Managed Grafana",
        "href": "/grafana",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Fully managed data visualization and analytics service built on Grafana"
      },
      {
        "id": "prometheus",
        "name": "Amazon Managed Service for Prometheus",
        "shortName": "Managed Prometheus",
        "href": "/prometheus",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Secure, highly available, and scalable Prometheus monitoring service"
      },
      {
        "id": "cloudshell",
        "name": "AWS CloudShell",
        "shortName": "CloudShell",
        "href": "/cloudshell",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Browser-based pre-authenticated shell environment with AWS CLI"
      },
      {
        "id": "compute-optimizer",
        "name": "AWS Compute Optimizer",
        "shortName": "Compute Optimizer",
        "href": "/compute-optimizer",
        "category": "Management & Governance",
        "color": "#545b64",
        "desc": "Machine learning-driven recommendations to reduce costs and improve performance"
      }
    ]
  },
  {
    "category": "Analytics",
    "services": [
      {
        "id": "athena",
        "name": "Amazon Athena",
        "shortName": "Athena",
        "href": "/athena",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Query data directly in Amazon S3 using standard SQL without servers"
      },
      {
        "id": "emr",
        "name": "Amazon EMR",
        "shortName": "EMR",
        "href": "/emr",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Run big data frameworks like Apache Spark, Hadoop, Hive, and Presto"
      },
      {
        "id": "opensearch",
        "name": "Amazon OpenSearch Service",
        "shortName": "OpenSearch",
        "href": "/opensearch",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Search, visualize, and analyze petabytes of text and log data"
      },
      {
        "id": "kinesis",
        "name": "Amazon Kinesis Data Streams",
        "shortName": "Kinesis",
        "href": "/kinesis",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Collect and process large streams of data records in real time"
      },
      {
        "id": "kinesis-firehose",
        "name": "Amazon Kinesis Data Firehose",
        "shortName": "Kinesis Firehose",
        "href": "/kinesis-firehose",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Reliably load streaming data into data lakes, warehouses, and analytics services"
      },
      {
        "id": "kinesis-video",
        "name": "Amazon Kinesis Video Streams",
        "shortName": "Kinesis Video Streams",
        "href": "/kinesis-video",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Capture, process, and store video streams for analytics, machine learning, and playback"
      },
      {
        "id": "quicksight",
        "name": "Amazon QuickSight",
        "shortName": "QuickSight",
        "href": "/quicksight",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Serverless business intelligence service with natural language querying"
      },
      {
        "id": "glue",
        "name": "AWS Glue",
        "shortName": "Glue",
        "href": "/glue",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Serverless data integration service that makes it easy to discover, prepare, and combine data"
      },
      {
        "id": "lakeformation",
        "name": "AWS Lake Formation",
        "shortName": "Lake Formation",
        "href": "/lakeformation",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Build, secure, and manage data lakes with fine-grained access control"
      },
      {
        "id": "msk",
        "name": "Amazon Managed Streaming for Apache Kafka",
        "shortName": "MSK",
        "href": "/msk",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Fully managed Apache Kafka service for real-time streaming pipelines"
      },
      {
        "id": "cleanrooms",
        "name": "AWS Clean Rooms",
        "shortName": "Clean Rooms",
        "href": "/cleanrooms",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Collaborate with business partners without sharing underlying raw data"
      },
      {
        "id": "dataexchange",
        "name": "AWS Data Exchange",
        "shortName": "Data Exchange",
        "href": "/dataexchange",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Find, subscribe to, and use third-party data in the cloud"
      },
      {
        "id": "cloudsearch",
        "name": "Amazon CloudSearch",
        "shortName": "CloudSearch",
        "href": "/cloudsearch",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Managed search service for websites and applications"
      },
      {
        "id": "entity-resolution",
        "name": "AWS Entity Resolution",
        "shortName": "Entity Resolution",
        "href": "/entity-resolution",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Match, link, and deduplicate customer and business records across applications"
      },
      {
        "id": "finspace",
        "name": "Amazon FinSpace",
        "shortName": "FinSpace",
        "href": "/finspace",
        "category": "Analytics",
        "color": "#8C4FFF",
        "desc": "Data management and analytics service purpose-built for the financial services industry"
      }
    ]
  },
  {
    "category": "Machine Learning",
    "services": [
      {
        "id": "sagemaker",
        "name": "Amazon SageMaker",
        "shortName": "SageMaker",
        "href": "/sagemaker",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Build, train, and deploy machine learning models for any use case"
      },
      {
        "id": "bedrock",
        "name": "Amazon Bedrock",
        "shortName": "Bedrock",
        "href": "/bedrock",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Build generative AI applications with foundational models from top AI companies"
      },
      {
        "id": "amazon-q",
        "name": "Amazon Q",
        "shortName": "Amazon Q",
        "href": "/amazon-q",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Generative AI-powered assistant for work and software development"
      },
      {
        "id": "comprehend",
        "name": "Amazon Comprehend",
        "shortName": "Comprehend",
        "href": "/comprehend",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Natural language processing (NLP) service to uncover valuable insights in unstructured text"
      },
      {
        "id": "rekognition",
        "name": "Amazon Rekognition",
        "shortName": "Rekognition",
        "href": "/rekognition",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Automate image and video analysis with machine learning computer vision"
      },
      {
        "id": "textract",
        "name": "Amazon Textract",
        "shortName": "Textract",
        "href": "/textract",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Extract printed text, handwriting, and data from documents automatically"
      },
      {
        "id": "transcribe",
        "name": "Amazon Transcribe",
        "shortName": "Transcribe",
        "href": "/transcribe",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Automatic speech recognition (ASR) to convert audio to accurate text"
      },
      {
        "id": "translate",
        "name": "Amazon Translate",
        "shortName": "Translate",
        "href": "/translate",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Fast, high-quality, and customizable neural machine translation"
      },
      {
        "id": "polly",
        "name": "Amazon Polly",
        "shortName": "Polly",
        "href": "/polly",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Turn text into lifelike speech with natural sounding voices"
      },
      {
        "id": "lex",
        "name": "Amazon Lex",
        "shortName": "Lex",
        "href": "/lex",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Build conversational chatbots with voice and text capabilities"
      },
      {
        "id": "kendra",
        "name": "Amazon Kendra",
        "shortName": "Kendra",
        "href": "/kendra",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Intelligent enterprise search service powered by machine learning"
      },
      {
        "id": "personalize",
        "name": "Amazon Personalize",
        "shortName": "Personalize",
        "href": "/personalize",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Deliver tailored product recommendations with machine learning"
      },
      {
        "id": "forecast",
        "name": "Amazon Forecast",
        "shortName": "Forecast",
        "href": "/forecast",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Accurate time-series forecasting service based on machine learning"
      },
      {
        "id": "fraud-detector",
        "name": "Amazon Fraud Detector",
        "shortName": "Fraud Detector",
        "href": "/fraud-detector",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Identify potentially fraudulent online activities using ML models"
      },
      {
        "id": "a2i",
        "name": "Amazon Augmented AI (A2I)",
        "shortName": "Augmented AI",
        "href": "/a2i",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Easily implement human review of machine learning predictions"
      },
      {
        "id": "deepracer",
        "name": "AWS DeepRacer",
        "shortName": "DeepRacer",
        "href": "/deepracer",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Autonomous 1/18th scale race car driven by reinforcement learning"
      },
      {
        "id": "codewhisperer",
        "name": "Amazon Q Developer",
        "shortName": "Q Developer",
        "href": "/codewhisperer",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "AI code companion and generative assistant for developers"
      },
      {
        "id": "healthlake",
        "name": "AWS HealthLake",
        "shortName": "HealthLake",
        "href": "/healthlake",
        "category": "Machine Learning",
        "color": "#01A88D",
        "desc": "Store, transform, query, and analyze health data at scale"
      }
    ]
  },
  {
    "category": "Developer Tools",
    "services": [
      {
        "id": "codecommit",
        "name": "AWS CodeCommit",
        "shortName": "CodeCommit",
        "href": "/codecommit",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Secure, highly scalable private Git repositories"
      },
      {
        "id": "codebuild",
        "name": "AWS CodeBuild",
        "shortName": "CodeBuild",
        "href": "/codebuild",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Build and test code with continuous scaling and pay-per-minute billing"
      },
      {
        "id": "codedeploy",
        "name": "AWS CodeDeploy",
        "shortName": "CodeDeploy",
        "href": "/codedeploy",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Automate software deployments to EC2, ECS, Lambda, and on-premises"
      },
      {
        "id": "codepipeline",
        "name": "AWS CodePipeline",
        "shortName": "CodePipeline",
        "href": "/codepipeline",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Release software using continuous delivery and release pipelines"
      },
      {
        "id": "codeartifact",
        "name": "AWS CodeArtifact",
        "shortName": "CodeArtifact",
        "href": "/codeartifact",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Secure, scalable artifact repository service for software development"
      },
      {
        "id": "cloud9",
        "name": "AWS Cloud9",
        "shortName": "Cloud9",
        "href": "/cloud9",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Cloud-based integrated development environment (IDE) for writing code"
      },
      {
        "id": "xray",
        "name": "AWS X-Ray",
        "shortName": "X-Ray",
        "href": "/xray",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Analyze and debug distributed microservice applications"
      },
      {
        "id": "codecatalyst",
        "name": "Amazon CodeCatalyst",
        "shortName": "CodeCatalyst",
        "href": "/codecatalyst",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Unified software development service to accelerate application delivery"
      },
      {
        "id": "fis",
        "name": "AWS Fault Injection Service",
        "shortName": "Fault Injection",
        "href": "/fis",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Managed chaos engineering service to improve application resiliency"
      },
      {
        "id": "cli",
        "name": "AWS Command Line Interface",
        "shortName": "AWS CLI",
        "href": "/cli",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Unified tool to manage your AWS services from the terminal"
      },
      {
        "id": "cdk",
        "name": "AWS Cloud Development Kit",
        "shortName": "AWS CDK",
        "href": "/cdk",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Define cloud infrastructure using familiar modern programming languages"
      },
      {
        "id": "sam",
        "name": "AWS Serverless Application Model",
        "shortName": "AWS SAM",
        "href": "/sam",
        "category": "Developer Tools",
        "color": "#0073bb",
        "desc": "Open-source framework for building serverless applications"
      }
    ]
  },
  {
    "category": "Application Integration",
    "services": [
      {
        "id": "sqs",
        "name": "Amazon Simple Queue Service",
        "shortName": "SQS",
        "href": "/sqs",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "status": "functional",
        "desc": "Fully managed message queuing service for standard and FIFO message queues"
      },
      {
        "id": "sns",
        "name": "Amazon Simple Notification Service",
        "shortName": "SNS",
        "href": "/sns",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "desc": "High-throughput pub/sub messaging and mobile push notifications"
      },
      {
        "id": "stepfunctions",
        "name": "AWS Step Functions",
        "shortName": "Step Functions",
        "href": "/stepfunctions",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "desc": "Coordinate distributed applications and microservices using visual workflows"
      },
      {
        "id": "eventbridge",
        "name": "Amazon EventBridge",
        "shortName": "EventBridge",
        "href": "/eventbridge",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "desc": "Serverless event bus that ingests and routes events from SaaS applications"
      },
      {
        "id": "amazon-mq",
        "name": "Amazon MQ",
        "shortName": "Amazon MQ",
        "href": "/amazon-mq",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "desc": "Managed message broker for Apache ActiveMQ and RabbitMQ"
      },
      {
        "id": "appflow",
        "name": "Amazon AppFlow",
        "shortName": "AppFlow",
        "href": "/appflow",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "desc": "Secure data transfer between software-as-a-service (SaaS) apps and AWS"
      },
      {
        "id": "swf",
        "name": "Amazon Simple Workflow Service",
        "shortName": "SWF",
        "href": "/swf",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "desc": "Coordinate work across distributed application components"
      },
      {
        "id": "mwaa",
        "name": "Amazon Managed Workflows for Apache Airflow",
        "shortName": "MWAA",
        "href": "/mwaa",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "desc": "Managed Apache Airflow service for end-to-end data pipeline workflows"
      },
      {
        "id": "b2b-data-interchange",
        "name": "AWS B2B Data Interchange",
        "shortName": "B2B Data Interchange",
        "href": "/b2b-data-interchange",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "desc": "Automate Electronic Data Interchange (EDI) transformation and workflows"
      },
      {
        "id": "pipes",
        "name": "Amazon EventBridge Pipes",
        "shortName": "EventBridge Pipes",
        "href": "/pipes",
        "category": "Application Integration",
        "color": "#FF4F8B",
        "desc": "Create point-to-point integrations between event producers and consumers"
      }
    ]
  },
  {
    "category": "Front-End Web & Mobile",
    "services": [
      {
        "id": "amplify",
        "name": "AWS Amplify",
        "shortName": "Amplify",
        "href": "/amplify",
        "category": "Front-End Web & Mobile",
        "color": "#FF9900",
        "desc": "Build, ship, host, and scale fullstack web and mobile apps"
      },
      {
        "id": "appsync",
        "name": "AWS AppSync",
        "shortName": "AppSync",
        "href": "/appsync",
        "category": "Front-End Web & Mobile",
        "color": "#FF9900",
        "desc": "Build serverless GraphQL and Pub/Sub APIs with real-time subscriptions"
      },
      {
        "id": "devicefarm",
        "name": "AWS Device Farm",
        "shortName": "Device Farm",
        "href": "/devicefarm",
        "category": "Front-End Web & Mobile",
        "color": "#FF9900",
        "desc": "Test web and mobile apps across desktop browsers and real devices in the cloud"
      },
      {
        "id": "location",
        "name": "Amazon Location Service",
        "shortName": "Location Service",
        "href": "/location",
        "category": "Front-End Web & Mobile",
        "color": "#FF9900",
        "desc": "Add location data, maps, geocoding, and tracking to applications securely"
      },
      {
        "id": "pinpoint",
        "name": "Amazon Pinpoint",
        "shortName": "Pinpoint",
        "href": "/pinpoint",
        "category": "Front-End Web & Mobile",
        "color": "#FF9900",
        "desc": "Engage customers with targeted multichannel notifications and marketing"
      },
      {
        "id": "mobile-sdk",
        "name": "AWS Mobile SDK",
        "shortName": "Mobile SDK",
        "href": "/mobile-sdk",
        "category": "Front-End Web & Mobile",
        "color": "#FF9900",
        "desc": "Software development kits for iOS, Android, React Native, and Flutter"
      },
      {
        "id": "chime-sdk",
        "name": "Amazon Chime SDK",
        "shortName": "Chime SDK",
        "href": "/chime-sdk",
        "category": "Front-End Web & Mobile",
        "color": "#FF9900",
        "desc": "Add real-time voice, video, screen sharing, and messaging to applications"
      }
    ]
  },
  {
    "category": "Business Applications",
    "services": [
      {
        "id": "connect",
        "name": "Amazon Connect",
        "shortName": "Connect",
        "href": "/connect",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "Cloud-based contact center service with AI-powered conversational routing"
      },
      {
        "id": "workspaces",
        "name": "Amazon WorkSpaces",
        "shortName": "WorkSpaces",
        "href": "/workspaces",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "Secure, fully managed cloud desktop service for remote work"
      },
      {
        "id": "workspaces-web",
        "name": "Amazon WorkSpaces Web",
        "shortName": "WorkSpaces Web",
        "href": "/workspaces-web",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "Low-cost, secure browser access to internal websites and SaaS applications"
      },
      {
        "id": "appstream",
        "name": "Amazon AppStream 2.0",
        "shortName": "AppStream 2.0",
        "href": "/appstream",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "Stream desktop applications securely to any web browser"
      },
      {
        "id": "workdocs",
        "name": "Amazon WorkDocs",
        "shortName": "WorkDocs",
        "href": "/workdocs",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "Secure enterprise document collaboration and storage service"
      },
      {
        "id": "ses",
        "name": "Amazon Simple Email Service",
        "shortName": "SES",
        "href": "/ses",
        "category": "Business Applications",
        "color": "#DD344C",
        "status": "functional",
        "desc": "Cost-effective, flexible email service for sending transactional messages, marketing emails, and managing verified domains",
        "aliases": ["ses", "email", "simple email service", "smtp", "mail", "templates", "identities", "dkim", "suppression list", "configuration sets"]
      },
      {
        "id": "chime",
        "name": "Amazon Chime",
        "shortName": "Chime",
        "href": "/chime",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "Communications service for online meetings, chat, and voice calls"
      },
      {
        "id": "wickr",
        "name": "AWS Wickr",
        "shortName": "Wickr",
        "href": "/wickr",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "End-to-end encrypted messaging and collaboration for security-conscious teams"
      },
      {
        "id": "supply-chain",
        "name": "AWS Supply Chain",
        "shortName": "Supply Chain",
        "href": "/supply-chain",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "Cloud-based supply chain management application with predictive insights"
      },
      {
        "id": "honeycode",
        "name": "Amazon Honeycode",
        "shortName": "Honeycode",
        "href": "/honeycode",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "Build custom mobile and web apps without writing code"
      },
      {
        "id": "simplepay",
        "name": "Amazon Pay for AWS",
        "shortName": "Amazon Pay",
        "href": "/simplepay",
        "category": "Business Applications",
        "color": "#0073bb",
        "desc": "Payment integration service for digital billing and processing"
      }
    ]
  },
  {
    "category": "Internet of Things",
    "services": [
      {
        "id": "iot-core",
        "name": "AWS IoT Core",
        "shortName": "IoT Core",
        "href": "/iot-core",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Connect billions of IoT devices and route trillions of messages to AWS"
      },
      {
        "id": "iot-greengrass",
        "name": "AWS IoT Greengrass",
        "shortName": "IoT Greengrass",
        "href": "/iot-greengrass",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Build intelligent IoT devices with local compute, messaging, and data caching"
      },
      {
        "id": "iot-1click",
        "name": "AWS IoT 1-Click",
        "shortName": "IoT 1-Click",
        "href": "/iot-1click",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Trigger AWS Lambda functions with simple push-button IoT devices"
      },
      {
        "id": "iot-analytics",
        "name": "AWS IoT Analytics",
        "shortName": "IoT Analytics",
        "href": "/iot-analytics",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Collect, preprocess, store, and analyze massive volumes of IoT data"
      },
      {
        "id": "iot-device-defender",
        "name": "AWS IoT Device Defender",
        "shortName": "Device Defender",
        "href": "/iot-device-defender",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Security management and automated anomaly detection for IoT device fleets"
      },
      {
        "id": "iot-device-management",
        "name": "AWS IoT Device Management",
        "shortName": "Device Management",
        "href": "/iot-device-management",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Onboard, organize, monitor, and remotely manage fleets of IoT connected devices"
      },
      {
        "id": "iot-events",
        "name": "AWS IoT Events",
        "shortName": "IoT Events",
        "href": "/iot-events",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Detect and respond to events from IoT sensors and application telemetry"
      },
      {
        "id": "iot-sitewise",
        "name": "AWS IoT SiteWise",
        "shortName": "IoT SiteWise",
        "href": "/iot-sitewise",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Collect, store, organize, and monitor industrial equipment data at scale"
      },
      {
        "id": "iot-fleetwise",
        "name": "AWS IoT FleetWise",
        "shortName": "IoT FleetWise",
        "href": "/iot-fleetwise",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Collect, transform, and transfer vehicle sensor and telemetry data to the cloud"
      },
      {
        "id": "freertos",
        "name": "FreeRTOS",
        "shortName": "FreeRTOS",
        "href": "/freertos",
        "category": "Internet of Things",
        "color": "#3F8624",
        "desc": "Real-time operating system for microcontrollers with cloud connectivity"
      }
    ]
  },
  {
    "category": "Migration & Transfer",
    "services": [
      {
        "id": "migrationhub",
        "name": "AWS Migration Hub",
        "shortName": "Migration Hub",
        "href": "/migrationhub",
        "category": "Migration & Transfer",
        "color": "#3F8624",
        "desc": "Centralized tracking of cloud migrations across AWS and partner tools"
      },
      {
        "id": "mgn",
        "name": "AWS Application Migration Service",
        "shortName": "Application Migration",
        "href": "/mgn",
        "category": "Migration & Transfer",
        "color": "#3F8624",
        "desc": "Automate lift-and-shift server migration to AWS with minimal cutover time"
      },
      {
        "id": "dms",
        "name": "AWS Database Migration Service",
        "shortName": "DMS",
        "href": "/dms",
        "category": "Migration & Transfer",
        "color": "#3F8624",
        "desc": "Migrate relational and NoSQL databases to AWS with virtually zero downtime"
      },
      {
        "id": "sms",
        "name": "AWS Server Migration Service",
        "shortName": "Server Migration",
        "href": "/sms",
        "category": "Migration & Transfer",
        "color": "#3F8624",
        "desc": "Migrate on-premises virtual machine workloads to Amazon EC2"
      },
      {
        "id": "discovery",
        "name": "AWS Application Discovery Service",
        "shortName": "Application Discovery",
        "href": "/discovery",
        "category": "Migration & Transfer",
        "color": "#3F8624",
        "desc": "Plan migration projects by discovering on-premises data center inventory and performance"
      },
      {
        "id": "schema-conversion",
        "name": "AWS Schema Conversion Tool",
        "shortName": "Schema Conversion",
        "href": "/schema-conversion",
        "category": "Migration & Transfer",
        "color": "#3F8624",
        "desc": "Convert commercial database schemas to open-source database targets on AWS"
      },
      {
        "id": "migration-evaluator",
        "name": "Migration Evaluator",
        "shortName": "Migration Evaluator",
        "href": "/migration-evaluator",
        "category": "Migration & Transfer",
        "color": "#3F8624",
        "desc": "Create business cases and directional cloud cost estimates for AWS migration"
      },
      {
        "id": "launch-wizard",
        "name": "AWS Launch Wizard",
        "shortName": "Launch Wizard",
        "href": "/launch-wizard",
        "category": "Migration & Transfer",
        "color": "#3F8624",
        "desc": "Guide the sizing, configuration, and deployment of enterprise applications"
      }
    ]
  },
  {
    "category": "Media Services",
    "services": [
      {
        "id": "mediaconnect",
        "name": "AWS Elemental MediaConnect",
        "shortName": "MediaConnect",
        "href": "/mediaconnect",
        "category": "Media Services",
        "color": "#FF9900",
        "desc": "High-quality, reliable, and secure live video transport service"
      },
      {
        "id": "mediaconvert",
        "name": "AWS Elemental MediaConvert",
        "shortName": "MediaConvert",
        "href": "/mediaconvert",
        "category": "Media Services",
        "color": "#FF9900",
        "desc": "Broadcast-grade file-based video processing and transcoding service"
      },
      {
        "id": "medialive",
        "name": "AWS Elemental MediaLive",
        "shortName": "MediaLive",
        "href": "/medialive",
        "category": "Media Services",
        "color": "#FF9900",
        "desc": "Broadcast-grade live video processing service for streaming channels"
      },
      {
        "id": "mediapackage",
        "name": "AWS Elemental MediaPackage",
        "shortName": "MediaPackage",
        "href": "/mediapackage",
        "category": "Media Services",
        "color": "#FF9900",
        "desc": "Reliably prepare and protect video streams for delivery to Internet devices"
      },
      {
        "id": "mediastore",
        "name": "AWS Elemental MediaStore",
        "shortName": "MediaStore",
        "href": "/mediastore",
        "category": "Media Services",
        "color": "#FF9900",
        "desc": "Storage service optimized for media delivery with low latency and high concurrency"
      },
      {
        "id": "mediatailor",
        "name": "AWS Elemental MediaTailor",
        "shortName": "MediaTailor",
        "href": "/mediatailor",
        "category": "Media Services",
        "color": "#FF9900",
        "desc": "Scalable server-side ad insertion and linear channel assembly"
      },
      {
        "id": "ivs",
        "name": "Amazon Interactive Video Service",
        "shortName": "IVS",
        "href": "/ivs",
        "category": "Media Services",
        "color": "#FF9900",
        "desc": "Managed live streaming solution designed to power interactive video experiences"
      },
      {
        "id": "nimblestudio",
        "name": "Amazon Nimble Studio",
        "shortName": "Nimble Studio",
        "href": "/nimblestudio",
        "category": "Media Services",
        "color": "#FF9900",
        "desc": "Build virtual visual effects, animation, and interactive content studios"
      }
    ]
  },
  {
    "category": "Cloud Financial Management",
    "services": [
      {
        "id": "cost-explorer",
        "name": "AWS Cost Explorer",
        "shortName": "Cost Explorer",
        "href": "/cost-explorer",
        "category": "Cloud Financial Management",
        "color": "#3F8624",
        "desc": "Visualize, understand, and manage your AWS costs and usage over time"
      },
      {
        "id": "budgets",
        "name": "AWS Budgets",
        "shortName": "Budgets",
        "href": "/budgets",
        "category": "Cloud Financial Management",
        "color": "#3F8624",
        "desc": "Set custom cost and usage budgets that alert you when thresholds are exceeded"
      },
      {
        "id": "cur",
        "name": "AWS Cost and Usage Report",
        "shortName": "Cost and Usage Report",
        "href": "/cur",
        "category": "Cloud Financial Management",
        "color": "#3F8624",
        "desc": "Deep dive into comprehensive data on your AWS costs and resource usage"
      },
      {
        "id": "savingsplans",
        "name": "AWS Savings Plans",
        "shortName": "Savings Plans",
        "href": "/savingsplans",
        "category": "Cloud Financial Management",
        "color": "#3F8624",
        "desc": "Flexible pricing model offering low prices on EC2, Fargate, and Lambda usage"
      },
      {
        "id": "marketplace",
        "name": "AWS Marketplace",
        "shortName": "Marketplace",
        "href": "/marketplace",
        "category": "Cloud Financial Management",
        "color": "#3F8624",
        "desc": "Digital catalog to find, test, buy, and deploy cloud software and third-party data"
      },
      {
        "id": "billing-conductor",
        "name": "AWS Billing Conductor",
        "shortName": "Billing Conductor",
        "href": "/billing-conductor",
        "category": "Cloud Financial Management",
        "color": "#3F8624",
        "desc": "Customize billing rates and invoice presentation for business units and customers"
      },
      {
        "id": "pricing-calculator",
        "name": "AWS Pricing Calculator",
        "shortName": "Pricing Calculator",
        "href": "/pricing-calculator",
        "category": "Cloud Financial Management",
        "color": "#3F8624",
        "desc": "Estimate the cost for your AWS architecture and infrastructure solution"
      }
    ]
  },
  {
    "category": "Quantum Technologies & Robotics",
    "services": [
      {
        "id": "braket",
        "name": "Amazon Braket",
        "shortName": "Braket",
        "href": "/braket",
        "category": "Quantum Technologies & Robotics",
        "color": "#8C4FFF",
        "desc": "Explore and experiment with quantum computing hardware from multiple quantum providers"
      },
      {
        "id": "robomaker",
        "name": "AWS RoboMaker",
        "shortName": "RoboMaker",
        "href": "/robomaker",
        "category": "Quantum Technologies & Robotics",
        "color": "#8C4FFF",
        "desc": "Develop, simulate, and deploy intelligent robotics applications in the cloud"
      },
      {
        "id": "iot-roborunner",
        "name": "AWS IoT RoboRunner",
        "shortName": "IoT RoboRunner",
        "href": "/iot-roborunner",
        "category": "Quantum Technologies & Robotics",
        "color": "#8C4FFF",
        "desc": "Build applications to manage fleets of autonomous mobile robots"
      }
    ]
  },
  {
    "category": "Blockchain",
    "services": [
      {
        "id": "managedblockchain",
        "name": "Amazon Managed Blockchain",
        "shortName": "Managed Blockchain",
        "href": "/managedblockchain",
        "category": "Blockchain",
        "color": "#2E27AD",
        "desc": "Create and manage scalable blockchain networks using Ethereum and Hyperledger Fabric"
      },
      {
        "id": "blockchain-query",
        "name": "Amazon Managed Blockchain Query",
        "shortName": "Blockchain Query",
        "href": "/blockchain-query",
        "category": "Blockchain",
        "color": "#2E27AD",
        "desc": "Query standardized blockchain datasets across multiple public blockchains without running nodes"
      }
    ]
  },
  {
    "category": "End User Computing",
    "services": [
      {
        "id": "workspaces-core",
        "name": "Amazon WorkSpaces Core",
        "shortName": "WorkSpaces Core",
        "href": "/workspaces-core",
        "category": "End User Computing",
        "color": "#0073bb",
        "desc": "API-driven virtual desktop infrastructure for third-party VDI management solutions"
      },
      {
        "id": "appstream-fleet",
        "name": "Amazon AppStream Fleets",
        "shortName": "AppStream Fleets",
        "href": "/appstream-fleet",
        "category": "End User Computing",
        "color": "#0073bb",
        "desc": "Manage scalable streaming compute resources for enterprise software"
      },
      {
        "id": "workspaces-thin-client",
        "name": "Amazon WorkSpaces Thin Client",
        "shortName": "Thin Client",
        "href": "/workspaces-thin-client",
        "category": "End User Computing",
        "color": "#0073bb",
        "desc": "Low-cost hardware device designed for simple, secure access to virtual desktops"
      },
      {
        "id": "worklink",
        "name": "Amazon WorkLink",
        "shortName": "WorkLink",
        "href": "/worklink",
        "category": "End User Computing",
        "color": "#0073bb",
        "desc": "Secure, one-click access to internal corporate web apps from mobile devices"
      }
    ]
  }
];

export function findServiceByHref(href: string): ServiceDefinition | undefined {
  const cleanHref = (href.startsWith("/") ? href : "/" + href).toLowerCase().trim().replace(/\/$/, "");
  if (cleanHref === "/s3glacier" || cleanHref === "/s3-glacier" || cleanHref === "/s3_glacier" || cleanHref === "/glaciervaults") {
    return ALL_SERVICES.find((s) => s.id === "glacier");
  }
  return ALL_SERVICES.find((s) => s.href.toLowerCase() === cleanHref.toLowerCase());
}

export function findServiceById(id: string): ServiceDefinition | undefined {
  return ALL_SERVICES.find((s) => s.id.toLowerCase() === id.toLowerCase());
}

// Automatically ensure only genuinely built services have status: "functional", and clear any erroneous status
for (const s of ALL_SERVICES) {
  if (isServiceFullyBuilt(s.id) || isServiceFullyBuilt(s.href)) {
    s.status = "functional";
  } else {
    delete s.status;
  }
}

for (const cat of SERVICE_CATEGORIES) {
  for (const s of cat.services) {
    if (isServiceFullyBuilt(s.id) || isServiceFullyBuilt(s.href)) {
      s.status = "functional";
    } else {
      delete s.status;
    }
  }
}
