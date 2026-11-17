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

- **All Services Catalog**:
  - Comprehensive index of 26+ AWS services categorized into Compute, Storage, Database, Networking, Security, Application Integration, Management, Analytics, ML, and Developer Tools.
  - Instant live filter and search.
  - Services currently under development show a consistent, cloudscape-styled status screen.

- **Cross-Platform Dev Runner (`scripts/dev.js`)**:
  - Automatically locates the emulator TLS certificate (`ca.pem`) on Windows (`%USERPROFILE%`), macOS, or Linux/WSL.
  - Injects `NODE_EXTRA_CA_CERTS` and credentials so the UI communicates with the emulator securely without disabling TLS checks.

---

## Screenshots

### AWS Management Console Dashboard
![AWS Emulator UI Console Home Dashboard showing service shortcuts, recent services, and welcome banner](docs/images/console-home.png)

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
👉 **[http://127.0.0.1:3000](http://127.0.0.1:3000)**

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

## Contributing

Contributions from the community are warmly welcomed! Whether you want to add screens for additional services, optimize performance, or report an issue, please read our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## License

This project is licensed under the [MIT License](LICENSE).
