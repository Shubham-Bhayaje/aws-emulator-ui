# AWS Emulator UI Documentation Index

Welcome to the documentation for the AWS Emulator UI. This directory contains detailed guides, concept explanations, and hands-on walkthroughs for services built into the console.

## Available Guides

- [AWS Management Console Home](Console%20Home.md): Central customizable dashboard for cloud monitoring, operational health telemetry, security compliance posture (Security Hub), cost and usage tracking, quick-start solution templates, and recent service navigation.
- [AWS Account Management](Account%20Management.md): Manage account details, primary and alternate contacts (Billing, Operations, Security), AWS Region opt-in availability, and account closure.
- [AWS Certificate Manager (ACM)](ACM.md): Provision, request, and manage SSL/TLS certificates, validate domain ownership via DNS (Route 53 CNAME) or email, import third-party X.509 certificates and private keys, inspect certificate PEM bodies, and toggle Certificate Transparency logging.
- [AWS CloudHSM](CloudHSM.md): Dedicated hardware security module (HSM) cluster management inside Amazon VPC, multi-AZ HSM provisioning, cluster CSR export, cluster initialization workflow, automated backup retention, and teardown safety controls.
- [AWS Directory Service](Directory%20Service.md): Set up and manage Microsoft Active Directory, Simple AD, and AD Connector in the cloud, configure Access URL aliases, enable Single Sign-On (SSO), take point-in-time snapshots, reset domain admin credentials, and inspect trust relationships.
- [AWS Key Management Service (KMS)](KMS.md): Create and manage customer keys, inspect AWS managed keys, configure key policies, toggle annual rotation, and test live encryption/decryption in the playground.
- [AWS Private Certificate Authority (Private CA)](Private%20CA.md): Create and manage private root and subordinate certificate authorities, generate and export CSRs, install CA certificates, issue and revoke private X.509 certificates with standard templates, configure S3 CRL revocation, and manage soft-deletion retention windows.
- [AWS Secrets Manager](Secrets%20Manager.md): Store, retrieve, update, and manage sensitive credentials and API keys with KMS encryption at rest, version staging labels (AWSCURRENT, AWSPREVIOUS), resource permissions, and scheduled recovery windows.
- [AWS Systems Manager Parameter Store](SSM%20Parameter%20Store.md): Secure, hierarchical storage for configuration data management and secrets management with KMS encryption (SecureString), version history tracking, version staging labels, and resource tagging.
- [Amazon DynamoDB](DynamoDB.md): Fast and flexible NoSQL database service, global tables inventory, partition and sort keys, on-demand and provisioned capacity modes, item explorer with scan and query engine, Time to Live (TTL), Point-in-time recovery (PITR), on-demand backups, and DynamoDB Streams.
- [Amazon Kinesis Data Streams](Kinesis%20Data%20Streams.md): Massively scalable real-time streaming data service, on-demand and provisioned shard capacity modes, live data ingestion and record viewer, retention period management (up to 365 days), AWS KMS encryption at rest, enhanced fan-out consumer registration, and DynamoDB streaming destinations.
- [Amazon Keyspaces (for Apache Cassandra)](Keyspaces.md): Scalable, highly available, and managed Apache Cassandra-compatible database service. Manage keyspaces, multi-region replication, tables with dynamic Cassandra column schema builder, on-demand and provisioned capacity modes, KMS encryption at rest, Point-in-time recovery (PITR), and default Time to Live (TTL).
- [Amazon S3 (Simple Storage Service)](S3.md): Scalable cloud object storage, buckets and prefixes navigation, versioning, default encryption with KMS, granular Block Public Access controls, bucket policies, static website hosting, and lifecycle management.
- [Amazon S3 Glacier](S3%20Glacier.md): Low-cost cold data storage and archiving, vaults lifecycle management, archive uploads and checksum tracking, asynchronous inventory and archive retrieval jobs, and data retrieval policies.
- [Amazon SNS (Simple Notification Service)](SNS.md): Fully managed pub/sub messaging service, Standard and FIFO topics, fanout architectures, protocol subscriptions (SQS, Lambda, HTTP/S, Email), message attributes, and subscription filter policies.
- [Amazon SQS (Simple Queue Service)](SQS.md): Fully managed message queuing service for microservices, Standard and FIFO queues, visibility timeout, dead-letter queues (DLQs), message deduplication, and KMS encryption.
- [Amazon Timestream](Timestream.md): Fast, scalable, serverless time-series database for IoT and operational applications. Dual storage tiering (in-memory hot store and magnetic cold store), automated retention policies, live data ingestion, SQL query editor, and KMS encryption.
- [Resource Groups Tagging API](Resource%20Groups%20Tagging%20API.md): Find tagged resources across services and Regions, bulk add/edit/remove tags via Tag Editor, and create tag-based Resource Groups.
- [Service Quotas](Service%20Quotas.md): View and manage service limits, request quota increases, configure organization quota request templates, and track change request history.

## Integration Backlog

The following table tracks inter-service integrations that are waiting on future services to be built:

| Source Service | Target / Dependent Service | Integration Feature | Status / Action Needed |
|---|---|---|---|
| Amazon SQS | Amazon SNS | SNS topic subscriptions tab on queue detail page | Connected live SNS topic subscription modal and active subscriptions list |
| Amazon S3 Glacier | Amazon SNS | Vault event notifications (archive/inventory retrieval completed) | Connected live SNS topic dropdown and notification policy to Amazon SNS |
| Amazon SNS | Amazon CloudWatch | Delivery status logging to CloudWatch Logs | Connect CloudWatch Logs log groups when Amazon CloudWatch Logs is built |
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

---

*For project setup, architecture, and contribution instructions, please refer to the main [README.md](../README.md).*
