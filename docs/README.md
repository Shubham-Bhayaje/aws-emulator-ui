# AWS Emulator UI Documentation Index

Welcome to the documentation for the AWS Emulator UI. This directory contains detailed guides, concept explanations, and hands-on walkthroughs for services built into the console.

## Available Guides

- [Troubleshooting & Diagnostics Guide](troubleshooting.md): Solutions for loopback connection timeouts (`ETIMEDOUT`), container launch failures (`ECONNREFUSED`), out-of-memory (`Killed`) errors, WSL networking configuration, and emulator certificate handling.
- [AWS Management Console Home](Console%20Home.md): Central customizable dashboard for cloud monitoring, operational health telemetry, security compliance posture (Security Hub), cost and usage tracking, quick-start solution templates, and recent service navigation.
- [AWS Account Management](Account%20Management.md): Manage account details, primary and alternate contacts (Billing, Operations, Security), AWS Region opt-in availability, and account closure.
- [AWS AppConfig](AppConfig.md): Quickly and safely deploy dynamic application configuration and feature flags across applications and environments without code deployments, with progressive deployment strategies, bake times, automatic alarm rollbacks, and interactive AppConfigData client retrieval.
- [AWS Certificate Manager (ACM)](ACM.md): Provision, request, and manage SSL/TLS certificates, validate domain ownership via DNS (Route 53 CNAME) or email, import third-party X.509 certificates and private keys, inspect certificate PEM bodies, and toggle Certificate Transparency logging.
- [AWS Client VPN](CLIENT_VPN.md): Managed client-based OpenVPN solution enabling remote user devices to securely connect to Amazon VPC and private network resources. Manage Client VPN endpoints, ACM server and client mutual TLS certificates, target network subnet associations, client routing tables, security groups, and downloadable OpenVPN (.ovpn) configuration profiles.
- [AWS Cloud Map](Cloud%20Map.md): Fully managed cloud service discovery and resource registry. Create HTTP, private DNS (with VPC association), and public DNS namespaces, configure routing policies and health checking, register/deregister service instances with custom attributes, and test live DiscoverInstances API queries.
- [AWS CloudHSM](CloudHSM.md): Dedicated hardware security module (HSM) cluster management inside Amazon VPC, multi-AZ HSM provisioning, cluster CSR export, cluster initialization workflow, automated backup retention, and teardown safety controls.
- [AWS Direct Connect](DIRECT_CONNECT.md): Dedicated physical network connection from on-premises data centers to AWS. Manage dedicated connections, colocation locations, LOA-CFA cross-connect authorization letters, Direct Connect Gateways, private/transit/public virtual interfaces, and BGP peering configurations.
- [AWS Directory Service](Directory%20Service.md): Set up and manage Microsoft Active Directory, Simple AD, and AD Connector in the cloud, configure Access URL aliases, enable Single Sign-On (SSO), take point-in-time snapshots, reset domain admin credentials, and inspect trust relationships.
- [AWS Key Management Service (KMS)](KMS.md): Create and manage customer keys, inspect AWS managed keys, configure key policies, toggle annual rotation, and test live encryption/decryption in the playground.
- [AWS Private Certificate Authority (Private CA)](Private%20CA.md): Create and manage private root and subordinate certificate authorities, generate and export CSRs, install CA certificates, issue and revoke private X.509 certificates with standard templates, configure S3 CRL revocation, and manage soft-deletion retention windows.
- [AWS Resource Explorer](Resource%20Explorer.md): Resource search and discovery service across AWS Regions. Create and configure regional and aggregator indexes, define custom views with fine-grained filter expressions, toggle tag inclusion, set default views, and execute rapid searches across cloud resources.
- [AWS Route 53 Resolver](Route%2053%20Resolver.md): Regional hybrid DNS service connecting Amazon VPCs and on-premises networks. Inbound endpoints for resolving AWS private hosted zones from on-premises networks, outbound endpoints for forwarding VPC DNS queries to corporate DNS resolvers, conditional forwarding and system rules, VPC rule associations, centralized query logging to CloudWatch Logs and S3, and DNS Firewall.
- [AWS Secrets Manager](Secrets%20Manager.md): Store, retrieve, update, and manage sensitive credentials and API keys with KMS encryption at rest, version staging labels (AWSCURRENT, AWSPREVIOUS), resource permissions, and scheduled recovery windows.
- [AWS Site-to-Site VPN](SITE_TO_SITE_VPN.md): Secure encrypted hybrid networking connecting on-premises branch offices and corporate data centers to Amazon VPC and AWS Transit Gateway. Manage Customer Gateways, Virtual Private Gateways, dual redundant IPsec tunnels, BGP dynamic and static routing, router sample configuration downloads, and VPC route table targets.
- [AWS Systems Manager Parameter Store](SSM%20Parameter%20Store.md): Secure, hierarchical storage for configuration data management and secrets management with KMS encryption (SecureString), version history tracking, version staging labels, and resource tagging.
- [AWS Transit Gateway](TRANSIT_GATEWAY.md): Centralized regional network transit hub interconnecting Amazon VPCs and on-premises networks. Configure transit gateways, VPC attachments with per-AZ subnets, transit gateway route tables, associations, dynamic propagations, static and blackhole routes, and VPC route table routing targets.
- [Amazon CloudWatch Logs](CloudWatch%20Logs.md): Centralized logging service, log groups and streams management, retention policies, live tail streaming terminal, filter and search engine, metric filters to numerical metrics, and real-time subscription filters into Amazon Kinesis and AWS Lambda.
- [Amazon Elastic Container Registry (ECR)](ECR.md): Fully managed Docker container registry, private and public repositories, image tags immutability, automated vulnerability scanning on push, repository resource policies, automated image lifecycle cleanup policies, push commands for Docker CLI, and pull through cache rules.
- [Amazon Location Service](Location%20Service.md): Fully managed geospatial service for interactive maps (Esri, HERE, Open Data), asset and IoT device position tracking with filtering, virtual geofence boundaries (Circle, Polygon) with EventBridge alerts, turn-by-turn route calculators, place indexes, and API keys.
- [Amazon DynamoDB](DynamoDB.md): Fast and flexible NoSQL database service, global tables inventory, partition and sort keys, on-demand and provisioned capacity modes, item explorer with scan and query engine, Time to Live (TTL), Point-in-time recovery (PITR), on-demand backups, and DynamoDB Streams.
- [Amazon Kinesis Data Streams](Kinesis%20Data%20Streams.md): Massively scalable real-time streaming data service, on-demand and provisioned shard capacity modes, live data ingestion and record viewer, retention period management (up to 365 days), AWS KMS encryption at rest, enhanced fan-out consumer registration, and DynamoDB streaming destinations.
- [Amazon Keyspaces (for Apache Cassandra)](Keyspaces.md): Scalable, highly available, and managed Apache Cassandra-compatible database service. Manage keyspaces, multi-region replication, tables with dynamic Cassandra column schema builder, on-demand and provisioned capacity modes, KMS encryption at rest, Point-in-time recovery (PITR), and default Time to Live (TTL).
- [Amazon S3 (Simple Storage Service)](S3.md): Scalable cloud object storage, buckets and prefixes navigation, versioning, default encryption with KMS, granular Block Public Access controls, bucket policies, static website hosting, and lifecycle management.
- [Amazon S3 Glacier](S3%20Glacier.md): Low-cost cold data storage and archiving, vaults lifecycle management, archive uploads and checksum tracking, asynchronous inventory and archive retrieval jobs, and data retrieval policies.
- [Amazon SES (Simple Email Service)](SES.md): Fully managed cloud email service, verified email and domain identities, Easy DKIM signing with RSA 2048-bit keys, custom MAIL FROM domain alignment, bounce and complaint notification tracking with Amazon SNS, reusable HTML and text email templates with Mustache variables, account-level suppression lists, and dedicated SMTP credentials.
- [Amazon SNS (Simple Notification Service)](SNS.md): Fully managed pub/sub messaging service, Standard and FIFO topics, fanout architectures, protocol subscriptions (SQS, Lambda, HTTP/S, Email), message attributes, and subscription filter policies.
- [Amazon SQS (Simple Queue Service)](SQS.md): Fully managed message queuing service for microservices, Standard and FIFO queues, visibility timeout, dead-letter queues (DLQs), message deduplication, and KMS encryption.
- [Amazon Timestream](Timestream.md): Fast, scalable, serverless time-series database for IoT and operational applications. Dual storage tiering (in-memory hot store and magnetic cold store), automated retention policies, live data ingestion, SQL query editor, and KMS encryption.
- [Amazon Virtual Private Cloud (Amazon VPC)](VPC.md): Logically isolated virtual network provisioning, CIDR block allocation, public and private subnets, route tables and routes, internet gateways, NAT gateways, security groups, network ACLs, Elastic IPs, VPC endpoints (Gateway and Interface), peering connections, and DHCP option sets.
- [Resource Groups Tagging API](Resource%20Groups%20Tagging%20API.md): Find tagged resources across services and Regions, bulk add/edit/remove tags via Tag Editor, and create tag-based Resource Groups.
- [Service Quotas](Service%20Quotas.md): View and manage service limits, request quota increases, configure organization quota request templates, and track change request history.

## Integration Backlog

The following table tracks inter-service integrations that are waiting on future services to be built:

| Source Service | Target / Dependent Service | Integration Feature | Status / Action Needed |
|---|---|---|---|
| Amazon SQS | Amazon SNS | SNS topic subscriptions tab on queue detail page | Connected live SNS topic subscription modal and active subscriptions list |
| Amazon S3 Glacier | Amazon SNS | Vault event notifications (archive/inventory retrieval completed) | Connected live SNS topic dropdown and notification policy to Amazon SNS |
| Amazon SNS | Amazon CloudWatch Logs | Delivery status logging to CloudWatch Logs | Connected live CloudWatch Logs log groups to Amazon SNS |
| Amazon CloudWatch Logs | Amazon OpenSearch Service | Subscription filter destination for OpenSearch indexing | Connect OpenSearch cluster destinations when Amazon OpenSearch Service is built |
| Amazon CloudWatch Logs | Amazon Data Firehose | Subscription filter destination for Firehose delivery streams | Connect Firehose delivery streams when Amazon Data Firehose is built |
| Amazon S3 | Amazon SNS / SQS | S3 Event Notifications destination (Bucket Events) | Add SNS and SQS destinations to bucket event configuration |
| Amazon DynamoDB | AWS Backup | Continuous compliance and automated backup plans | Connect scheduled backup policies when AWS Backup is built |
| Amazon DynamoDB | Amazon Kinesis | DynamoDB Kinesis data stream destination | Connected live Kinesis data streams destination selector and stream status management |
| Amazon Kinesis | Amazon CloudWatch | Shard-level detailed CloudWatch metrics and alarm dashboards | Connect CloudWatch metrics tab when Amazon CloudWatch is built |
| Amazon Kinesis | Amazon Data Firehose | Delivery stream source destination forwarding stream records into S3 | Connect Firehose delivery streams when Amazon Data Firehose is built |
| Amazon Kinesis | Amazon Managed Service for Apache Flink | Stream processing analytics application integration | Connect Apache Flink applications when Managed Service for Apache Flink is built |
| Console Home | Amazon CloudWatch | CloudWatch Alarms widget | Connect CloudWatch alarms (In alarm, OK, Insufficient data) when Amazon CloudWatch is built |
| Console Home | AWS Application Manager | Applications widget | Connect AppRegistry and application monitoring when AWS Application Manager is built |
| Amazon Keyspaces | Amazon CloudWatch | Monitoring metrics and alarms for read/write units and latency | Connect CloudWatch metrics tab when Amazon CloudWatch is built |
| Amazon Keyspaces | AWS Backup | Centrally managed backup compliance for Keyspaces tables | Connect Keyspaces backup policies when AWS Backup is built |
| Amazon Timestream | Amazon CloudWatch | Monitoring metrics and alarms for ingested bytes and query latencies | Connect CloudWatch metrics tab when Amazon CloudWatch is built |
| Amazon Timestream | AWS IoT Core | Ingestion rules forwarding IoT sensor telemetry to Timestream tables | Connect IoT Core rule actions when AWS IoT Core is built |
| Amazon Timestream | Amazon QuickSight | Business intelligence dashboards and time series visualization | Connect QuickSight data sources when Amazon QuickSight is built |
| Amazon ECS | Amazon ECR | Task definition container image references pulled from ECR private repositories | Connect container image selector when Amazon ECS is built |
| AWS Lambda | Amazon ECR | Container image deployment packages selected from ECR repositories | Connect container image package dropdown when AWS Lambda container packaging is built |
| AWS App Runner | Amazon ECR | Service deployment source pulling container images from ECR | Connect ECR image selector when AWS App Runner is built |
| Amazon ECR | Amazon Inspector | Enhanced vulnerability scanning for container images in registry settings | Connect Amazon Inspector when Amazon Inspector is built |
| Amazon Route 53 | Amazon SES | 1-click automatic DNS record provisioning for DKIM CNAMEs, domain verification tokens, and Custom MAIL FROM MX/TXT records | Connect automated Route 53 resource record publishing when Amazon Route 53 is built |
| Amazon EventBridge | Amazon SES | EventBridge event bus destinations for SES configuration set email sending events | Connect EventBridge event buses when Amazon EventBridge is built |
| AWS Lambda | Amazon SES | Inbound email receipt rules triggering Lambda function processing | Connect Lambda function execution when AWS Lambda is built |
| Amazon Pinpoint | Amazon SES | Cross-service transactional and marketing email delivery infrastructure | Connect Pinpoint campaigns when Amazon Pinpoint is built |
| AWS Lambda | AWS AppConfig | Custom extension action points invoking Lambda functions before/during deployments | Connect Lambda function selection when AWS Lambda is built |
| Amazon EventBridge | AWS AppConfig | Forward deployment event transitions (started, completed, rolled back) to EventBridge | Connect custom EventBridge event buses when Amazon EventBridge is built |
| AWS CodePipeline | AWS AppConfig | AppConfig deployment action provider in continuous delivery pipelines | Connect AppConfig deploy stage when AWS CodePipeline is built |
| Amazon EventBridge | Amazon Location Service | Geofence enter and exit events emitted from tracker-geofence collection evaluations | Connect EventBridge event rules when Amazon EventBridge is built |
| Amazon Cognito | Amazon Location Service | Cognito Identity Pool temporary credentials for client-side map rendering | Connect Cognito Identity Pools when Amazon Cognito is built |
| AWS CloudWatch | Amazon Location Service | Tracking request volume, tile cache hits, and device positions metrics | Connect CloudWatch metrics dashboard when Amazon CloudWatch is built |
| AWS IoT Core | Amazon Location Service | IoT topic rules directly ingesting device telemetry into Location Trackers | Connect IoT Core rule actions when AWS IoT Core is built |
| Route 53 Health Checks | AWS Cloud Map | Route 53 active endpoint health check monitoring for registered service instances | Connect Route 53 health checking when Route 53 Health Checks is built |
| Amazon ECS | AWS Cloud Map | Automated ECS service discovery registration and deregistration for task container instances | Connect ECS service discovery when Amazon ECS is built |
| AWS App Mesh | AWS Cloud Map | Service discovery provider integration for virtual nodes and proxy routing | Connect App Mesh service discovery provider when AWS App Mesh is built |
| AWS Organizations | AWS Resource Explorer | Organization-wide multi-account resource search views | Connect multi-account search views when AWS Organizations cross-account indexing is built |
| AWS CloudTrail | AWS Resource Explorer | Audit logging of search queries and view modifications | Connect CloudTrail log trails when AWS CloudTrail is built |
| Amazon Route 53 | Amazon VPC | Private hosted zone VPC association | Connect Route 53 private hosted zones when Amazon Route 53 is built |
| AWS Transit Gateway | Amazon VPC | Transit Gateway attachments and VPC route table targets | Connected live Transit Gateway attachments and VPC route table targets |
| AWS Site-to-Site VPN | AWS Transit Gateway | VPN attachments to Transit Gateway hub | Connected live Transit Gateway target support and VPN attachment workflow |
| AWS Direct Connect | AWS Transit Gateway | Direct Connect gateway attachments to Transit Gateway hub | Connected live Direct Connect gateway attachment workflow and Direct Connect management links |
| AWS Network Firewall | Amazon VPC | Firewall endpoints and subnet routing rules | Connect Network Firewall when AWS Network Firewall is built |
| AWS Client VPN | Amazon VPC | Client VPN endpoint subnet associations | Connected live Client VPN target network associations and client routing |
| Route 53 Resolver | Amazon Data Firehose | Query logging destination for streaming DNS queries | Connect Firehose delivery stream destination when Amazon Data Firehose is built |

---

*For project setup, architecture, and contribution instructions, please refer to the main [README.md](../README.md).*
