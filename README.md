# AWS Emulator UI

An unofficial, open-source **web UI** and interactive **dashboard** for the official **AWS Emulator**, bringing an intuitive management console to your **local AWS** development environment.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![AWS SDK v3](https://img.shields.io/badge/AWS%20SDK-v3-orange?logo=amazon-aws)](https://aws.amazon.com/sdk-for-javascript/)

> **Disclaimer:** **AWS Emulator UI is an independent, unofficial community project.** It is not affiliated with, maintained by, or endorsed by Amazon Web Services (AWS) or Amazon.com, Inc. The official headless emulator is hosted at [aws/aws-emulator](https://github.com/aws/aws-emulator).

---

## Why This Exists

The official [AWS Emulator](https://github.com/aws/aws-emulator) provides a fast, lightweight local AWS API engine for developing and testing cloud services locally without incurrence of cloud bills or network latency.

However, the AWS Emulator is strictly headless — it only exposes an HTTPS endpoint (`https://127.0.0.1:9297`) accessible through the AWS CLI or SDKs. **AWS Emulator UI fills this gap by delivering a local AWS UI and AWS emulator dashboard** that replicates the look and feel of the official AWS Management Console. With this web interface, developers can visually explore buckets, poll queues, browse DynamoDB records, and configure IAM policies entirely on their local machine.

---

## Features

This web UI connects directly to your local emulator over HTTPS and provides dedicated management screens for supported services:

- **Amazon S3**:
  - Create and delete buckets.
  - Navigate object key hierarchies (folder prefixes).
  - Multi-file drag-and-drop uploads directly into buckets or prefixes.
  - One-click object downloads and file deletions.
  - Path-style addressing configured automatically for local emulator compatibility.

- **Amazon SQS**:
  - Create Standard and FIFO (`.fifo`) queues with configurable delivery delays.
  - Inspect queue depths (messages available, delayed, and in-flight).
  - Send messages with custom message bodies and delay parameters.
  - Live message poller with automatic receipt handle retrieval and one-click message deletion.
  - Full queue purge capabilities.

- **Amazon DynamoDB**:
  - Create tables with typed partition keys (`S`, `N`, `B`), optional sort keys, and flexible billing modes.
  - Dynamic item explorer: automatically discovers and renders columns based on item attributes.
  - Dual-mode item editor: build items visually via structured form fields or edit raw DynamoDB JSON documents directly.
  - Attribute scan filters and individual item deletion.
  - Table deletion and metadata inspection.

- **AWS Identity & Access Management (IAM)**:
  - Central IAM dashboard displaying key metrics and the fixed emulator account ID (`000000000000`).
  - Manage IAM Users: create users, attach/detach policies, view attached permissions, and safe deletion.
  - Manage IAM Roles: create roles with trust policies (Lambda, EC2, ECS, or custom JSON) and inspect `AssumeRolePolicyDocument`.
  - Policy Inspector: browse customer and AWS-managed policies, review structured Statement breakdowns (`Effect`, `Action`, `Resource`), and inspect syntax-highlighted JSON policy documents.

- **AWS Resource Access Manager (RAM)**:
  - Share AWS resources (VPC Subnets, KMS Keys) across accounts and within your AWS Organization.
  - Multi-step Create resource share wizard with live resource selection from real EC2 and KMS services.
  - Manage associations for resources, principals, permissions, and tags.

- **AWS Service Quotas**:
  - View and manage resource limits across 200+ AWS services from a central console.
  - Compare account applied values against AWS default baselines and filter adjustable quotas.
  - Submit account-level quota increase requests and track request lifecycle in Quota Request History.
  - Configure organization-wide Quota Request Templates to automatically apply increases to new accounts.
  - CloudWatch usage metric dimension inspection and quota tagging.

- **AWS CloudShell Terminal (`>_`)**:
  - Interactive terminal drawer embedded directly in the top navigation bar.
  - Executes real AWS CLI commands directly against the local emulator container (`aws s3 ls`, `aws dynamodb list-tables`, `aws sqs list-queues`, `aws iam list-users`, etc.).
  - Command history navigation (`↑` / `↓`), execution duration timer, and maximize/restore drawer controls.
  - Works with native AWS CLI installed on the host system, with an AWS SDK v3 fallback runner.

- **Active Identity & Role Switcher (Local IAM Policy Enforcement)**:
  - Switch active identity between Administrator (`000000000000`), custom IAM Users, and Assumed Roles from the account menu.
  - Built-in local IAM policy evaluation engine (`src/lib/permissions.ts`) that enforces least-privilege policies locally, evaluating `Effect`, `Action` (e.g. `s3:*`, `dynamodb:PutItem`), and `Resource` (`arn:aws:s3:::*`).
  - Simulates authentic `AccessDeniedException` error banners when unauthorized actions are attempted under restricted user or role identities.

- **Interactive Top Navigation & Global Search**:
  - Global Search Command Palette (`Alt + S`) indexing all 211 services with instant keyboard filtering.
  - Active Region selector (`us-east-1`, `us-east-2`, `us-west-1`, `us-west-2`).
  - Notifications drawer displaying real-time emulator connection and credential health.
  - Settings drawer with endpoint status indicators and cache management.

- **All Services Catalog (200+ AWS Services)**:
  - Comprehensive catalog of 200+ AWS services categorized across Compute, Storage, Database, Networking, Security, Management, Analytics, Machine Learning, Developer Tools, IoT, Business Applications, and more.
  - Instant live filter and search with category counts and quick jump links.
  - Universal dynamic service routing (`/[service]`): any service in the catalog opens in an authentic Cloudscape console layout with documentation links.

- **AWS Management Console Home & Interactive Widgets**:
  - **Cost and Usage & AWS Budgets**: Month-to-date spending, end-of-month forecasted spend, 6-month stacked bar chart, interactive service and usage type filtering, and real-time AWS Budgets tracking with customizable alert thresholds.
  - **Security Hub Posture**: Live compliance posture score, failed controls auditing against local emulator resources (IAM, S3, SQS), interactive findings remediation, and findings suppression.
  - **AWS Health Dashboard**: Live connection latency diagnostics for local emulator services (S3, DynamoDB, SQS, IAM, STS), scheduled maintenance tracking, and operational advisories.
  - **Recently Visited Services**: 2-column launcher with authentic vector icons, automatic activity tracking, and history management.
  - **Console Layout Customization**: Add, remove, and reset console home widgets with persistent local state.

- **Cross-Platform Dev Runner (`scripts/dev.js`)**:
  - Automatically locates the emulator TLS certificate (`ca.pem`) on Windows (`%USERPROFILE%`), macOS, or Linux/WSL.
  - Injects `NODE_EXTRA_CA_CERTS` and credentials so the UI communicates with the emulator securely without disabling TLS checks.

---

### Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Alt + S` | Open global service search palette |
| `Esc` | Close open modals, search palette, or CloudShell drawer |
| `↑` / `↓` | Navigate command history in CloudShell terminal |

---

## Screenshots

### AWS Management Console Dashboard
![AWS Emulator UI Console Home Dashboard featuring Cost & Usage, AWS Budgets, Security Hub, AWS Health, and Recently Visited widgets](docs/images/console-home.png)

---

## Prerequisites

Before running the UI, ensure you have the following installed:
1. **Docker Desktop** (Windows / macOS) or **Docker Engine** (Linux / WSL).
2. **Node.js** (v20.x or higher) and **npm**.

---

## Quickstart Guide

### 1. Start the AWS Emulator

The official emulator runs inside Docker and listens on port `9297`.

#### On Windows (PowerShell):
```powershell
# 1. Create directory for certificates & credentials
New-Item -ItemType Directory -Force "$env:USERPROFILE\.aws\emulator"

# 2. Build the emulator container
docker build -t aws-emulator -f Dockerfile.emulator .

# 3. Start the container
$port = 9297
docker run -d --rm --memory=2g --memory-swap=2g `
  -p "127.0.0.1:${port}:${port}" `
  -v "$env:USERPROFILE\.aws\emulator:/home/emulator/.aws/emulator" `
  aws-emulator -p $port --telemetry off
```

#### On Linux / macOS / WSL:
```bash
# 1. Start using the bundled helper script
chmod +x ./scripts/emulator.sh
./scripts/emulator.sh start
```
*(Alternatively, run manually via standard `docker run` as detailed in `scripts/emulator.sh`)*.

---

### 2. Start the AWS Emulator UI

Clone this repository and launch the Next.js development server:

```bash
# Clone the repository
git clone https://github.com/Shubham-Bhayaje/aws-emulator-ui.git
cd aws-emulator-ui

# Install dependencies
npm install

# Start the dashboard
npm run dev
```

Open your browser and navigate to:
**[http://127.0.0.1:3000](http://127.0.0.1:3000)**

The launcher script will automatically detect the emulator's generated `ca.pem` certificate and configure Node.js environment variables.

---

## Configuration & Architecture

The application communicates with the local emulator exclusively on `127.0.0.1:9297`.

### Environment Variables

When running `npm run dev`, [`scripts/dev.js`](scripts/dev.js) automatically sets:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_EXTRA_CA_CERTS` | `~/.aws/emulator/9297/ca.pem` | Injects the emulator's self-signed root CA certificate into Node.js. |
| `AWS_SHARED_CREDENTIALS_FILE` | `~/.aws/emulator/9297/emulator_credentials` | Path to emulator access keys (`000000000000` account). |
| `AWS_CONFIG_FILE` | `~/.aws/emulator/9297/config` | Path to emulator configuration (`us-east-1` region). |
| `AWS_EC2_METADATA_DISABLED` | `true` | Prevents SDK calls from querying instance metadata. |
| `EMULATOR_PORT` | `9297` | Optional override if running the emulator on a custom port. |

---

## Service Status

| Service | Category | Status | Documentation | Date Added |
| :--- | :--- | :--- | :--- | :--- |
| Amazon S3 | Storage | Built | [S3 Console](docs/README.md) | Initial |
| Amazon SQS | Application Integration | Built | [SQS Console](docs/README.md) | Initial |
| Amazon DynamoDB | Database | Built | [DynamoDB Console](docs/README.md) | Initial |
| AWS IAM | Security, Identity, & Compliance | Built | [IAM Console](docs/README.md) | Initial |
| AWS Resource Access Manager (RAM) | Security, Identity, & Compliance | Built | [RAM Console](docs/README.md) | 2026-11-20 |
| AWS Service Quotas | Management & Governance | Built | [Service Quotas Guide](docs/Service%20Quotas.md) | 2026-11-20 |

---

## Service Quotas Action Support

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

---

## Changelog

- **2026-11-20** - **AWS Service Quotas**: Full implementation of AWS Service Quotas with services catalog exploration, applied vs default quota comparison, account-level quota increase request modal, quota request history tracking, organization quota request template management, CloudWatch usage metric configurations, and resource tagging.
- **2026-11-20** - **AWS Resource Access Manager (RAM)**: Full implementation of RAM with resource shares, shared resources, principals, permissions library, and 4-step resource share creation wizard.

---

---

## Contributing

Contributions from the community are warmly welcomed! Whether you want to add screens for additional services, optimize performance, or report an issue, please read our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## License

This project is licensed under the [MIT License](LICENSE).
