# AWS Emulator UI

An open-source web UI and interactive dashboard for the official **AWS Emulator**, bringing an authentic AWS Management Console experience to your local development environment.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![AWS SDK v3](https://img.shields.io/badge/AWS%20SDK-v3-orange?logo=amazon-aws)](https://aws.amazon.com/sdk-for-javascript/)

> **Disclaimer:** **AWS Emulator UI is an independent, unofficial community project.** It is not affiliated with, maintained by, or endorsed by Amazon Web Services (AWS) or Amazon.com, Inc. The official headless emulator is hosted at [aws/aws-emulator](https://github.com/aws/aws-emulator).

---

## Overview

The official [AWS Emulator](https://github.com/aws/aws-emulator) provides a fast, lightweight local AWS API engine for development and testing. However, it is strictly headless (`https://127.0.0.1:9297`).

**AWS Emulator UI** bridges this gap by delivering a local management console that replicates the look, feel, and workflows of the real AWS Management Console. Developers and learners can visually manage buckets, inspect DynamoDB items, poll SQS queues, manage IAM policies, request SSL/TLS certificates, and configure KMS encryption keys entirely on localhost without cloud bills or internet dependencies.

![AWS Emulator UI Console Home Dashboard](docs/images/console-home.png)

---

## Quickstart

### 1. Prerequisites
- **Docker Desktop** (Windows / macOS) or **Docker Engine** (Linux / WSL)
- **Node.js** (v20+ recommended) and **npm**

### 2. Start the AWS Emulator
Run the official emulator on port `9297`:

```bash
# Using the bundled script (Linux / macOS / WSL)
./scripts/emulator.sh start

# Or via Docker on Windows PowerShell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.aws\emulator"
docker run -d --rm -p 127.0.0.1:9297:9297 -v "$env:USERPROFILE\.aws\emulator:/home/emulator/.aws/emulator" aws-emulator -p 9297 --telemetry off
```

### 3. Launch the Console UI
```bash
git clone https://github.com/Shubham-Bhayaje/aws-emulator-ui.git
cd aws-emulator-ui
npm install
npm run dev
```

Open your browser to: **[http://localhost:3000](http://localhost:3000)**

---

## Supported Services

| Service | Category | Status | Guide | Date Added |
| :--- | :--- | :--- | :--- | :--- |
| **AWS Account Management** | Management & Governance | Built | [Account Management Guide](docs/Account%20Management.md) | 2026-11-20 |
| **AWS Certificate Manager (ACM)** | Security, Identity, & Compliance | Built | [ACM Guide](docs/ACM.md) | 2026-11-21 |
| **AWS CloudHSM** | Security, Identity, & Compliance | Built | [CloudHSM Guide](docs/CloudHSM.md) | 2026-11-21 |
| **AWS Directory Service** | Security, Identity, & Compliance | Built | [Directory Service Guide](docs/Directory%20Service.md) | 2026-11-21 |
| **AWS Key Management Service (KMS)** | Security, Identity, & Compliance | Built | [KMS Guide](docs/KMS.md) | 2026-11-21 |
| **AWS Private Certificate Authority (Private CA)** | Security, Identity, & Compliance | Built | [Private CA Guide](docs/Private%20CA.md) | 2026-11-21 |
| **AWS Secrets Manager** | Security, Identity, & Compliance | Built | [Secrets Manager Guide](docs/Secrets%20Manager.md) | 2026-11-21 |
| **AWS Systems Manager Parameter Store** | Management & Governance | Built | [Parameter Store Guide](docs/SSM%20Parameter%20Store.md) | 2026-11-21 |
| **Amazon S3** | Storage | Built | [S3 Guide](docs/S3.md) | 2026-11-21 |
| **Amazon SQS** | Application Integration | Built | [Console](docs/README.md) | Initial |
| **Amazon DynamoDB** | Database | Built | [Console](docs/README.md) | Initial |
| **AWS IAM** | Security, Identity, & Compliance | Built | [Console](docs/README.md) | Initial |
| **AWS Resource Access Manager (RAM)** | Security, Identity, & Compliance | Built | [Console](docs/README.md) | 2026-11-20 |
| **AWS Resource Groups & Tag Editor** | Management & Governance | Built | [Resource Groups Guide](docs/Resource%20Groups%20Tagging%20API.md) | 2026-11-20 |
| **AWS Service Quotas** | Management & Governance | Built | [Service Quotas Guide](docs/Service%20Quotas.md) | 2026-11-20 |

---

## Key Features

- **Core Storage & Database**:
  - **Amazon S3**: Scalable cloud object storage, global bucket inventory, multi-level folder prefix navigation, multi-file drag-and-drop uploader, versioning lifecycle, default encryption with AWS KMS key integration, granular Block Public Access settings, bucket policy editor, static website hosting, and lifecycle transition rules.
  - **Amazon DynamoDB**: Table creation, dynamic attribute discovery, visual and raw JSON item editor, scan filters.
  - **Amazon SQS**: Standard and FIFO queues, queue depths, live message poller with receipt-handle deletion, queue purge.

- **Security, Identity, & Compliance**:
  - **AWS IAM**: Users, roles with trust policies, policy inspector with syntax-highlighted JSON documents.
  - **AWS KMS**: Customer & AWS managed keys, 5-step key creation wizard, key rotation, JSON policy editor, live cryptographic playground (Encrypt, Decrypt, GenerateDataKey).
  - **AWS Certificate Manager (ACM)**: Public/private certificate requests, 2-step wizard, DNS (Route 53 CNAME) validation, email validation, PEM certificate import, raw body viewer, tags.
  - **AWS CloudHSM**: Dedicated hardware security module clusters inside Amazon VPC, FIPS 140-2 Level 3 validation mode, multi-AZ HSM provisioning, cluster CSR export, initialization workflows, automated backup retention, and cluster safety teardown.
  - **AWS Directory Service**: Set up and manage Simple AD, AWS Managed Microsoft AD, and AD Connector directories in Amazon VPC, multi-AZ domain controller placement, Access URL alias configuration (`<alias>.awsapps.com`), Single Sign-On (SSO) toggle, manual and automated snapshot backups, administrative password reset (`Administrator`), resource tags, and trust relationship monitoring.
  - **AWS Private Certificate Authority (Private CA)**: Root and Subordinate CA creation wizard, CSR export, automated self-signed root activation or external cert import, private certificate issuance with X.509 templates, serial-based certificate revocation, S3 CRL distribution configuration, IAM resource-based policy editor, and 7-30 day soft-deletion retention with one-click restore.
  - **AWS Secrets Manager**: Store database/application credentials, 4-step wizard, key/value and plaintext editors, AWS KMS envelope encryption, version staging labels (AWSCURRENT, AWSPREVIOUS), resource policies, and scheduled 7-30 day recovery deletion.
  - **AWS RAM**: Resource shares, resource associations, cross-account sharing workflows.

- **Management & Governance**:
  - **AWS Systems Manager Parameter Store**: Secure, hierarchical storage for configuration data and secrets, multi-tier support (Standard vs Advanced), String/StringList/SecureString data types, KMS encryption with live reveal/decrypt controls, full version history with staging labels, tags management, and bulk deletion.
  - **AWS Account Management**: Display name, primary/alternate contacts, 32-region opt-in manager, account closure checklist.
  - **AWS Resource Groups & Tag Editor**: Global multi-service resource discovery, bulk tagging/untagging with diff review, tag autocompletion, query-based resource groups.
  - **AWS Service Quotas**: 200+ services catalog, default vs applied comparison, quota increase requests, org templates.

- **Platform Tools & User Experience**:
  - **AWS CloudShell Terminal (`>_`)**: Built-in CLI drawer running real commands directly against the emulator.
  - **Active Identity Switcher**: Switch between Administrator, IAM users, and Assumed Roles with local policy evaluation.
  - **Global Service Search (`Alt + S`)**: Command palette indexing 200+ AWS services with instant jump navigation.
  - **Console Home Widgets**: Cost & Usage bar chart, Budgets, Security Hub posture, Health dashboard latency checks.

---

## Action Support Matrix

<details>
<summary><strong>Click to expand full API operations verification details</strong></summary>

### Amazon S3
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `ListBuckets` | `aws s3api list-buckets` | Supported | Buckets inventory table on `/s3` with search and filters |
| `CreateBucket` | `aws s3api create-bucket` | Supported | Create bucket wizard on `/s3/create` |
| `HeadBucket` | `aws s3api head-bucket` | Supported | Bucket metadata and existence verification |
| `GetBucketLocation` | `aws s3api get-bucket-location` | Supported | AWS Region display on bucket details |
| `DeleteBucket` | `aws s3api delete-bucket` | Supported | Delete bucket modal requiring bucket name confirmation |
| `PutBucketVersioning` | `aws s3api put-bucket-versioning` | Supported | Bucket versioning edit modal on Properties tab |
| `GetBucketVersioning` | `aws s3api get-bucket-versioning` | Supported | Versioning status card on Properties tab |
| `PutBucketTagging` | `aws s3api put-bucket-tagging` | Supported | Manage tags modal on Properties tab |
| `GetBucketTagging` | `aws s3api get-bucket-tagging` | Supported | Bucket tags table on Properties tab |
| `DeleteBucketTagging` | `aws s3api delete-bucket-tagging` | Supported | Remove all tags action on Properties tab |
| `PutBucketEncryption` | `aws s3api put-bucket-encryption` | Supported | Edit default encryption modal (SSE-S3 & SSE-KMS) |
| `GetBucketEncryption` | `aws s3api get-bucket-encryption` | Supported | Default encryption card on Properties tab |
| `DeleteBucketEncryption` | `aws s3api delete-bucket-encryption` | Supported | Reset encryption to default SSE-S3 |
| `PutPublicAccessBlock` | `aws s3api put-public-access-block` | Supported | Edit block public access modal (bucket & account) |
| `GetPublicAccessBlock` | `aws s3api get-public-access-block` | Supported | Permissions tab block public access table |
| `DeletePublicAccessBlock` | `aws s3api delete-public-access-block` | Supported | Reset block public access action |
| `PutBucketPolicy` | `aws s3api put-bucket-policy` | Supported | Bucket policy JSON editor modal |
| `GetBucketPolicy` | `aws s3api get-bucket-policy` | Supported | Policy viewer card on Permissions tab |
| `DeleteBucketPolicy` | `aws s3api delete-bucket-policy` | Supported | Delete policy confirmation modal |
| `PutBucketCors` | `aws s3api put-bucket-cors` | Supported | CORS JSON editor modal on Permissions tab |
| `GetBucketCors` | `aws s3api get-bucket-cors` | Supported | CORS configuration viewer card |
| `DeleteBucketCors` | `aws s3api delete-bucket-cors` | Supported | Delete CORS confirmation dialog |
| `PutBucketLifecycleConfiguration` | `aws s3api put-bucket-lifecycle-configuration` | Supported | Create & edit lifecycle rule modals on Management tab |
| `GetBucketLifecycleConfiguration` | `aws s3api get-bucket-lifecycle-configuration` | Supported | Lifecycle rules table on Management tab |
| `DeleteBucketLifecycle` | `aws s3api delete-bucket-lifecycle` | Supported | Delete lifecycle rule action |
| `PutBucketWebsite` | `aws s3api put-bucket-website` | Supported | Static website hosting configuration modal |
| `GetBucketWebsite` | `aws s3api get-bucket-website` | Supported | Static website hosting card on Properties tab |
| `DeleteBucketWebsite` | `aws s3api delete-bucket-website` | Supported | Disable static website hosting action |
| `PutBucketLogging` | `aws s3api put-bucket-logging` | Supported | Server access logging configuration modal |
| `GetBucketLogging` | `aws s3api get-bucket-logging` | Supported | Access logging card on Properties tab |
| `PutBucketReplication` | `aws s3api put-bucket-replication` | Supported | Replication rule configuration modal on Management tab |
| `GetBucketReplication` | `aws s3api get-bucket-replication` | Supported | Replication rules table on Management tab |
| `DeleteBucketReplication` | `aws s3api delete-bucket-replication` | Supported | Delete replication rule action |
| `PutObject` | `aws s3api put-object` | Supported | Multi-file drag-and-drop uploader & create folder |
| `GetObject` | `aws s3api get-object` | Supported | Download file action & Open file |
| `HeadObject` | `aws s3api head-object` | Supported | Object properties & metadata viewer on object details |
| `ListObjectsV2` | `aws s3api list-objects-v2` | Supported | Object browser table with prefix navigation |
| `ListObjectVersions` | `aws s3api list-object-versions` | Supported | Show versions toggle table on Objects tab |
| `CopyObject` | `aws s3api copy-object` | Supported | Copy object action modal |
| `PutObjectTagging` | `aws s3api put-object-tagging` | Supported | Object tags editor modal |
| `GetObjectTagging` | `aws s3api get-object-tagging` | Supported | Object tags table on Object detail view |
| `DeleteObjectTagging` | `aws s3api delete-object-tagging` | Supported | Remove object tags action |
| `DeleteObject` | `aws s3api delete-object` | Supported | Delete object modal with version deletion |
| `DeleteObjects` | `aws s3api delete-objects` | Supported | Bulk delete selected objects modal |
| `PutObjectLockConfiguration` | `aws s3api put-object-lock-configuration` | Supported | Object lock configuration during bucket creation |
| `PutObjectLegalHold` | `aws s3api put-object-legal-hold` | Supported | Object legal hold toggle modal (when lock enabled) |
| `PutObjectRetention` | `aws s3api put-object-retention` | Supported | Object retention period modal (when lock enabled) |
| `RestoreObject` | `aws s3api restore-object` | Partial | Requires Glacier storage class; notice shown |
| `S3Control (Access Points / Account PAB)` | `aws s3control` | Endpoint Not Supported | Virtual-host routing on local IP unsupported; local simulated store used |

### AWS Systems Manager Parameter Store
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `DescribeParameters` | `aws ssm describe-parameters` | Supported | Parameters inventory table on `/systems-manager/parameter-store` |
| `GetParameter` | `aws ssm get-parameter` | Supported | Parameter overview metadata & value viewer on details page |
| `GetParameter` (`--with-decryption`) | `aws ssm get-parameter --with-decryption` | Supported | Show/hide decrypted value toggle on SecureString parameters |
| `PutParameter` (New) | `aws ssm put-parameter` | Supported | Create parameter form on `/systems-manager/parameter-store/create` |
| `PutParameter` (`--overwrite`) | `aws ssm put-parameter --overwrite` | Supported | Edit parameter form creating incremented versions |
| `GetParameterHistory` | `aws ssm get-parameter-history` | Supported | Version history table on History tab |
| `LabelParameterVersion` | `aws ssm label-parameter-version` | Supported | Manage labels modal on History tab |
| `DeleteParameter` | `aws ssm delete-parameter` | Supported | Delete confirmation modal on details page and table |
| `DeleteParameters` | `aws ssm delete-parameters` | Supported | Bulk delete modal on parameters inventory table |
| `ListTagsForResource` | `aws ssm list-tags-for-resource` | Supported | Tags tab table on parameter details |
| `AddTagsToResource` | `aws ssm add-tags-to-resource` | Supported | Manage tags modal (add new tags) |
| `RemoveTagsFromResource` | `aws ssm remove-tags-from-resource` | Supported | Manage tags modal (remove tags) |
| `GetParametersByPath` | `aws ssm get-parameters-by-path` | Supported | Supported by emulator engine |
| `PutParameter` (Policies) | `aws ssm put-parameter --policies` | Not Supported | Advanced tier expiration policies not triggered by emulator engine |

### AWS Secrets Manager
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `ListSecrets` | `aws secretsmanager list-secrets` | Supported | Full table on `/secretsmanager` with status metrics and deleted filter |
| `DescribeSecret` | `aws secretsmanager describe-secret` | Supported | Overview cards and timestamps on `/secretsmanager/[secretName]` |
| `CreateSecret` | `aws secretsmanager create-secret` | Supported | 4-step Store Secret Wizard on `/secretsmanager/new` |
| `GetSecretValue` | `aws secretsmanager get-secret-value` | Supported | Decrypt/retrieve secret value button with key/value and plaintext tabs |
| `PutSecretValue` | `aws secretsmanager put-secret-value` | Supported | Edit secret value modal creating new versions |
| `UpdateSecret` | `aws secretsmanager update-secret` | Supported | Edit description and encryption key modal |
| `TagResource` | `aws secretsmanager tag-resource` | Supported | Manage tags modal (add new tags) |
| `UntagResource` | `aws secretsmanager untag-resource` | Supported | Manage tags modal (remove tags) |
| `GetResourcePolicy` | `aws secretsmanager get-resource-policy` | Supported | Resource permissions viewer tab |
| `PutResourcePolicy` | `aws secretsmanager put-resource-policy` | Supported | Edit permissions modal with JSON policy editor |
| `DeleteResourcePolicy` | `aws secretsmanager delete-resource-policy` | Supported | Delete permissions action |
| `ListSecretVersionIds` | `aws secretsmanager list-secret-version-ids` | Supported | Version history table with staging labels (AWSCURRENT, AWSPREVIOUS) |
| `DeleteSecret` (Scheduled) | `aws secretsmanager delete-secret --recovery-window-in-days` | Supported | Schedule deletion modal with 7-30 day window |
| `DeleteSecret` (Force) | `aws secretsmanager delete-secret --force-delete-without-recovery` | Supported | Immediate permanent deletion workflow |
| `RestoreSecret` | `aws secretsmanager restore-secret` | Supported | Restore secret modal |
| `RotateSecret` | `aws secretsmanager rotate-secret` | Partial | Config-dependent; requires Lambda rotation function |
| `ReplicateSecretToRegions` | `aws secretsmanager replicate-secret-to-regions` | Not Supported | Single-region local emulator; notice displayed |

### AWS Certificate Manager (ACM)
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `ListCertificates` | `aws acm list-certificates` | Supported | Certificates table on `/acm` with status & type filters |
| `DescribeCertificate` | `aws acm describe-certificate` | Supported | Overview cards & domains table on `/acm/certificates/[certificateId]` |
| `RequestCertificate` | `aws acm request-certificate` | Supported | 2-step Request Certificate Wizard on `/acm/request` |
| `ImportCertificate` | `aws acm import-certificate` | Supported | Certificate import form (body, key, chain) on `/acm/import` |
| `DeleteCertificate` | `aws acm delete-certificate` | Supported | Delete confirmation modals on `/acm` and details page |
| `GetCertificate` | `aws acm get-certificate` | Supported | Raw PEM certificate & chain viewer on details page |
| `ListTagsForCertificate` | `aws acm list-tags-for-certificate` | Supported | Tags tab table on certificate details |
| `AddTagsToCertificate` | `aws acm add-tags-to-certificate` | Supported | Manage tags modal (add new tags) |
| `RemoveTagsFromCertificate` | `aws acm remove-tags-from-certificate` | Supported | Manage tags modal (remove tags) |
| `UpdateCertificateOptions` | `aws acm update-certificate-options` | Supported | Certificate Transparency logging toggle modal |
| `ResendValidationEmail` | `aws acm resend-validation-email` | Supported | Email validation resend action button |
| `ListHostedZones` (Route 53) | `aws route53 list-hosted-zones` | Supported | Live hosted zone dropdown for DNS validation |
| `ChangeResourceRecordSets` (Route 53) | `aws route53 change-resource-record-sets` | Supported | Automatic CNAME record creation modal |
| `ListCertificateAuthorities` (Private CA) | `aws acm-pca list-certificate-authorities` | Supported | AWS Private CA overview screen on `/acm/pca` |

### AWS Private Certificate Authority (Private CA)
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `ListCertificateAuthorities` | `aws acm-pca list-certificate-authorities` | Supported | Private CAs table on `/acm/pca` with status & type filters |
| `DescribeCertificateAuthority` | `aws acm-pca describe-certificate-authority` | Supported | Overview cards and configuration on `/acm/pca/[caArn]` |
| `CreateCertificateAuthority` | `aws acm-pca create-certificate-authority` | Supported | 6-step Create Private CA Wizard on `/acm/pca/create` |
| `GetCertificateAuthorityCsr` | `aws acm-pca get-certificate-authority-csr` | Supported | CSR viewer tab with clipboard copy on CA details page |
| `GetCertificateAuthorityCertificate` | `aws acm-pca get-certificate-authority-certificate` | Supported | CA Certificate & chain PEM viewer tab on details page |
| `ImportCertificateAuthorityCertificate` | `aws acm-pca import-certificate-authority-certificate` | Supported | Install CA Certificate modal (Self-signed Root or External) |
| `IssueCertificate` | `aws acm-pca issue-certificate` | Supported | Direct issuance form on Issue Certificate tab with templates |
| `GetCertificate` | `aws acm-pca get-certificate` | Supported | Issued certificate & chain viewer on Issue Certificate tab |
| `RevokeCertificate` | `aws acm-pca revoke-certificate` | Supported | Serial-based certificate revocation form with reason codes |
| `UpdateCertificateAuthority` | `aws acm-pca update-certificate-authority` | Supported | Enable and Disable status toggle modals |
| `DeleteCertificateAuthority` | `aws acm-pca delete-certificate-authority` | Supported | Soft delete modal with 7-30 day retention period slider |
| `RestoreCertificateAuthority` | `aws acm-pca restore-certificate-authority` | Supported | Restore deleted CA modal restoring to Disabled status |
| `GetPolicy` | `aws acm-pca get-policy` | Supported | Permissions & Policy tab on CA details page |
| `PutPolicy` | `aws acm-pca put-policy` | Supported | Resource-based JSON policy editor modal |
| `DeletePolicy` | `aws acm-pca delete-policy` | Supported | Delete resource policy action |
| `ListTags` | `aws acm-pca list-tags` | Supported | Tags tab table on CA details page |
| `TagCertificateAuthority` | `aws acm-pca tag-certificate-authority` | Supported | Manage tags modal (add new tags) |
| `UntagCertificateAuthority` | `aws acm-pca untag-certificate-authority` | Supported | Manage tags modal (remove tags) |
| `CreatePermission` | `aws acm-pca create-permission` | Not Supported | AWS RAM cross-account sharing; notice displayed in console |

### AWS CloudHSM
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `DescribeClusters` | `aws cloudhsmv2 describe-clusters` | Supported | Clusters inventory table on `/cloudhsm` with status & mode filters |
| `DescribeCluster` | `aws cloudhsmv2 describe-clusters --filters clusterIds=...` | Supported | Cluster details view on `/cloudhsm/clusters/[clusterId]` |
| `CreateCluster` | `aws cloudhsmv2 create-cluster` | Supported | 4-step Create Cluster Wizard on `/cloudhsm/create` |
| `CreateHsm` | `aws cloudhsmv2 create-hsm` | Supported | Add HSM modal with live AZ subnet mapping |
| `DeleteHsm` | `aws cloudhsmv2 delete-hsm` | Supported | Delete HSM action modal on HSMs tab |
| `DeleteCluster` | `aws cloudhsmv2 delete-cluster` | Supported | Delete cluster confirmation modal with prerequisite checks |
| `InitializeCluster` | `aws cloudhsmv2 initialize-cluster` | Not Supported | Kept visible with CSR copy and emulator notice |
| `ModifyCluster` | `aws cloudhsmv2 modify-cluster` | Not Supported | Notice displayed in console |
| `DescribeBackups` | `aws cloudhsmv2 describe-backups` | Not Supported | Backups inventory on `/cloudhsm/backups` with notice |
| `ListTags` | `aws cloudhsmv2 list-tags` | Not Supported | Tags tab with emulator notice |
| `TagResource` | `aws cloudhsmv2 tag-resource` | Not Supported | Notice displayed in console |
| `UntagResource` | `aws cloudhsmv2 untag-resource` | Not Supported | Notice displayed in console |

### AWS Directory Service
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `DescribeDirectories` | `aws ds describe-directories` | Supported | Directories inventory table on `/directoryservice` with search & filters |
| `CreateDirectory` | `aws ds create-directory` | Supported | 5-step Setup Directory Wizard (Simple AD) |
| `CreateMicrosoftAD` | `aws ds create-microsoft-ad` | Supported | 5-step Setup Directory Wizard (AWS Managed Microsoft AD) |
| `ConnectDirectory` | `aws ds connect-directory` | Supported | Setup Directory Wizard (AD Connector) |
| `DeleteDirectory` | `aws ds delete-directory` | Supported | Delete directory modal with confirmation requirement |
| `CreateSnapshot` | `aws ds create-snapshot` | Supported | Create snapshot modal on Snapshots tab |
| `DescribeSnapshots` | `aws ds describe-snapshots` | Supported | Snapshots table on directory details view |
| `DeleteSnapshot` | `aws ds delete-snapshot` | Supported | Delete snapshot confirmation modal |
| `RestoreFromSnapshot` | `aws ds restore-from-snapshot` | Not Supported | Kept visible with clear emulator notice |
| `CreateAlias` | `aws ds create-alias` | Supported | Create Access URL modal (`<alias>.awsapps.com`) |
| `EnableSso` | `aws ds enable-sso` | Supported | Enable Single Sign-On toggle with alias validation |
| `DisableSso` | `aws ds disable-sso` | Supported | Disable Single Sign-On confirmation modal |
| `ResetUserPassword` | `aws ds reset-user-password` | Supported | Reset administrator password modal |
| `DescribeTrusts` | `aws ds describe-trusts` | Supported | Trusts & Forwarders tab inventory table |
| `DescribeConditionalForwarders` | `aws ds describe-conditional-forwarders` | Supported | Conditional forwarders table |
| `ListTagsForResource` | `aws ds list-tags-for-resource` | Supported | Tags tab on directory details |
| `AddTagsToResource` | `aws ds add-tags-to-resource` | Supported | Manage tags modal (add new tags) |
| `RemoveTagsFromResource` | `aws ds remove-tags-from-resource` | Supported | Manage tags modal (remove tags) |

### AWS Key Management Service (KMS)
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `ListKeys` | `aws kms list-keys` | Supported | Keys inventory on `/kms` & `/kms/default-keys` |
| `ListAliases` | `aws kms list-aliases` | Supported | Alias mappings & aliases table |
| `DescribeKey` | `aws kms describe-key` | Supported | Key summary cards on `/kms/keys/[keyId]` |
| `CreateKey` | `aws kms create-key` | Supported | 5-step wizard on `/kms/keys/create` |
| `CreateAlias` | `aws kms create-alias` | Supported | Create alias modal on keys list & details |
| `DeleteAlias` | `aws kms delete-alias` | Supported | Remove alias action on key details |
| `UpdateAlias` | `aws kms update-alias` | Supported | Repoint alias target action |
| `UpdateKeyDescription` | `aws kms update-key-description` | Supported | Edit description modal on `/kms/keys/[keyId]` |
| `EnableKey` | `aws kms enable-key` | Supported | Enable key confirmation modal |
| `DisableKey` | `aws kms disable-key` | Supported | Disable key confirmation modal |
| `ScheduleKeyDeletion` | `aws kms schedule-key-deletion` | Supported | Schedule deletion modal with 7-30 day window |
| `CancelKeyDeletion` | `aws kms cancel-key-deletion` | Supported | Cancel deletion modal |
| `GetKeyPolicy` | `aws kms get-key-policy` | Supported | Key policy viewer tab |
| `PutKeyPolicy` | `aws kms put-key-policy` | Supported | Edit policy JSON modal |
| `GetKeyRotationStatus` | `aws kms get-key-rotation-status` | Supported | Key rotation tab status badge |
| `EnableKeyRotation` | `aws kms enable-key-rotation` | Supported | Enable rotation toggle |
| `DisableKeyRotation` | `aws kms disable-key-rotation` | Supported | Disable rotation toggle |
| `ListResourceTags` | `aws kms list-resource-tags` | Supported | Tags tab table on key details |
| `TagResource` | `aws kms tag-resource` | Supported | Manage tags modal |
| `UntagResource` | `aws kms untag-resource` | Supported | Manage tags modal removal |
| `Encrypt` | `aws kms encrypt` | Supported | Live encryption playground on key details |
| `Decrypt` | `aws kms decrypt` | Supported | Live decryption playground on key details |
| `GenerateDataKey` | `aws kms generate-data-key` | Supported | Live envelope encryption playground on key details |
| `DescribeCustomKeyStores` | `aws kms describe-custom-key-stores` | Supported | Custom key stores inventory on `/kms/custom-keystores` |
| `CreateCustomKeyStore` | `aws kms create-custom-key-store` | Not Supported | Hardware CloudHSM required; notice shown |

### AWS Account Management
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `GetAccountInformation` | `aws account get-account-information` | Supported | Overview card on `/account` |
| `PutAccountName` | `aws account put-account-name` | Supported | Edit account name modal on `/account` |
| `GetContactInformation` | `aws account get-contact-information` | Supported | Primary contact card on `/account` & `/account/contact` |
| `PutContactInformation` | `aws account put-contact-information` | Supported | Contact information form on `/account/contact` |
| `GetAlternateContact` | `aws account get-alternate-contact` | Supported | Alternate contacts cards on `/account` & `/account/alternate-contacts` |
| `PutAlternateContact` | `aws account put-alternate-contact` | Supported | Edit alternate contact modal |
| `DeleteAlternateContact` | `aws account delete-alternate-contact` | Supported | Remove alternate contact action |
| `ListRegions` | `aws account list-regions` | Supported | Regions table on `/account` & `/account/regions` |
| `GetRegionOptStatus` | `aws account get-region-opt-status` | Supported | Regional status badge display |
| `EnableRegion` | `aws account enable-region` | Supported | Enable region confirmation modal |
| `DisableRegion` | `aws account disable-region` | Supported | Disable region confirmation modal |
| `SendPhoneNumberVerification` | `aws account send-phone-number-verification` | Supported | Trigger OTP phone verification modal |
| `VerifyPhoneNumber` | `aws account verify-phone-number` | Supported | OTP phone verification submission |
| `GetPrimaryEmail` | `aws account get-primary-email` | Member Only | Organization member account delegation API |
| `StartPrimaryEmailUpdate` | `aws account start-primary-email-update` | Member Only | Organization member account delegation API |

### AWS Resource Groups & Tag Editor
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `GetResources` | `aws resourcegroupstaggingapi get-resources` | Supported | Multi-service resource discovery on `/resource-groups/tag-editor` |
| `GetTagKeys` | `aws resourcegroupstaggingapi get-tag-keys` | Supported | Tag key autocompletion & criteria filtering |
| `GetTagValues` | `aws resourcegroupstaggingapi get-tag-values` | Supported | Tag value autocompletion & criteria filtering |
| `TagResources` | `aws resourcegroupstaggingapi tag-resources` | Supported | Batch tag addition/updating on selected resources |
| `UntagResources` | `aws resourcegroupstaggingapi untag-resources` | Supported | Batch tag removal across selected resources |
| `ListGroups` | `aws resource-groups list-groups` | Supported | Saved groups table on `/resource-groups` |
| `CreateGroup` | `aws resource-groups create-group` | Supported | Tag-based group creation wizard on `/resource-groups/create` |
| `GetGroup` | `aws resource-groups get-group` | Supported | Group metadata overview on `/resource-groups/[groupName]` |
| `ListGroupResources` | `aws resource-groups list-group-resources` | Supported | Dynamic group resources tab on `/resource-groups/[groupName]` |
| `DeleteGroup` | `aws resource-groups delete-group` | Supported | Delete resource group confirmation dialog |
| `GetComplianceSummary` | `aws resourcegroupstaggingapi get-compliance-summary` | Not Supported | Kept visible on `/resource-groups/compliance` with emulator notice |
| `StartReportCreation` | `aws resourcegroupstaggingapi start-report-creation` | Not Supported | Kept visible on `/resource-groups/compliance` with emulator notice |
| `DescribeReportCreation` | `aws resourcegroupstaggingapi describe-report-creation` | Not Supported | Kept visible on `/resource-groups/compliance` with emulator notice |

### AWS Service Quotas
| API Operation | CLI Command | Support Status | Console Implementation |
| :--- | :--- | :--- | :--- |
| `ListServices` | `aws service-quotas list-services` | Supported | Full table on `/service-quotas` |
| `ListServiceQuotas` | `aws service-quotas list-service-quotas` | Supported | Applied quotas on `/service-quotas/services/[serviceCode]` |
| `GetServiceQuota` | `aws service-quotas get-service-quota` | Supported | Overview on `/service-quotas/services/[serviceCode]/[quotaCode]` |
| `ListAWSDefaultServiceQuotas` | `aws service-quotas list-aws-default-service-quotas` | Supported | Baseline comparison in quotas table |
| `GetAWSDefaultServiceQuota` | `aws service-quotas get-aws-default-service-quota` | Supported | Default value cards on quota details |
| `RequestServiceQuotaIncrease` | `aws service-quotas request-service-quota-increase` | Supported | Account-level increase modal |
| `GetRequestedServiceQuotaChange` | `aws service-quotas get-requested-service-quota-change` | Supported | Status tracking & case reference |
| `ListRequestedServiceQuotaChangeHistory` | `aws service-quotas list-requested-service-quota-change-history` | Supported | History table on `/service-quotas/history` |
| `ListRequestedServiceQuotaChangeHistoryByQuota` | `aws service-quotas list-requested-service-quota-change-history-by-quota` | Supported | Request history tab on quota details |
| `GetAssociationForServiceQuotaTemplate` | `aws service-quotas get-association-for-service-quota-template` | Supported | Status display on `/service-quotas/template` |
| `AssociateServiceQuotaTemplate` | `aws service-quotas associate-service-quota-template` | Supported | One-click template association toggle |
| `DisassociateServiceQuotaTemplate` | `aws service-quotas disassociate-service-quota-template` | Supported | Template disassociation toggle |
| `ListServiceQuotaIncreaseRequestsInTemplate` | `aws service-quotas list-service-quota-increase-requests-in-template` | Supported | Template table on `/service-quotas/template` |
| `PutServiceQuotaIncreaseRequestIntoTemplate` | `aws service-quotas put-service-quota-increase-request-into-template` | Supported | Add to template modal |
| `DeleteServiceQuotaIncreaseRequestFromTemplate` | `aws service-quotas delete-service-quota-increase-request-from-template` | Supported | Delete from template dialog |
| `ListTagsForResource` | `aws service-quotas list-tags-for-resource` | Supported | Tags tab table on quota details |
| `TagResource` | `aws service-quotas tag-resource` | Supported | Manage tags modal |
| `UntagResource` | `aws service-quotas untag-resource` | Supported | Tag removal action |
| `GetAutoManagementConfiguration` | `aws service-quotas get-auto-management-configuration` | Supported | Status display on `/service-quotas/settings` |

</details>

---

## Configuration & Environment Variables

When running `npm run dev`, [`scripts/dev.js`](scripts/dev.js) automatically sets:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_EXTRA_CA_CERTS` | `~/.aws/emulator/9297/ca.pem` | Injects the emulator's root CA certificate into Node.js. |
| `AWS_SHARED_CREDENTIALS_FILE` | `~/.aws/emulator/9297/emulator_credentials` | Path to emulator access credentials. |
| `AWS_CONFIG_FILE` | `~/.aws/emulator/9297/config` | Path to emulator configuration (`us-east-1`). |
| `AWS_EC2_METADATA_DISABLED` | `true` | Prevents SDK calls from querying instance metadata. |

---

## Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Alt + S` | Open global service search palette |
| `Esc` | Close open modals, search palette, or CloudShell drawer |
| `↑` / `↓` | Navigate command history in CloudShell terminal |

---

## Changelog

- **2026-11-21** - **Amazon S3**: Complete documentation, live AWS KMS customer managed key integration on create and bucket edit encryption modals, comprehensive walkthrough guide (`docs/S3.md`), 4 hands-on beginner exercises, emulator compatibility verification across all S3 operations, and Action Support Matrix audit.
- **2026-11-21** - **AWS Directory Service**: Full implementation of AWS Directory Service with directories inventory, metric cards, type and status filters, 5-step Setup Directory Wizard (AWS Managed Microsoft AD, Simple AD, and AD Connector) with real Amazon VPC and multi-AZ subnets selection, comprehensive directory details with 5 interactive tabs (Directory details, Snapshots, Application management with Access URL & Single Sign-On toggle, Trusts & Forwarders, and Tags), live snapshot creation & deletion, administrative password reset (`Administrator`), and directory safety deletion workflow.
- **2026-11-21** - **AWS CloudHSM**: Full implementation of AWS CloudHSM with clusters inventory, metric cards, state and mode filters, 4-step Create Cluster Wizard with real Amazon VPC and subnets selection, cluster details view with Overview, HSMs, Backups, and Tags tabs, live HSM instance provisioning across Availability Zones (`CreateHsm`, `DeleteHsm`), cluster CSR export, cluster deletion safety controls, and dedicated backups view.
- **2026-11-21** - **AWS Private Certificate Authority (Private CA)**: Full implementation of AWS Private CA with private CAs inventory, status metrics, type and status filters, 6-step Create Private CA Wizard (Root & Subordinate CA, Subject DN, Key & Signing Algorithms, S3 CRL revocation with live bucket dropdown, and Tags), Install CA Certificate modal with automated self-signed root certificate generation, comprehensive CA details with 6 interactive tabs (Details, CSR, CA Certificate, Issue Certificate, Permissions & Resource Policy, Tags), direct X.509 certificate issuance and serial revocation, CA status toggle (Active/Disabled), soft deletion with 7-30 days retention slider, and restore workflow.
- **2026-11-21** - **AWS Systems Manager Parameter Store**: Full implementation of AWS Systems Manager Parameter Store with hierarchical parameters inventory, metric cards, type filtering (`String`, `StringList`, `SecureString`), tier management (`Standard`, `Advanced`), Create parameter form with KMS key selection and value masking, parameter details with Overview, History, and Tags tabs, live decrypted value reveal toggle, version history tracking, version staging label assignment (`LabelParameterVersion`), resource tags manager, and single & bulk deletion workflows.
- **2026-11-21** - **AWS Secrets Manager**: Full implementation of AWS Secrets Manager with secrets inventory, metric cards, 4-step Store Secret Wizard with key/value and plaintext editors, AWS KMS envelope encryption selection, secret value decryption/reveal controls, version history with staging labels (`AWSCURRENT`, `AWSPREVIOUS`), resource policy editor, tags manager, and scheduled recovery deletion (7-30 days) and permanent force delete workflows.
- **2026-11-21** - **AWS Certificate Manager (ACM)**: Full implementation of AWS Certificate Manager with certificates inventory, metric cards, 2-step public/private certificate request wizard, certificate import interface (PEM body, private key, chain), comprehensive certificate details, Route 53 CNAME record creation integration, certificate transparency logging toggle, raw PEM viewer, tags manager, and AWS Private CA overview.
- **2026-11-21** - **AWS Key Management Service (KMS)**: Full implementation of AWS KMS with Customer Managed Keys inventory, AWS Managed Keys catalog, 5-step Create Key Wizard with real IAM principals, granular key actions (Enable, Disable, Schedule Deletion, Cancel Deletion), dynamic Key Policy JSON editor, annual key rotation toggle, resource tagging, and an interactive live cryptographic operations playground (Encrypt, Decrypt, GenerateDataKey).
- **2026-11-20** - **AWS Account Management**: Full implementation of AWS Account Management with centralized account settings, display name editing, primary contact information form, alternate contacts management (Billing, Operations, Security), AWS Regions availability manager with opt-in enable/disable controls, and account closure safety workflow.
- **2026-11-20** - **AWS Resource Groups & Tag Editor**: Full implementation of AWS Resource Groups & Tag Editor with Tag Editor global resource discovery, multi-service batch tagging and untagging, tag key/value autocompletion, CSV export, tag-based Resource Group creation wizard with live query preview, group details with dynamically matched resources, and compliance reporting interface.
- **2026-11-20** - **AWS Service Quotas**: Full implementation of AWS Service Quotas with services catalog exploration, applied vs default quota comparison, account-level quota increase request modal, quota request history tracking, organization quota request template management, CloudWatch usage metric configurations, and resource tagging.
- **2026-11-20** - **AWS Resource Access Manager (RAM)**: Full implementation of RAM with resource shares, shared resources, principals, permissions library, and 4-step resource share creation wizard.

---

## Contributing

Contributions from the community are warmly welcomed! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## License

This project is licensed under the [MIT License](LICENSE).
