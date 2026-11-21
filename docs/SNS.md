# Amazon Simple Notification Service (SNS)

Amazon Simple Notification Service (Amazon SNS) is a fully managed messaging service for both application-to-application (A2A) and application-to-person (A2P) communication. It enables developers to publish messages from a publisher and distribute them asynchronously to multiple subscribing endpoints, such as Amazon SQS queues, AWS Lambda functions, HTTP/S webhooks, and email addresses. You should use Amazon SNS when you need high-throughput publish/subscribe (pub/sub) fanout, decoupling of microservices, or event-driven alerts.

---

## 1. Key Concepts

### Topics
An access point and communication channel that acts as a logical message hub. Publishers send messages to a topic, and SNS matches and delivers them to all authorized subscriptions attached to that topic.
*Example*: An `order-notifications` topic receives a message every time a checkout is completed.

### Subscriptions and Endpoints
A client endpoint that registers interest in a topic to receive messages. Supported endpoint protocols include Amazon SQS, AWS Lambda, HTTP/HTTPS, Email, and SMS.
*Example*: An Amazon SQS queue named `billing-queue` subscribes to the `order-notifications` topic to process payments asynchronously.

### Standard vs. FIFO Topics
- **Standard Topics**: Support nearly unlimited throughput, best-effort message ordering, and at-least-once delivery.
- **FIFO Topics**: Guarantee strict message ordering (First-In-First-Out) and exactly-once message delivery via message deduplication IDs or content-based deduplication. Topic names must end with the `.fifo` suffix.
*Example*: A banking ledger uses `transactions.fifo` to guarantee withdrawals and deposits are recorded in the exact order received.

### Fanout Architecture
A architectural pattern where one message published to an SNS topic is replicated and delivered in parallel to multiple subscriber queues or services.
*Example*: Publishing to `user-signup` simultaneously sends notifications to an SQS onboarding queue, an email welcome worker, and an analytics Lambda function.

### Message Attributes and Filter Policies
Publishers can attach metadata key-value pairs (String, Number, Binary) to messages. Subscribers can attach a JSON filter policy so they only receive messages matching specific attributes, reducing processing noise.
*Example*: A subscription with filter policy `{"store": ["us-east"]}` ignores messages published with `{"store": ["eu-central"]}`.

---

## 2. Dependencies and Integration

| Dependency | Required / Optional | Where Used in Console | Status |
| :--- | :--- | :--- | :--- |
| **AWS KMS** | Optional | Topic creation, edit topic, and encryption tab for server-side encryption with AWS managed or customer master keys (CMK) | Built (`/kms`) |
| **Amazon SQS** | Optional | Subscriptions protocol dropdown, SQS Dead-Letter Queue (DLQ) configuration, and SQS Queue Details SNS Subscriptions tab | Built (`/sqs`) |
| **AWS Lambda** | Optional | Subscriptions protocol dropdown to invoke serverless functions directly upon message publication | Built (`/lambda`) |
| **Amazon CloudWatch** | Optional | Topic CloudWatch metrics widget and delivery status logging configuration | Built (`/cloudwatch`) |

---

## 3. Console Walkthrough and Tested AWS CLI Commands

All commands below are tested and verified against the local AWS Emulator endpoint (`https://127.0.0.1:9297`).

### 1. Topics Inventory (`/sns/topics` and `/sns`)
- Displays all topics in the current Region with summary metric cards: Total topics, Standard topics, FIFO topics, and Subscriptions.
- Features search filter by topic name/ARN, radio selection, view details, and topic deletion.

**Matching CLI Command (List Topics)**:
```bash
aws sns list-topics \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 2. Create Topic (`/sns/topics/create`)
- Choose Type: **Standard** or **FIFO**. For FIFO, topic name must end with `.fifo`.
- Display Name: Optional display name for SMS messages.
- Encryption: Toggle server-side encryption using AWS managed key `alias/aws/sns` or select an existing KMS key from your account.
- Access Policy: Configure Basic or Advanced JSON access permissions.
- Delivery Retry Policy (HTTP/S): Configure retry count, minimum/maximum delay, and backoff functions.
- Tags: Add key-value tags.

**Matching CLI Command (Create Standard Topic)**:
```bash
aws sns create-topic \
  --name tutorial-orders \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Create FIFO Topic)**:
```bash
aws sns create-topic \
  --name inventory-events.fifo \
  --attributes FifoTopic=true,ContentBasedDeduplication=true \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 3. Topic Details (`/sns/topics/[topicArn]`)
Provides 7 tabs:
- **Details**: Topic ARN, display name, topic type, deduplication settings, message counts, and actions (Publish message, Edit, Delete).
- **Subscriptions**: Interactive table of subscriptions attached to this topic. Includes Create subscription button and Unsubscribe modal.
- **Encryption**: Server-side encryption status and KMS key ARN.
- **Access policy**: Formatted read-only view of the IAM resource-based policy.
- **Delivery policy (HTTP/S)**: Active HTTP/S retry rules.
- **Delivery status logging**: IAM role and success/failure logging sample rates.
- **Tags**: View, add, and remove resource tags.

**Matching CLI Command (Get Topic Attributes)**:
```bash
aws sns get-topic-attributes \
  --topic-arn arn:aws:sns:us-east-1:000000000000:tutorial-orders \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 4. Publish Message (`/sns/topics/[topicArn]/publish`)
- Message Subject: Optional string subject.
- Message Body: Toggle between identical payload for all protocols or custom payload format.
- FIFO Parameters: Message Group ID and Message Deduplication ID (for FIFO topics).
- Message Attributes: Add key-value pairs (String, Number, Binary).
- Live character and byte counter.

**Matching CLI Command (Publish to Standard Topic)**:
```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:000000000000:tutorial-orders \
  --subject "Order Confirmed" \
  --message '{"orderId":"1001","amount":49.99,"status":"COMPLETED"}' \
  --message-attributes '{"store":{"DataType":"String","StringValue":"online"}}' \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Publish to FIFO Topic)**:
```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:000000000000:inventory-events.fifo \
  --message '{"sku":"ITEM-123","delta":-1}' \
  --message-group-id "warehouse-1" \
  --message-deduplication-id "tx-20261121-001" \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 5. Create Subscription (`/sns/subscriptions/create`)
- Topic ARN: Select from live account topics or input custom ARN.
- Protocol: Select **Amazon SQS**, **AWS Lambda**, **Email**, **HTTPS**, **HTTP**, or **SMS**.
- Endpoint: Select live SQS queue or Lambda function from your account or enter an endpoint address.
- Subscription Filter Policy: Define optional JSON filter rules.
- Redrive Policy (Dead-Letter Queue): Select an SQS dead-letter queue to capture undeliverable messages.

**Matching CLI Command (Subscribe SQS Queue)**:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:000000000000:tutorial-orders \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:000000000000:billing-queue \
  --return-subscription-arn \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 6. Subscriptions Inventory (`/sns/subscriptions`)
- Table of all subscriptions across topics in the Region.
- Filter by Subscription ARN or Topic ARN.
- Select and Unsubscribe with confirmation modal.

**Matching CLI Command (List Subscriptions)**:
```bash
aws sns list-subscriptions \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

---

## 4. Hands-On Beginner Exercises

### Exercise 1: Create a Standard Topic and Verify Inventory
1. In the console, navigate to **SNS** -> **Topics** -> click **Create topic**.
2. Select **Standard** as the Type.
3. For Name, enter `my-alerts`.
4. Click **Create topic**.
5. Observe the Details page displays the generated Topic ARN `arn:aws:sns:us-east-1:000000000000:my-alerts`.
6. Return to `/sns/topics` and verify the summary metric card for **Total topics** increments by 1.

### Exercise 2: Subscribe an SQS Queue for Pub/Sub Fanout
1. Navigate to **SQS** (`/sqs`) and create a standard queue named `alerts-worker`.
2. Navigate to **SNS** -> **Subscriptions** -> click **Create subscription**.
3. In **Topic ARN**, select `my-alerts`.
4. In **Protocol**, choose **Amazon SQS**.
5. In **Endpoint**, select `alerts-worker`.
6. Click **Create subscription**.
7. Navigate to `/sqs/alerts-worker` and inspect the **SNS subscriptions** tab to verify the link is active.

### Exercise 3: Publish a Message and Verify Receipt
1. From the `my-alerts` topic page, click **Publish message**.
2. Enter Subject: `System Warning`.
3. In Message body, enter: `{"service":"auth","level":"WARN","message":"Rate limit threshold reached"}`.
4. Click **Publish message**. Note the returned **Message ID**.
5. Navigate to `/sqs/alerts-worker` and verify messages available has incremented.

### Exercise 4: Create a Strict FIFO Topic
1. In **SNS** -> **Topics**, click **Create topic**.
2. Select **FIFO**. Notice the name field enforces the `.fifo` suffix.
3. Enter `payments.fifo`.
4. Check **Content-based deduplication**.
5. Click **Create topic**.
6. Publish a message with Message Group ID `customer-42` and verify the message is accepted.

---

## 5. Limitations and Emulator Behavior

- **External Endpoints (Email & SMS)**: In the local offline emulator, subscriptions to Email and SMS protocols register successfully and generate valid subscription ARNs, but real emails or cellular SMS messages are not dispatched to external carriers.
- **Cross-Account Subscriptions**: The emulator runs in a single-tenant local account context (`000000000000`). Multi-account access policy evaluation is simulated.
- **Throughput Throttling**: Standard AWS TPS rate limits do not apply to the local emulator environment.

---

## 6. Common Errors and Troubleshooting

| Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `InvalidParameter: Topic name must end with .fifo for FIFO topics` | Topic name missing `.fifo` suffix when type is FIFO | Append `.fifo` to the topic name (e.g., `orders.fifo`). |
| `NotFoundException: Topic does not exist` | Publishing or subscribing to a deleted or mistyped topic ARN | Verify the topic ARN in the Topics table before executing. |
| `InvalidParameter: MessageGroupId is required for FIFO topics` | Published to a FIFO topic without providing a Message Group ID | Provide a string value for Message Group ID (e.g., `group-1`). |
| `Endpoint does not exist` | Selected an SQS queue or Lambda function that was deleted | Create the required SQS queue or Lambda function first before subscribing. |
