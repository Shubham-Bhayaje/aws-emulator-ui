# Amazon CloudWatch Logs Guide

Amazon CloudWatch Logs is a centralized logging service that allows you to collect, monitor, store, and analyze log files from Amazon EC2 instances, AWS Lambda functions, Amazon API Gateway, and custom applications in real time. Instead of SSH-ing into individual virtual machines or parsing raw log files on disks, you stream log data into CloudWatch Logs to search for errors, track system metrics, and diagnose application issues from a unified dashboard. You can configure retention policies to automatically delete old log files to control storage costs or stream critical events into analytics platforms for automated threat detection and compliance auditing.

---

## Key Concepts

### 1. Log Group
A logical container that shares the same retention period, access control policies, metric filters, and monitoring settings. All logs originating from a single microservice, Lambda function, or EC2 fleet are usually grouped together into one log group.
- *Example*: `/aws/lambda/payment-gateway` or `/var/log/nginx/access.log`.

### 2. Log Stream
A sequence of log events that share the same source, such as a specific container instance, EC2 virtual server, or Lambda execution environment. Each instance or pod pushing logs creates its own log stream inside the parent log group.
- *Example*: `2026/11/21/[$LATEST]4b1e60d0ecb74bb2` or `i-0123456789abcdef0`.

### 3. Log Event
A single record of activity recorded by the application or system. Every log event contains two core attributes: an epoch timestamp in milliseconds when the event occurred, and the raw text or JSON message string.
- *Example*: `timestamp: 1795280181706`, `message: "2026-11-21 22:30:00 [ERROR] Database connection timed out after 5000ms"`.

### 4. Retention Policy
A rule determining how long log events are kept before being automatically deleted. Retention settings can range from 1 day to 10 years, or set to *Never expire*.
- *Example*: Keeping development logs for `14 days` and production audit trails for `365 days`.

### 5. Metric Filter
A search pattern that scans incoming log events in real time and extracts numerical metrics that are published to Amazon CloudWatch Metrics. You can use metric filters to track error rates, response times, or count specific keyword occurrences without modifying application source code.
- *Example*: Matching `[ERROR]` and incrementing the metric `ErrorCount` by `1` in the `CustomApp/Logs` namespace.

### 6. Subscription Filter
A real-time processing rule that forwards incoming log events directly to a destination service such as an Amazon Kinesis Data Stream or an AWS Lambda function for custom alerting, stream processing, or long-term archiving.
- *Example*: Streaming all application error logs into Amazon Kinesis stream `demo-telemetry-stream` for live security alerting.

---

## Console Walkthrough & Verified AWS CLI Commands

All commands below have been tested and verified against the local AWS Emulator running at `https://127.0.0.1:9297`.

> Note: To authenticate CLI commands with the emulator, set your environment variables:
> ```bash
> export AWS_SHARED_CREDENTIALS_FILE=~/.aws/emulator/9297/emulator_credentials
> export AWS_CONFIG_FILE=~/.aws/emulator/9297/config
> export AWS_CA_BUNDLE=~/.aws/emulator/9297/ca.pem
> ```

---

### 1. Log Groups Inventory (`/cloudwatch/logs`)
View, search, and manage all log groups in the active Region.
- **Console Actions**:
  - Filter by log group prefix or keyword.
  - Multi-select log groups to edit retention or delete in bulk.
  - Inspect total stored bytes, metric filter counts, and KMS key IDs.

**CLI: List all log groups**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs describe-log-groups
```

---

### 2. Create Log Group
Click the orange **Create log group** button in the top right.
- **Fields**:
  - **Log group name**: e.g., `/aws/lambda/demo-orders-api` (1-512 chars).
  - **Log class**: `Standard` (full real-time analytics) or `Infrequent Access` (cost-optimized).
  - **Retention setting**: Choose from standard periods (e.g., `14 days`).
  - **KMS key ARN**: Choose default AWS encryption or select a customer managed key from the emulator's KMS service.
  - **Tags**: Optional key-value metadata pairs.

**CLI: Create log group**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs create-log-group \
    --log-group-name /aws/lambda/demo-orders-api
```

**CLI: Set retention policy**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs put-retention-policy \
    --log-group-name /aws/lambda/demo-orders-api \
    --retention-in-days 14
```

---

### 3. Log Streams Tab (`/cloudwatch/logs/group/[logGroupName]`)
Inspect individual log streams inside the log group.
- **Console Actions**:
  - Click **Create log stream** to add a new stream.
  - Select streams and click **Delete log stream(s)**.
  - Click any stream name to enter the dedicated event viewer.

**CLI: Create a log stream**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs create-log-stream \
    --log-group-name /aws/lambda/demo-orders-api \
    --log-stream-name 2026/11/21/worker-01
```

**CLI: Describe log streams**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs describe-log-streams \
    --log-group-name /aws/lambda/demo-orders-api
```

---

### 4. Dedicated Stream Event Viewer (`/cloudwatch/logs/stream?group=...&stream=...`)
View raw log events in a terminal-styled interface.
- **Console Actions**:
  - Filter events by keyword or substring.
  - Expand individual rows to inspect exact event timestamps and ingestion times.
  - Click **Put log event** to inject test records directly from the console.

**CLI: Ingest log events**:
```bash
NOW=$(python3 -c "import time; print(int(time.time()*1000))")
aws --endpoint-url https://127.0.0.1:9297 logs put-log-events \
    --log-group-name /aws/lambda/demo-orders-api \
    --log-stream-name 2026/11/21/worker-01 \
    --log-events timestamp=$NOW,message="[INFO] Order #10492 created successfully"
```

**CLI: Retrieve log events**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs get-log-events \
    --log-group-name /aws/lambda/demo-orders-api \
    --log-stream-name 2026/11/21/worker-01
```

---

### 5. Search Log Group Tab (`/cloudwatch/logs/group/[logGroupName]`)
Search and filter log records across all streams in the log group simultaneously.
- **Console Actions**:
  - Search by pattern (e.g., `[ERROR]`, `timeout`, or JSON attributes).
  - Filter by time range: 1 hour, 3 hours, 12 hours, 1 day, 3 days, 1 week, or All time.

**CLI: Filter log events across streams**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs filter-log-events \
    --log-group-name /aws/lambda/demo-orders-api \
    --filter-pattern "[ERROR]"
```

---

### 6. Metric Filters Tab
Extract numerical metrics from logs and publish them to CloudWatch.
- **Console Actions**:
  - Click **Create metric filter**.
  - Define filter pattern, metric name, namespace, and value.

**CLI: Put metric filter**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs put-metric-filter \
    --log-group-name /aws/lambda/demo-orders-api \
    --filter-name OrdersErrorCount \
    --filter-pattern "[ERROR]" \
    --metric-transformations metricName=ErrorCount,metricNamespace=CustomOrders,metricValue=1
```

**CLI: Describe metric filters**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs describe-metric-filters \
    --log-group-name /aws/lambda/demo-orders-api
```

---

### 7. Subscription Filters Tab
Stream log events in real time to Amazon Kinesis or AWS Lambda.
- **Console Actions**:
  - Click **Create subscription filter**.
  - Select destination: Amazon Kinesis (loads real streams from the emulator).

**CLI: Create Kinesis subscription filter**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs put-subscription-filter \
    --log-group-name /aws/lambda/demo-orders-api \
    --filter-name KinesisForwarder \
    --filter-pattern "[ERROR]" \
    --destination-arn "arn:aws:kinesis:us-east-1:000000000000:stream/demo-telemetry-stream" \
    --role-arn "arn:aws:iam::000000000000:role/CWLtoKinesisRole"
```

**CLI: Describe subscription filters**:
```bash
aws --endpoint-url https://127.0.0.1:9297 logs describe-subscription-filters \
    --log-group-name /aws/lambda/demo-orders-api
```

---

### 8. Live Tail (`/cloudwatch/logs/live-tail`)
Real-time streaming terminal that auto-refreshes every 2.5 seconds to display newly ingested log events across all active streams.
- Select a log group and click **Start Live Tail**.

---

### 9. Log Insights (`/cloudwatch/logs/insights`)
Interactive query editor to search and analyze log records with query templates:
- `fields @timestamp, @message | sort @timestamp desc | limit 20`
- `fields @timestamp, @message | filter @message like /error/ | limit 50`

---

## Hands-On Exercises

### Exercise 1: Create a Log Group and Configure Retention
1. Open the console at `http://localhost:3000/cloudwatch/logs`.
2. Click **Create log group**.
3. Enter log group name `/aws/ecs/ecommerce-backend`.
4. Set retention setting to `1 month (30 days)` and click **Create**.
5. *Expected Result*: The table displays `/aws/ecs/ecommerce-backend` with retention `1 month (30 days)`.

### Exercise 2: Create a Stream and Ingest Log Records
1. Click on `/aws/ecs/ecommerce-backend` in the log groups list.
2. Under the **Log streams** tab, click **Create log stream**.
3. Name the stream `container-task-01` and click **Create**.
4. Click on `container-task-01` to open the stream viewer.
5. Click **Put log event**, enter `2026-11-21 22:30:00 [ERROR] Connection refused by Redis cache`, and click **Put event**.
6. *Expected Result*: The message is immediately displayed with timestamp and ingestion metadata.

### Exercise 3: Filter Log Records Across Streams
1. Return to the log group detail page and click the **Search log group** tab.
2. In the filter pattern box, type `[ERROR]` and click **Search**.
3. *Expected Result*: Only the log record containing `[ERROR]` is returned. Click the row to expand Event ID details.

### Exercise 4: Create a CloudWatch Metric Filter
1. In the log group detail page, select the **Metric filters** tab.
2. Click **Create metric filter**.
3. Enter Filter pattern: `[ERROR]`, Filter name: `AppErrors`, Namespace: `Ecommerce/App`, Metric name: `ErrorCount`, Value: `1`.
4. Click **Create**.
5. *Expected Result*: The metric filter is listed with pattern `[ERROR]` and namespace `Ecommerce/App`.

### Exercise 5: Forward Logs to Amazon Kinesis via Subscription Filter
1. Select the **Subscription filters** tab.
2. Click **Create subscription filter**.
3. Choose **Amazon Kinesis**, enter filter name `KinesisAuditStream`, and select the active Kinesis stream `demo-telemetry-stream`.
4. Click **Create**.
5. *Expected Result*: The subscription filter is registered, routing matching log events to Amazon Kinesis.

---

## Limitations of Local Emulator

1. **S3 Log Export Tasks (`CreateExportTask`)**:
   - Asynchronous background export tasks to Amazon S3 buckets are not supported by the local emulator engine. Use Subscription Filters to forward records to Amazon Kinesis or SQS instead.
2. **Log Event Timestamps**:
   - CloudWatch Logs strictly enforces that event timestamps cannot be older than 14 days in the past or more than 2 hours in the future. Ingesting timestamps outside this window will return `InvalidParameterException`.
3. **Logs Insights Server Engine**:
   - The headless emulator does not execute the proprietary CloudWatch Logs Insights distributed query engine. The console uses the native `FilterLogEvents` engine to scan and parse records matching query keywords.
4. **Data Protection Policies**:
   - Automated PII masking (data identifiers) is not processed by the local emulator.

---

## Common Errors and How to Fix Them

1. **`ResourceAlreadyExistsException: The specified log group already exists`**:
   - *Fix*: Log group names must be unique within the AWS Region. Choose a different name or delete the existing log group.
2. **`InvalidParameterException: The specified KMS Key Id could not be found`**:
   - *Fix*: Ensure the KMS Key ARN exists in the local emulator's KMS inventory. You can create one at [KMS Console](/kms) first.
3. **`InvalidParameterException: Log event timestamp is older than retention period or 14 days`**:
   - *Fix*: Pass `Date.now()` or use the current epoch timestamp in milliseconds when putting log events.

---

## Dependencies

- [AWS Key Management Service (KMS)](KMS.md) *(Optional)*: Customer managed key encryption for log group records.
- [AWS IAM](README.md) *(Optional)*: Service execution roles for cross-service subscription streaming.
- [Amazon Kinesis Data Streams](Kinesis%20Data%20Streams.md) *(Optional)*: Real-time streaming destination for subscription filters.
- [AWS Lambda](README.md) *(Optional)*: Serverless event-driven execution for log processing.
