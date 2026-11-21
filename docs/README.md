# AWS Emulator UI Documentation Index

Welcome to the documentation for the AWS Emulator UI. This directory contains detailed guides, concept explanations, and hands-on walkthroughs for services built into the console.

## Available Guides

- [AWS Account Management](Account%20Management.md): Manage account details, primary and alternate contacts (Billing, Operations, Security), AWS Region opt-in availability, and account closure.
- [AWS Certificate Manager (ACM)](ACM.md): Provision, request, and manage SSL/TLS certificates, validate domain ownership via DNS (Route 53 CNAME) or email, import third-party X.509 certificates and private keys, inspect certificate PEM bodies, and toggle Certificate Transparency logging.
- [AWS CloudHSM](CloudHSM.md): Dedicated hardware security module (HSM) cluster management inside Amazon VPC, multi-AZ HSM provisioning, cluster CSR export, cluster initialization workflow, automated backup retention, and teardown safety controls.
- [AWS Directory Service](Directory%20Service.md): Set up and manage Microsoft Active Directory, Simple AD, and AD Connector in the cloud, configure Access URL aliases, enable Single Sign-On (SSO), take point-in-time snapshots, reset domain admin credentials, and inspect trust relationships.
- [AWS Key Management Service (KMS)](KMS.md): Create and manage customer keys, inspect AWS managed keys, configure key policies, toggle annual rotation, and test live encryption/decryption in the playground.
- [AWS Private Certificate Authority (Private CA)](Private%20CA.md): Create and manage private root and subordinate certificate authorities, generate and export CSRs, install CA certificates, issue and revoke private X.509 certificates with standard templates, configure S3 CRL revocation, and manage soft-deletion retention windows.
- [AWS Secrets Manager](Secrets%20Manager.md): Store, retrieve, update, and manage sensitive credentials and API keys with KMS encryption at rest, version staging labels (AWSCURRENT, AWSPREVIOUS), resource permissions, and scheduled recovery windows.
- [AWS Systems Manager Parameter Store](SSM%20Parameter%20Store.md): Secure, hierarchical storage for configuration data management and secrets management with KMS encryption (SecureString), version history tracking, version staging labels, and resource tagging.
- [Amazon S3 (Simple Storage Service)](S3.md): Scalable cloud object storage, buckets and prefixes navigation, versioning, default encryption with KMS, granular Block Public Access controls, bucket policies, static website hosting, and lifecycle management.
- [Resource Groups Tagging API](Resource%20Groups%20Tagging%20API.md): Find tagged resources across services and Regions, bulk add/edit/remove tags via Tag Editor, and create tag-based Resource Groups.
- [Service Quotas](Service%20Quotas.md): View and manage service limits, request quota increases, configure organization quota request templates, and track change request history.

---

*For project setup, architecture, and contribution instructions, please refer to the main [README.md](../README.md).*
