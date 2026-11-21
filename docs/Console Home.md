# AWS Management Console Home

AWS Management Console Home is the central landing dashboard for managing cloud resources, monitoring operational health, evaluating security posture, and tracking cloud costs across Amazon Web Services. It offers a customizable, widget-based interface that aggregates metrics from services like AWS Health, AWS Security Hub, AWS Cost Management, and individual resource inventories. You should use Console Home as your primary starting point to gain immediate visibility into recent activity, health disruptions, compliance findings, and quick-start solution templates without navigating between disparate service consoles.

---

## 1. Key Concepts

### Dashboard Widgets
Modular, customizable cards that display specific telemetry, operational statuses, or navigation shortcuts. Users can add, remove, and reposition widgets to match their daily operational workflows.
*Example*: A DevOps engineer pins the **AWS Health** and **Security** widgets to the top of their dashboard to monitor service latency and failed security controls at a glance.

### Layout Customization & Persistence
The ability to toggle widget visibility via the **+ Add widgets** modal and reset to the canonical five-widget arrangement via **Reset to default layout**. Layout configurations are persisted client-side in browser storage.
*Example*: Hiding the **Welcome to AWS** widget after onboarding and enabling the **Build a solution** and **Explore AWS** widgets for quick architectural blueprints.

### Service Health & Diagnostic Telemetry
Real-time operational status indicators that monitor connectivity, round-trip latency (in milliseconds), open service issues, and scheduled maintenance across local emulator services.
*Example*: The **AWS Health** widget queries the local emulator endpoint over TLS, confirming that Amazon S3, DynamoDB, SQS, SNS, and IAM are responding with single-digit millisecond latency.

### Security Hub Posture Scoring
An automated compliance scoring mechanism that evaluates provisioned cloud resources against the AWS Foundational Security Best Practices benchmark.
*Example*: Identifying unencrypted S3 buckets, queues lacking Server-Side Encryption (SSE), or IAM root account access without Multi-Factor Authentication (MFA), and providing one-click remediation deep-links.

### Cost & Usage Inventory Engine
An automated cost tracking engine that calculates month-to-date actual spend, forecasted month-end costs, and active budget utilization based on live provisioned resources.
*Example*: Tracking estimated usage costs for provisioned DynamoDB tables, S3 storage payloads, and KMS keys against an active \$10.00 monthly budget limit.

### Quick-Start Solution Blueprints
Preconfigured solution launchers that guide developers through bootstrapping virtual servers, object stores, NoSQL databases, and pub/sub message brokers in seconds.
*Example*: Clicking **Create table** in the **Build a solution** widget to launch the Amazon DynamoDB table creation wizard.

---

## 2. Dependencies

| Dependency | Required / Optional | Where Used in Console | Documentation Link |
| :--- | :--- | :--- | :--- |
| **AWS STS** | Optional | User identity, account ID (`000000000000`), and active ARN in top bar and health ping | [Console Overview](README.md) |
| **AWS IAM** | Optional | Security widget (MFA hygiene audit, root access checks) and Health diagnostics | [Console Overview](README.md) |
| **Amazon S3** | Optional | Security widget (bucket encryption audit), Cost and usage billing inventory, Health diagnostics | [Amazon S3 Guide](S3.md) |
| **Amazon DynamoDB** | Optional | Cost and usage billing inventory, Health diagnostics, Build a solution launcher | [Amazon DynamoDB Guide](DynamoDB.md) |
| **Amazon SQS** | Optional | Security widget (queue encryption audit), Cost and usage billing inventory, Health diagnostics | [Amazon SQS Guide](SQS.md) |
| **Amazon SNS** | Optional | Health diagnostics ping, Build a solution launcher | [Amazon SNS Guide](SNS.md) |
| **Amazon S3 Glacier** | Optional | Health diagnostics ping, Build a solution launcher, Recently visited deduplication | [Amazon S3 Glacier Guide](S3%20Glacier.md) |
| **AWS KMS** | Optional | Security widget (key rotation audit), Cost and usage billing inventory | [AWS KMS Guide](KMS.md) |
| **AWS CloudWatch** | Optional | CloudWatch Alarms widget (*Available after CloudWatch is built*) | [Console Overview](README.md) |
| **AWS Application Manager** | Optional | Applications widget (*Available after AWS Application Manager is built*) | [Console Overview](README.md) |

---

## 3. Console Walkthrough and Tested AWS CLI Commands

All commands below are tested and verified against the local AWS Emulator endpoint (`https://127.0.0.1:9297`).

### 1. Dashboard Header (`/`)
- **Title**: `Console Home` with quick `Info` link to view dashboard capabilities.
- **Layout Actions**:
  - `Reset to default layout`: Restores the default layout arrangement.
  - `+ Add widgets`: Opens the modal dialog to toggle widgets on and off.
- **Identity Telemetry CLI Command**:
```bash
aws --endpoint-url https://127.0.0.1:9297 sts get-caller-identity
```

### 2. Recently Visited Widget
- Two-column launcher displaying recently accessed services with authentic AWS vector icons.
- Tracks visit timestamps (`just now`, `10m ago`, `1d ago`).
- Individual dismissal button ("x") to prune specific entries from history.
- Kebab menu actions: `Widget info`, `Reset to default list`, `View all services`, `Remove widget`.
- Quick link to the complete catalog: `View all services (200+)` navigating to `/services`.

### 3. Security Widget (AWS Security Hub)
- Displays current security compliance percentage (e.g., `80%`) based on AWS Foundational Security Best Practices.
- Real-time audit metrics: Failed controls count, Critical, High, Medium, Low severity breakdown.
- Action button: `Run security scan` executes a live inspection across emulator resources.
- Action button: `View details` opens the findings inspector modal with direct remediation deep-links to `/iam`, `/s3`, `/sqs`, and `/kms`.
- Finding suppression: Allows testing score recalculation after resolving issues.
- **Resource Verification CLI Commands**:
```bash
# Check IAM user compliance
aws --endpoint-url https://127.0.0.1:9297 iam list-users

# Check S3 bucket encryption compliance
aws --endpoint-url https://127.0.0.1:9297 s3api list-buckets
```

### 4. Welcome to AWS Widget
- Getting started guides for new learners.
- Tabbed resource navigation:
  - `Getting started`: Quick links to "Deploy a static website (S3)", "Set up a NoSQL database (DynamoDB)", "Create a serverless queue (SQS)".
  - `Training and certification`: Direct links to AWS Skill Builder and Certification roadmaps.
  - `Architecture & docs`: Links to AWS Whitepapers and the Reference Architecture Center.

### 5. Cost and Usage Widget
- Real-time month-to-date spending calculation (`$X.XX USD`) based on active emulator resources.
- Forecasted month-end cost projection.
- Visual stacked bar chart broken down by top active services.
- Daily vs. Monthly trend interval toggle.
- Built-in **AWS Budgets Manager**:
  - Set a monthly budget threshold (e.g., \$10.00).
  - Track budget consumption progress bar and status alert pills (`OK` or `Exceeded`).
  - Deep links to `/billing-conductor` and `/cost-management`.

### 6. AWS Health Widget
- Operational status badge: `Operational` (green) or `Disrupted` (red).
- Status counter pills: `Open issues` (0), `Scheduled changes` (0), `Other notifications` (0).
- Live round-trip diagnostic ping table testing emulator endpoints:
  - Amazon S3 (`s3:ListBuckets`)
  - Amazon DynamoDB (`dynamodb:ListTables`)
  - Amazon SQS (`sqs:ListQueues`)
  - Amazon SNS (`sns:ListTopics`)
  - Amazon S3 Glacier (`glacier:ListVaults`)
  - AWS IAM (`iam:ListUsers`)
  - AWS STS (`sts:GetCallerIdentity`)
- Displays latency in milliseconds (e.g., `12ms`) and connection details.
- Action button: `Refresh status` triggers an immediate re-test of all service endpoints.

### 7. Build a Solution Widget
- Quick-start solution cards for rapid resource deployment:
  - `Launch a virtual machine` -> Links to `/ec2`
  - `Create an object store` -> Links to `/s3/create`
  - `Set up a NoSQL database` -> Links to `/dynamodb/tables/create`
  - `Build a message queue` -> Links to `/sqs/create`
  - `Publish event notifications` -> Links to `/sns/create-topic`
  - `Archive long-term cold data` -> Links to `/glacier/create`

### 8. Explore AWS Widget
- Educational exploration cards:
  - `Hands-on Tutorials`: Step-by-step 10-minute application guides.
  - `AWS Free Tier`: Always-free, 12-month free, and trial limit details.
  - `Architecture Center`: Reference architecture blueprints and best practices.
  - `AWS Skill Builder`: 600+ digital courses and certification exam prep.

### 9. Add Widgets Modal (`+ Add widgets`)
- Dialog allowing learners to toggle widget visibility or restore defaults.
- Categorized by `Navigation`, `Security & Compliance`, `Documentation`, `Cost Management`, `Operations`, and `Solutions`.
- Clearly disables unbuilt services (*CloudWatch Alarms* and *Applications*) with the notice: *"Available after <service> is built"*.

---

## 4. Hands-on Exercises

### Exercise 1: Customizing the Dashboard Layout
**Goal**: Add and remove widgets on Console Home and reset to the canonical layout.
1. Open the console home page at `http://localhost:3000/`.
2. In the top-right toolbar, click the **+ Add widgets** button.
3. Toggle the **Build a solution** and **Explore AWS** widgets to visible.
4. Close the modal by clicking **Done**. Verify that both widgets appear on the dashboard.
5. In the **Welcome to AWS** widget header, click the kebab menu (three dots) and select **Remove widget**. Notice that the widget is removed immediately.
6. Click **Reset to default layout** in the header.
**Expected Result**: All default widgets are restored to their initial positions.

### Exercise 2: Evaluating Live Security Compliance and Remediation
**Goal**: Run a security audit and inspect failed controls across emulator services.
1. In the **Security** widget, inspect the current posture score (e.g., 75%).
2. Click **Run security scan**. Observe the live scanning spinner as the audit evaluates IAM, S3, and SQS resources.
3. Click **View details** to open the Security Details modal.
4. Filter findings by **Critical** and **High**. Review the remediation recommendation for unencrypted S3 buckets.
5. Click **Resolve / Suppress** on a finding.
**Expected Result**: The finding is marked as resolved and the security posture score increases in real time.

### Exercise 3: Inspecting Service Health and Round-Trip Latency
**Goal**: Verify live TLS connectivity to emulator services via the AWS Health widget.
1. Locate the **AWS Health** widget on Console Home.
2. Verify that the overall status pill displays **Operational**.
3. Inspect the diagnostic table to see the measured latency in milliseconds for Amazon S3, DynamoDB, SQS, SNS, Glacier, IAM, and STS.
4. Click the **Refresh status** button.
**Expected Result**: The widget performs live API calls to all seven services and updates the last checked timestamp.

### Exercise 4: Setting and Tracking a Monthly Cost Budget
**Goal**: Configure an active budget in the Cost and Usage widget to track cloud spend.
1. In the **Cost and usage** widget, review the month-to-date spend calculated from provisioned tables, buckets, and queues.
2. In the **AWS Budgets** section, click **Edit budget threshold**.
3. Set the monthly budget to `$5.00` and save.
**Expected Result**: The progress bar updates showing current consumption against the \$5.00 limit, displaying an `OK` status pill when under budget.

### Exercise 5: Bootstrapping a New Service via Build a Solution
**Goal**: Use the Build a Solution launcher to provision a new Amazon S3 bucket.
1. In the **Build a solution** widget, locate the **Create an object store** card.
2. Click **Create bucket**.
**Expected Result**: The console navigates directly to `/s3/create`, preconfigured with standard AWS S3 defaults.

---

## 5. Limitations

- **CloudWatch Alarms Widget**: The emulator does not run a background CloudWatch alarm evaluation daemon. The CloudWatch Alarms widget is listed as disabled (*Available after CloudWatch is built*).
- **AWS Application Manager**: Business application registry and multi-tier deployment monitoring requires AWS AppRegistry, which is currently unbuilt.
- **Client-Side Layout Persistence**: Widget positions and visibility preferences are saved in your browser's `localStorage` (`aws_console_home_widgets`) rather than synced to AWS User Settings service.

---

## 6. Common Errors and Troubleshooting

### 1. Missing or Disrupted Service in AWS Health Widget
- **Symptom**: One or more services in the AWS Health widget display a red **Disrupted** badge with a connection error.
- **Cause**: The emulator daemon is stopped or the self-signed TLS certificate is untrusted.
- **Fix**: Verify that the emulator is running at `https://127.0.0.1:9297` with `NODE_EXTRA_CA_CERTS` pointing to `ca.pem`, and click **Refresh status**.

### 2. Widget Disappears After Refresh
- **Symptom**: A widget toggled on is missing after clearing browser cache.
- **Cause**: `localStorage` was wiped or modified.
- **Fix**: Click **+ Add widgets** and re-enable the widget, or click **Reset to default layout** to restore the canonical dashboard.

### 3. Duplicate Service Entries in Recently Visited
- **Symptom**: Multiple entries for the same service appear under Recently Visited.
- **Cause**: Visiting legacy alias URLs (such as `/s3glacier`) prior to canonical 307 routing.
- **Fix**: Click the kebab menu on the **Recently visited** widget and select **Reset to default list**, or dismiss duplicate entries using the individual "x" hover button.
