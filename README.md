# AWS Emulator Console UI (`-aws-emulator-ui`)

A lightweight, local, pixel-perfect **AWS Management Console UI** clone designed to interact with a local **AWS Emulator** running in Docker.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **AWS SDK v3**.

![AWS Console Home Screenshot](docs/images/console-home.png)

---

## Architecture Overview

```
+-------------------------------------------------------------+
|                  Browser (Developer)                        |
|               http://127.0.0.1:3000                         |
+------------------------------+------------------------------+
                               |
                               | (React Server Actions / Pages)
                               v
+-------------------------------------------------------------+
|           Next.js 16 Console Web App (Node.js)              |
|   - Runs on 127.0.0.1:3000                                  |
|   - Uses AWS SDK v3 (S3, SQS, DynamoDB, IAM, STS)           |
|   - Trusts Emulator SSL Cert via NODE_EXTRA_CA_CERTS        |
|   - Credentials & Config loaded from ~/.aws/emulator/9297/  |
+------------------------------+------------------------------+
                               |
                               | HTTPS (Port 9297)
                               v
+-------------------------------------------------------------+
|            AWS Emulator (Docker Container)                  |
|   - Image: aws-emulator                                     |
|   - Listening on: 127.0.0.1:9297                            |
|   - Emulates S3, SQS, DynamoDB, IAM, and STS                |
|   - Auto-generates CA certs and credentials to:             |
|     ~/.aws/emulator/9297/ca.pem                             |
|     ~/.aws/emulator/9297/emulator_credentials               |
|     ~/.aws/emulator/9297/config                             |
+-------------------------------------------------------------+
```

---

## Complete Step-by-Step Setup Guide

Follow these steps from scratch to set up both the AWS Emulator and the Web Console UI.

---

### Step 1: Start the AWS Emulator in Docker

Ensure **Docker** is installed and running.

1. Create the local emulator configuration directory:
   ```bash
   mkdir -p ~/.aws/emulator
   ```

2. Start the AWS Emulator container:
   ```bash
   docker run -d --rm \
     --name aws-emulator \
     -p 127.0.0.1:9297:9297 \
     -v ~/.aws/emulator:~/.aws/emulator \
     aws-emulator \
     -b 0.0.0.0 -p 9297 --telemetry off
   ```

3. Verify the container is running:
   ```bash
   docker ps --filter "name=aws-emulator"
   ```

4. Confirm that the emulator generated its credentials and CA certificate:
   ```bash
   ls -la ~/.aws/emulator/9297/
   ```
   You should see:
   - `ca.pem` (TLS root certificate)
   - `emulator_credentials` (AWS Access Key & Secret Key)
   - `config` (Region `us-east-1` and endpoint URL `https://127.0.0.1:9297`)

---

### Step 2: (Optional) Verify via AWS CLI

To test that your emulator is responding via the standard `aws` CLI:

1. Export the emulator environment variables in your terminal:
   ```bash
   export AWS_SHARED_CREDENTIALS_FILE=~/.aws/emulator/9297/emulator_credentials
   export AWS_CONFIG_FILE=~/.aws/emulator/9297/config
   export AWS_CA_BUNDLE=~/.aws/emulator/9297/ca.pem
   export AWS_EC2_METADATA_DISABLED=true
   ```

2. Test calling S3, SQS, DynamoDB, and IAM:
   ```bash
   # STS Caller Identity
   aws sts get-caller-identity

   # S3 Buckets
   aws s3 ls

   # SQS Queues
   aws sqs list-queues

   # DynamoDB Tables
   aws dynamodb list-tables

   # IAM Users
   aws iam list-users
   ```

---

### Step 3: Set Up and Run the Console UI

1. Clone the repository:
   ```bash
   git clone https://github.com/Shubham-Bhayaje/-aws-emulator-ui.git
   cd -aws-emulator-ui
   ```

2. Install Node dependencies (requires Node.js v20+):
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

   > **Note:** The `npm run dev` script automatically sets:
   > - `NODE_EXTRA_CA_CERTS=$HOME/.aws/emulator/9297/ca.pem`
   > - `AWS_SHARED_CREDENTIALS_FILE=$HOME/.aws/emulator/9297/emulator_credentials`
   > - `AWS_CONFIG_FILE=$HOME/.aws/emulator/9297/config`
   > - `AWS_EC2_METADATA_DISABLED=true`
   > - Server binds to `127.0.0.1`

4. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your web browser.

---

## Features & Services Supported

### 1. Console Navigation & Home
- **Pixel-Perfect Theme**: Near-black top bar (`#000716`), official service icons, search drawer, region selector (`us-east-1`), and account switcher (`emulator @ 000000000000`).
- **Home Widgets**: **Recently Visited** with localStorage tracking and **Welcome to AWS** documentation links.
- **Services Catalog (`/services`)**: Full categorized index of 26+ AWS services with search filters, category pills, and official architectural icons.

### 2. Amazon S3 (`/s3`)
- List buckets with creation date and region.
- Create bucket (Block Public Access settings, Bucket Versioning).
- Object & folder browser with breadcrumbs.
- Drag-and-drop file upload, file download handler, object and folder deletion.
- Bucket emptying and deletion.

### 3. Amazon SQS (`/sqs`)
- List queues with message attributes, queue type (Standard vs FIFO), and creation timestamp.
- Create queue (Standard or FIFO with `.fifo` suffix handling).
- Send messages with custom message body.
- Poll and inspect messages in real time with receipt handles.
- Delete individual messages and purge queues.

### 4. Amazon DynamoDB (`/dynamodb`)
- Tables list with status badges (`ACTIVE`), partition & sort keys, item counts, and size metrics.
- Create table with partition key (String, Number, Binary), optional sort key, and on-demand or provisioned capacity mode.
- **Item Explorer**: Dynamic table columns auto-extracted from scanned items, partition key & sort key badges, and item type indicators.
- **Create Item Modal**: Dual-mode item editor with **Form View** (dynamic attribute adding with typed dropdowns) and **JSON View** (direct JSON object input).
- Delete individual items or tables with confirmation.

### 5. AWS Identity and Access Management (IAM) (`/iam`)
- **IAM Dashboard**: Metric summary tiles for Users, Roles, and Policies, with AWS Account ID and sign-in URL.
- **Users (`/iam/users`)**: Create users, attach/detach policies directly, and view user details.
- **Roles (`/iam/roles`)**: Create roles with trusted entity service principals (AWS Lambda, Amazon EC2, Amazon ECS, or Custom JSON Trust Policy).
- **Policies (`/iam/policies`)**: Browse AWS Managed & Customer Managed policies, create custom policies with a JSON editor.
- **Permission Inspector**: Visual statement breakdown (`Effect`, `Action`, `Resource`) and formatted JSON document viewer with one-click copy.

---

## Troubleshooting

### 1. Self-Signed Certificate Error (`DEPTH_ZERO_SELF_SIGNED_CERT`)
- **Cause**: Node.js does not recognize the local emulator's self-signed TLS cert by default.
- **Fix**: Always ensure `NODE_EXTRA_CA_CERTS=$HOME/.aws/emulator/9297/ca.pem` is passed when running the application. The `npm run dev` script handles this automatically.

### 2. Port 9297 Connection Refused
- **Cause**: The `aws-emulator` container is not running or port 9297 is blocked.
- **Fix**: Check `docker ps` to verify the container is active. Test connectivity with:
  ```bash
  curl -k https://127.0.0.1:9297
  ```

### 3. Missing Credentials
- **Cause**: The volume mount `-v ~/.aws/emulator:~/.aws/emulator` was omitted when starting the Docker container.
- **Fix**: Ensure the directory `~/.aws/emulator/9297/` exists and contains `ca.pem`, `config`, and `emulator_credentials`.
