# AWS Emulator Console UI (`-aws-emulator-ui`)

A lightweight, local, pixel-perfect **AWS Management Console UI** clone designed to interact with a local **AWS Emulator** running in Docker or standalone. 

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **AWS SDK v3**.

---

## Features

### 1. Pixel-Perfect AWS Console Theme & Navigation
- **Console Top Navigation**: AWS dark theme (`#000716`), official service icons, categorized search drawer, region selector, and user account switcher.
- **Console Home**: AWS-styled widgets including **Recently Visited** with localStorage tracking and **Welcome to AWS** documentation links.
- **All Services Catalog (`/services`)**: Full categorized index of 26+ AWS services with search filters, category pills, and official architectural icons.

### 2. Supported AWS Services
- **Amazon S3 (`/s3`)**:
  - Bucket listing with creation date and region.
  - Bucket creation (Block public access, bucket versioning settings).
  - Prefix-based folder/object browser.
  - Drag-and-drop file upload, file download handler, object and folder deletion.
  - Bucket emptying and deletion.

- **Amazon SQS (`/sqs`)**:
  - List queues with message attributes, queue type (Standard vs FIFO), and creation timestamp.
  - Queue creation (Standard or FIFO with `.fifo` suffix handling).
  - Send messages with message body.
  - Poll and inspect messages in real time.
  - Message deletion and queue purging.

- **Amazon DynamoDB (`/dynamodb`)**:
  - Tables list with status badges (`ACTIVE`), partition & sort keys, item counts, and size metrics.
  - Create table with partition key (String, Number, Binary), optional sort key, and on-demand or provisioned capacity mode.
  - **Item Explorer**: Dynamic table columns auto-extracted from scanned items, partition key & sort key badges, and item type indicators.
  - **Create Item Modal**: Dual-mode item editor with **Form View** (dynamic attribute adding with typed dropdowns) and **JSON View** (direct JSON object input).
  - Delete individual items or tables with confirmation.

- **AWS Identity and Access Management (IAM) (`/iam`)**:
  - **IAM Dashboard**: Metric summary tiles for Users, Roles, and Policies, with AWS Account ID and sign-in URL.
  - **Users (`/iam/users`)**: Create users, attach/detach policies directly, and view user details.
  - **Roles (`/iam/roles`)**: Create roles with trusted entity service principals (AWS Lambda, Amazon EC2, Amazon ECS, or Custom JSON Trust Policy).
  - **Policies (`/iam/policies`)**: Browse AWS Managed & Customer Managed policies, create custom policies with a JSON editor.
  - **Permission Inspector**: Visual statement breakdown (`Effect`, `Action`, `Resource`) and formatted JSON document viewer with one-click copy.

---

## Getting Started

### Prerequisites
- **Node.js**: v20 or v22+
- **Local AWS Emulator**: Running at `https://127.0.0.1:9297` with self-signed certificate.

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Shubham-Bhayaje/-aws-emulator-ui.git
   cd -aws-emulator-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server (configured for local emulator CA cert):
   ```bash
   npm run dev
   ```

4. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

---

## Security & Architecture
- **Server-Side Only AWS Calls**: No AWS credentials or SDK clients are ever exposed to the browser client components. All calls execute via Server Actions or Server Components.
- **TLS CA Trust**: Connects securely to the local emulator via `NODE_EXTRA_CA_CERTS`.
- **Force Path Style S3**: Configured for local emulator compatibility.
