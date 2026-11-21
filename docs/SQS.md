# Amazon Simple Queue Service (SQS) Guide

## 1. What is Amazon SQS and When to Use It?

Amazon Simple Queue Service (Amazon SQS) is a fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications. SQS eliminates the complexity and overhead associated with managing and operating message-oriented middleware, allowing developers to focus on core differentiated application logic. Using SQS, you can send, store, and receive messages between software components at any volume without losing messages or requiring other services to remain constantly available. SQS is ideal for asynchronous background task processing, traffic spike smoothing, cross-service event buffering, and orchestrating distributed batch jobs.

---

## 2. Key Concepts

### Standard Queues vs. FIFO Queues
- **Standard Queues**: Provide nearly unlimited throughput, at-least-once delivery guarantee, and best-effort message ordering. Occasional out-of-order or duplicate messages can occur if consumers re-read before visibility expires.
  - *Example*: An image resizing queue where 10,000 photos are uploaded simultaneously, and workers process jobs independently without caring which photo finishes first.
- **FIFO Queues (First-In-First-Out)**: Guarantee strictly preserved ordering and exactly-once processing using Message Deduplication IDs and Message Group IDs. FIFO queue names must end with the `.fifo` suffix.
  - *Example*: A financial trade execution ledger where debiting funds must occur strictly before crediting balances and duplicate transactions must be eliminated.

### Visibility Timeout
When a consumer receives a message from a queue, the message remains in the queue while the consumer processes it, but is hidden from other concurrent consumers for the duration of the visibility timeout. If the consumer fails to process or delete the message within this period, the message becomes visible again for other consumers to pick up.
- *Default*: 30 seconds (configurable from 0 seconds to 12 hours).
- *Example*: A video transcoder worker has 5 minutes to convert a media file. Setting the visibility timeout to 300 seconds prevents duplicate workers from picking up the same video while encoding is underway.

### Dead-Letter Queue (DLQ) and Maximum Receives
A dead-letter queue is a secondary queue used to isolate unprocessable or poisonous messages. When a consumer receives a message more times than the configured `Maximum Receives` threshold without deleting it, SQS automatically routes the message into the DLQ for diagnostic analysis.
- *Example*: A malformed JSON payload crashes a worker process. After 3 retries, SQS moves it to `orders-dlq`, preventing the broken message from blocking healthy orders in the primary queue.

### Long Polling vs. Short Polling
- **Short Polling (`ReceiveMessageWaitTimeSeconds = 0`)**: The receive request queries a subset of servers and returns immediately, even if no messages are found.
- **Long Polling (`ReceiveMessageWaitTimeSeconds > 0`)**: The receive request waits up to 20 seconds for messages to arrive before returning an empty response, reducing empty responses and API costs.
- *Example*: A worker service waits with `WaitTimeSeconds = 20` so it immediately wakes up when a new task arrives without polling in a tight loop.

### Server-Side Encryption (SSE-SQS vs. SSE-KMS)
- **SSE-SQS**: SQS manages the encryption keys natively with 256-bit AES encryption with no additional KMS request charges or key policies.
- **SSE-KMS**: Messages are encrypted using a customer managed AWS KMS key (CMK) or the AWS managed KMS key for SQS (`alias/aws/sqs`), enabling audit trails in AWS CloudTrail and granular IAM key policies.
- *Example*: A healthcare application handling patient health records encrypts messages using a dedicated customer managed KMS key to satisfy HIPAA compliance requirements.

---

## 3. Console Walkthrough & Matching AWS CLI Commands

### A. Queues Inventory Page (`/sqs`)
- **Metric Summary Cards**:
  - `Total Queues`: Total count of standard and FIFO queues in the active region.
  - `Total Messages Available`: Messages ready to be consumed across all queues.
  - `Total Messages In Flight`: Messages currently leased by consumers within their visibility timeout.
  - `Total Messages Delayed`: Messages configured with delivery delays not yet available to consumers.
- **Table Controls**:
  - Filter queues by name search input.
  - Actions dropdown: View details, Edit queue, Send and receive messages, Purge, and Delete.
  - Primary button: `Create queue` (navigates to `/sqs/create`).
- **AWS CLI Command**:
  ```bash
  aws sqs list-queues \
    --endpoint-url https://127.0.0.1:9297 \
    --region us-east-1
  ```

---

### B. Create Queue Wizard (`/sqs/create`)
- **Type Selection**: Radio cards for Standard vs FIFO (auto-appends `.fifo` suffix).
- **Configuration**:
  - Visibility timeout (0s to 12h, default 30s).
  - Message retention period (1 minute to 14 days, default 4 days).
  - Delivery delay (0s to 15m, default 0s).
  - Maximum message size (1 KB to 256 KB, default 256 KB).
  - Receive message wait time (0s to 20s, default 0s for short polling, 20s for long polling).
- **FIFO Specific Settings** (when FIFO is selected):
  - Content-based deduplication toggle.
  - Deduplication scope (Queue or Message group).
  - FIFO throughput limit (Per queue or Per message group ID).
- **Encryption**:
  - SQS managed encryption (SSE-SQS).
  - AWS Key Management Service (SSE-KMS) with live dropdown of customer keys from KMS.
  - KMS data key reuse period (1 minute to 24 hours, default 300 seconds).
- **Access Policy**:
  - Basic mode vs Advanced JSON policy editor.
- **Dead-letter Queue**:
  - Enable DLQ toggle.
  - Sibling queue selector (Standard queues pair with Standard, FIFO with FIFO).
  - Maximum receives threshold (1 to 1,000, default 3).
- **Tags**: Key-value tag management.
- **AWS CLI Command (Standard Queue)**:
  ```bash
  aws sqs create-queue \
    --queue-name orders-processing \
    --attributes VisibilityTimeout=60,MessageRetentionPeriod=86400,DelaySeconds=0,ReceiveMessageWaitTimeSeconds=20 \
    --endpoint-url https://127.0.0.1:9297 \
    --region us-east-1
  ```
- **AWS CLI Command (FIFO Queue)**:
  ```bash
  aws sqs create-queue \
    --queue-name payments-ledger.fifo \
    --attributes FifoQueue=true,ContentBasedDeduplication=true \
    --endpoint-url https://127.0.0.1:9297 \
    --region us-east-1
  ```

---

### C. Queue Details & Management (`/sqs/[queue]`)
- **Header Actions**:
  - `Send and receive messages`
  - `Edit`
  - `Purge`
  - `Delete`
- **Tabs**:
  1. **Details**: Queue URL, ARN, type, creation date, visibility timeout, retention period, delivery delay, and live message count badges.
  2. **Send and receive messages**:
     - *Send section*: Message body editor, optional delivery delay, message attributes (String, Number, Binary), and FIFO deduplication/group ID inputs.
     - *Receive section*: Poll duration, max message count (1-10), live Polling progress bar, received messages table, and message body modal inspector.
  3. **Monitoring**: CloudWatch metrics overview cards for message counts and delays.
  4. **Encryption**: Encryption tier indicator (SSE-SQS or SSE-KMS with master key ARN).
  5. **Access policy**: Formatted read-only IAM resource-based access policy.
  6. **Redrive policy**: Dead-letter queue associations, ARN, and maximum receive count.
  7. **Dead-letter queue redrive**: Interactive utility to move messages from DLQ back to source queue.
  8. **Tags**: View, add, and remove tags attached to the queue.
  9. **SNS subscriptions**: Disabled with integration notice `Available after SNS is built`.
  10. **Lambda triggers**: Real dropdown of available Lambda functions with direct navigation.

- **AWS CLI Commands**:
  - **Send Message**:
    ```bash
    aws sqs send-message \
      --queue-url https://sqs.us-east-1.amazonaws.com/000000000000/orders-processing \
      --message-body '{"orderId":"ORD-1001","amount":49.99,"status":"PENDING"}' \
      --endpoint-url https://127.0.0.1:9297 \
      --region us-east-1
    ```
  - **Receive Messages**:
    ```bash
    aws sqs receive-message \
      --queue-url https://sqs.us-east-1.amazonaws.com/000000000000/orders-processing \
      --max-number-of-messages 10 \
      --wait-time-seconds 5 \
      --endpoint-url https://127.0.0.1:9297 \
      --region us-east-1
    ```
  - **Delete Message**:
    ```bash
    aws sqs delete-message \
      --queue-url https://sqs.us-east-1.amazonaws.com/000000000000/orders-processing \
      --receipt-handle "<RECEIPT_HANDLE>" \
      --endpoint-url https://127.0.0.1:9297 \
      --region us-east-1
    ```
  - **Purge Queue**:
    ```bash
    aws sqs purge-queue \
      --queue-url https://sqs.us-east-1.amazonaws.com/000000000000/orders-processing \
      --endpoint-url https://127.0.0.1:9297 \
      --region us-east-1
    ```
  - **Delete Queue**:
    ```bash
    aws sqs delete-queue \
      --queue-url https://sqs.us-east-1.amazonaws.com/000000000000/orders-processing \
      --endpoint-url https://127.0.0.1:9297 \
      --region us-east-1
    ```

---

## 4. Hands-On Exercises for Beginners

### Exercise 1: Create a Standard Queue and Send Your First Message
1. In the console, navigate to **SQS** -> click **Create queue**.
2. Select **Standard**, enter Queue name `welcome-emails`.
3. Keep default settings (Visibility timeout: 30 seconds, Retention: 4 days).
4. Click **Create queue**.
5. On the queue details page, click **Send and receive messages**.
6. In **Message body**, type `{"userId": "usr_99", "email": "test@example.com", "action": "SEND_WELCOME"}`.
7. Click **Send message**.
- **Expected Result**: A green banner confirms "Message sent successfully" with a unique Message ID and MD5 checksum.

### Exercise 2: Poll and Inspect Messages
1. On the same `welcome-emails` queue page under **Send and receive messages**, scroll to **Receive messages**.
2. Set **Poll duration** to 5 seconds.
3. Click **Poll for messages**.
4. A progress bar animates. Once polling completes, 1 message appears in the table.
5. Click on the message row or ID.
- **Expected Result**: A message details modal displays the exact JSON payload, message ID, size, MD5 digest, and receive timestamp.

### Exercise 3: Configure a Dead-Letter Queue (DLQ)
1. Click **Create queue** and create a standard queue named `failed-orders-dlq`.
2. Click **Create queue** again and create a queue named `active-orders`.
3. In the **Dead-letter queue** section:
   - Toggle **Enabled**.
   - Choose `failed-orders-dlq` from the dropdown list of queues.
   - Set **Maximum receives** to `3`.
4. Click **Create queue**.
- **Expected Result**: The `active-orders` queue details page shows the Redrive policy pointing to the ARN of `failed-orders-dlq` with a max receive count of 3.

### Exercise 4: Create a FIFO Queue with Deduplication
1. Navigate to **Create queue**.
2. Select **FIFO**. Notice the `.fifo` suffix is automatically added to the name.
3. Enter `inventory-updates.fifo`.
4. Ensure **Content-based deduplication** is enabled.
5. Click **Create queue**.
6. Click **Send and receive messages**, enter a Message Group ID `warehouse-north`, and send a message.
- **Expected Result**: The FIFO queue accepts the message with strict ordering metadata and displays the FIFO badge in the queue header.

---

## 5. Limitations & Emulator Behavior

1. **Dead-Letter Redrive Automation**:
   - In real AWS, automated redrive tasks run as an asynchronous batch managed service. In the local emulator, manual redrive transfers unacknowledged messages sequentially between queues.
2. **High-Throughput FIFO Quotas**:
   - Real AWS provides partition-based high throughput scaling up to 70,000 msgs/sec with deduplication scopes. The local emulator stores queue items in memory/local SQLite, which is ideal for functional learning and verification but does not scale to cloud partition limits.
3. **SNS Fanout & CloudWatch Alarms**:
   - SNS subscription targets are marked as `Available after SNS is built` and documented in the integration backlog.
   - CloudWatch metric alarms and CloudWatch Events are displayed natively as visual metric cards.

---

## 6. Common Errors & Troubleshooting

- **Error: Queue name must end with .fifo**:
  - *Cause*: Attempting to create a FIFO queue without the `.fifo` suffix.
  - *Fix*: The console automatically appends `.fifo` when FIFO is toggled, but ensure manual inputs retain the suffix.
- **Error: Cannot delete queue with messages (or timeout)**:
  - *Cause*: In high-load test scenarios, polling workers might lock visibility.
  - *Fix*: Click **Purge queue** first to wipe all messages, then click **Delete queue**.
- **Error: NonExistentQueue**:
  - *Cause*: The queue was recently deleted or the URL is malformed.
  - *Fix*: Refresh the Queues list to sync with emulator state.
- **Error: InvalidParameterValue (DLQ type mismatch)**:
  - *Cause*: Pairing a Standard queue with a FIFO dead-letter queue, or vice versa.
  - *Fix*: The console dropdown automatically filters sibling queues to matching types (Standard to Standard, FIFO to FIFO).

---

## 7. Dependencies & Integration Backlog

| Dependency | Type | Console Location | Status |
|---|---|---|---|
| AWS KMS | Optional | Encryption section in Create/Edit/Details | Built (`/kms`) - Live customer keys dropdown |
| AWS Lambda | Optional | Lambda triggers tab | Built (`/lambda`) - Live functions list |
| Amazon SNS | Optional | SNS subscriptions tab | Pending (`Available after SNS is built`) |
| CloudWatch Alarms | Optional | Monitoring tab | Built - Educational metric cards |
