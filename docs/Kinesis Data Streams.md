# Amazon Kinesis Data Streams

Amazon Kinesis Data Streams is a massively scalable, serverless, and durable real-time streaming data service. It continuously ingests hundreds of thousands of data records per second from distributed producers such as IoT telemetry sensors, web application clickstreams, server activity logs, and financial transactions. Learners and cloud architects use Kinesis Data Streams when applications require real-time processing and immediate reactivity, decoupling high-throughput producers from downstream consumer services like AWS Lambda, Amazon DynamoDB, and real-time dashboard analytics.

---

## Key Concepts

### Data Stream
A logical container for a sequence of data records. Each stream is identified by a unique name within an AWS Region and account, and maintains data retention from 24 hours up to 365 days.
*Example:* `telemetry-events-stream` capturing temperature and humidity readings across edge sensors.

### Shard
The base throughput unit of a Kinesis data stream in provisioned mode. A single open shard provides an ingestion capacity of 1 MB/sec (or 1,000 records/sec) write throughput and 2 MB/sec read throughput.
*Example:* A stream with 5 provisioned shards provides 5 MB/sec write capacity and 10 MB/sec read capacity.

### Partition Key
A string specified by the producer when calling `PutRecord`. Kinesis uses MD5 hashing on the partition key to map records to a specific shard within the 128-bit hash key range.
*Example:* Using device ID `sensor-device-42` as the partition key ensures all readings for that specific device arrive in order on the same shard.

### Data Record
The unit of data stored in a Kinesis stream, consisting of a sequence number, approximate arrival timestamp, partition key, and data payload (up to 1,024 KB in size).
*Example:* JSON payload `{"deviceId": "sensor-1", "temperature": 23.8, "status": "OK"}` base64-encoded in the record.

### Sequence Number
A unique, monotonically increasing identifier assigned to each record by Kinesis upon ingestion into a shard. Sequence numbers for the same partition key are strictly ordered.
*Example:* `491795277593136000000000000000000`

### Capacity Modes
- **On-demand**: Automatically scales shard capacity up and down to match incoming data volume. No shard management or capacity provisioning needed.
- **Provisioned**: You explicitly specify the number of shards. Ideal for predictable data traffic.
*Example:* Switching from Provisioned (1 shard) to On-demand during unpredictable product launch events.

### Retention Period
The duration that records remain available for reading after ingestion. The default retention is 24 hours and can be extended up to 8,760 hours (365 days).
*Example:* Extending retention to 72 hours so consumers can catch up during weekend maintenance windows.

### Enhanced Fan-Out (Consumers)
Allows consumers to register for dedicated 2 MB/sec read throughput per shard over HTTP/2 streaming connections, eliminating throughput contention between concurrent applications.
*Example:* Registering `fraud-detection-consumer` and `audit-archival-consumer` so both receive full shard bandwidth.

---

## Console Walkthrough & Matching AWS CLI Commands

### 1. Data Streams Inventory (`/kinesis/streams`)
Displays summary metrics across the Region (Total Data Streams, Open Shards, On-Demand Streams, Encrypted Streams), search filtering, and single-selection stream actions.

**List Streams Command:**
```bash
aws kinesis list-streams \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 2. Create Data Stream Wizard (`/kinesis/streams/create`)
Configure stream name, On-demand or Provisioned capacity mode with built-in shard estimator calculator, data retention period (24–8760 hours), server-side KMS encryption, and resource tags.

**Create Stream Command (Provisioned):**
```bash
aws kinesis create-stream \
  --stream-name my-telemetry-stream \
  --shard-count 2 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

**Create Stream Command (On-Demand):**
```bash
aws kinesis create-stream \
  --stream-name my-ondemand-stream \
  --stream-mode-details StreamMode=ON_DEMAND \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 3. Stream Details Overview (`/kinesis/streams/[streamName]`)
Inspect stream ARN, status badge, capacity settings, encryption details, active consumers, and tabs for Configuration, Shards, Data Viewer, Enhanced Fan-Out, Monitoring, and Tags.

**Describe Stream Summary Command:**
```bash
aws kinesis describe-stream-summary \
  --stream-name my-telemetry-stream \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

**Describe Stream Shards Command:**
```bash
aws kinesis list-shards \
  --stream-name my-telemetry-stream \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 4. Live Data Ingestion & Data Viewer (`/kinesis/streams/[streamName]` -> Data viewer tab)
Simulate live producer telemetry by inserting records with custom partition keys and payloads, and inspect ingested records by selecting a shard and iterator starting point (`TRIM_HORIZON`, `LATEST`, `AT_SEQUENCE_NUMBER`).

**Put Record Command:**
```bash
aws kinesis put-record \
  --stream-name my-telemetry-stream \
  --partition-key "device-01" \
  --data "eyJ0ZW1wIjogMjQuNSwgInVuaXQiOiAiQyJ9" \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

**Get Shard Iterator Command:**
```bash
ITERATOR=$(aws kinesis get-shard-iterator \
  --stream-name my-telemetry-stream \
  --shard-id shardId-000000000000 \
  --shard-iterator-type TRIM_HORIZON \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --query ShardIterator --output text)
```

**Get Records Command:**
```bash
aws kinesis get-records \
  --shard-iterator "$ITERATOR" \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 5. Stream Capacity & Resharding (`Edit capacity` modal)
Switch stream modes between `ON_DEMAND` and `PROVISIONED`, or re-scale provisioned open shards.

**Update Stream Mode Command:**
```bash
aws kinesis update-stream-mode \
  --stream-arn "arn:aws:kinesis:us-east-1:000000000000:stream/my-telemetry-stream" \
  --stream-mode-details StreamMode=ON_DEMAND \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

**Update Shard Count Command:**
```bash
aws kinesis update-shard-count \
  --stream-name my-telemetry-stream \
  --target-shard-count 4 \
  --scaling-type UNIFORM_SCALING \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 6. Retention Period Management (`Edit retention` modal)
Adjust data availability duration between 24 and 8,760 hours.

**Increase Retention Period Command:**
```bash
aws kinesis increase-stream-retention-period \
  --stream-name my-telemetry-stream \
  --retention-period-hours 48 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

**Decrease Retention Period Command:**
```bash
aws kinesis decrease-stream-retention-period \
  --stream-name my-telemetry-stream \
  --retention-period-hours 24 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 7. Server-Side Encryption (`Edit encryption` modal)
Enable or disable KMS server-side encryption with AWS managed or Customer managed keys.

**Start Stream Encryption Command:**
```bash
aws kinesis start-stream-encryption \
  --stream-name my-telemetry-stream \
  --encryption-type KMS \
  --key-id alias/aws/kinesis \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

**Stop Stream Encryption Command:**
```bash
aws kinesis stop-stream-encryption \
  --stream-name my-telemetry-stream \
  --encryption-type KMS \
  --key-id alias/aws/kinesis \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 8. Enhanced Fan-Out Consumers (`Enhanced fan-out` tab)
Register dedicated throughput consumers for low-latency streaming readers.

**Register Consumer Command:**
```bash
aws kinesis register-stream-consumer \
  --stream-arn "arn:aws:kinesis:us-east-1:000000000000:stream/my-telemetry-stream" \
  --consumer-name analytics-consumer \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

**List Stream Consumers Command:**
```bash
aws kinesis list-stream-consumers \
  --stream-arn "arn:aws:kinesis:us-east-1:000000000000:stream/my-telemetry-stream" \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

**Deregister Consumer Command:**
```bash
aws kinesis deregister-stream-consumer \
  --stream-arn "arn:aws:kinesis:us-east-1:000000000000:stream/my-telemetry-stream" \
  --consumer-name analytics-consumer \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 9. Delete Data Stream (`Delete` modal)
Permanently remove a stream and all unconsumed records.

**Delete Stream Command:**
```bash
aws kinesis delete-stream \
  --stream-name my-telemetry-stream \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

## Hands-on Exercises

### Exercise 1: Create a Provisioned Stream and Ingest Telemetry Records
1. Navigate to **Data streams** (`/kinesis/streams`) and click **Create data stream**.
2. Set **Data stream name** to `iot-sensors-stream`.
3. Under **Data stream capacity**, select **Provisioned** and set **Provisioned shards** to `2`.
4. Click **Create data stream**.
5. Once created, click on the **Data viewer** tab.
6. Under **Test data ingestion**, set **Partition key** to `sensor-01` and Payload to `{"temperature": 21.4, "humidity": 65}`.
7. Click **Put record**.
8. Under **Data viewer**, select `shardId-000000000000` with starting position `Trim horizon` and click **Get records**.
*Expected Result:* The ingested record appears in the table with its Sequence Number, Partition Key `sensor-01`, and decoded payload.

---

### Exercise 2: Switch Capacity Mode to On-Demand
1. Open the stream details page for `iot-sensors-stream`.
2. Click **Edit capacity** in the top action bar.
3. Select **On-demand** and click **Save changes**.
*Expected Result:* The stream overview card updates immediately to reflect `Capacity mode: On-demand`, and open shards displays `— (Auto-scaling)`.

---

### Exercise 3: Enable Server-Side Encryption with AWS KMS
1. On the stream details page, click **Edit encryption**.
2. Check **Enable server-side encryption with AWS KMS**.
3. Choose `(default) aws/kinesis` and click **Save changes**.
*Expected Result:* The stream overview card displays `Server-side encryption: AWS KMS` with `Key: alias/aws/kinesis`.

---

### Exercise 4: Register an Enhanced Fan-Out Consumer
1. On the stream details page, switch to the **Enhanced fan-out** tab.
2. Click **Register consumer**.
3. Enter consumer name `realtime-alerts-worker` and click **Register**.
*Expected Result:* `realtime-alerts-worker` appears in the consumers table with status `ACTIVE` and a dedicated consumer ARN.

---

### Exercise 5: Connect DynamoDB Table Changes to Kinesis
1. Open **Amazon DynamoDB** -> **Tables** -> `test-users` (`/dynamodb/tables/test-users`).
2. Switch to the **Exports and streams** tab.
3. In the **Amazon Kinesis data stream destination** card, click **Manage streaming to Kinesis**.
4. Select `iot-sensors-stream` from the destination dropdown and click **Turn on stream**.
*Expected Result:* The card updates with status badge `Active`, confirming that mutations in the DynamoDB table are continuously forwarded to Kinesis.

---

## Limitations in the Emulator

1. **Auto-scaling Shard Splitting / Merging Latency**: In real AWS, resharding a provisioned stream (`UpdateShardCount`) transitions existing parent shards to `CLOSED` and spawns adjacent children shards over several minutes. In the local emulator, shard count updates take effect immediately without multi-minute transition delays.
2. **Kinesis Producer Library (KPL) Aggregation**: The emulator supports standard Kinesis `PutRecord` and `PutRecords` operations. Advanced KPL client aggregation formats (protocol buffers) must be decoded by client-side consumers before viewing.
3. **CloudWatch Metrics Telemetry**: Shard-level telemetry metrics are configured via `enable-enhanced-monitoring`. Metrics graph visualizers will display live telemetry curves once Amazon CloudWatch is fully integrated.

---

## Common Errors & Troubleshooting

### 1. `ResourceNotFoundException: Stream [name] under account [acc] not found`
- **Cause**: The specified stream name does not exist in the current Region or was deleted.
- **Fix**: Check `aws kinesis list-streams` to verify the exact stream name and spelling.

### 2. `InvalidArgumentException: Minimum retention period is 24 hours`
- **Cause**: Attempted to set retention period hours below the minimum 24-hour limit.
- **Fix**: Specify an integer between 24 and 8760 hours (up to 365 days).

### 3. `ValidationException: 1 validation error detected: Value at 'shardCount' failed to satisfy constraint`
- **Cause**: Shard count in provisioned mode was set to 0 or negative.
- **Fix**: Shard count must be at least 1 open shard.

---

## Dependencies

| Dependency | Purpose | Documentation |
|---|---|---|
| **AWS KMS** | Data encryption at rest with AWS managed or Customer keys | [KMS Documentation](KMS.md) |
| **Amazon DynamoDB** | Kinesis streaming destination replicating item changes | [DynamoDB Documentation](DynamoDB.md) |
| **AWS IAM** | Resource policies and consumer execution identities | [IAM Documentation](IAM.md) |
| **AWS Lambda** | Real-time event-driven record processing | [Lambda Documentation](Lambda.md) |
| **Amazon CloudWatch** | Enhanced shard-level monitoring and alarm metrics | Backlog item |
| **Amazon Data Firehose** | Continuous streaming data loading into S3 and analytics | Backlog item |
