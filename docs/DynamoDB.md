# Amazon DynamoDB

Amazon DynamoDB is a fully managed, serverless NoSQL database service designed to deliver single-digit millisecond performance at any scale. It supports both key-value and document data structures, allowing developers to build modern applications without provisioning, patching, or managing database servers. You should use Amazon DynamoDB when you need predictable low-latency response times for high-concurrency workloads, such as user profiles, session stores, gaming leaderboards, and shopping carts.

---

## 1. Key Concepts

### Tables, Items, and Attributes
- **Table**: A collection of data records, similar to a relational database table or MongoDB collection.
- **Item**: A single record in a table consisting of one or more attributes, analogous to a row in a relational database. Each item has a maximum size of 400 KB.
- **Attribute**: A fundamental data element within an item, similar to a field or column. Attributes can be scalar (String, Number, Binary, Boolean, Null) or complex (List, Map, Sets).
*Example*: An item in a `Users` table contains attributes `userId` (String), `email` (String), `age` (Number), and `preferences` (Map).

### Primary Keys: Partition Key and Sort Key
- **Partition Key (HASH)**: A mandatory single attribute that DynamoDB uses as an input to an internal hash function to determine physical storage partition placement.
- **Sort Key (RANGE)**: An optional second attribute that allows multiple items to share the same partition key while being sorted in physical storage order. Together, the partition key and sort key form a composite primary key.
*Example*: In a `ThreadComments` table, `threadId` is the partition key and `timestamp` is the sort key, allowing fast queries for all comments on a thread sorted by time.

### Read/Write Capacity Modes
- **On-demand**: Automatically scales read and write throughput up or down to accommodate workloads without capacity planning. You pay per request.
- **Provisioned**: You specify the exact Read Capacity Units (RCU) and Write Capacity Units (WCU) expected for your application to maintain predictable hourly costs.
*Example*: A new startup app with unpredictable traffic uses On-Demand mode; an established enterprise payroll service uses Provisioned mode set to 50 RCU and 50 WCU.

### Secondary Indexes: GSI and LSI
- **Global Secondary Index (GSI)**: An index with a partition key and an optional sort key that can be different from those on the base table, enabling queries on non-primary key attributes across the entire table.
- **Local Secondary Index (LSI)**: An index that shares the same partition key as the base table, but defines a different sort key.
*Example*: A `Orders` table with primary key `orderId` uses a GSI on `customerId` (partition key) and `orderDate` (sort key) to look up all orders for a customer.

### Time to Live (TTL)
An automated lifecycle mechanism that marks items for deletion by inspecting a designated attribute containing a Unix epoch timestamp (in seconds). Once the current time exceeds the timestamp, DynamoDB deletes the item automatically without consuming read or write throughput.
*Example*: A `Sessions` table with TTL attribute `expiresAt` set to 2 hours in the future.

### Point-in-Time Recovery (PITR)
Continuous automatic backups that protect your table data from accidental modifications or deletions. When enabled, you can restore your table to any point in time during the last 35 days down to the second.
*Example*: Restoring a corrupted table to its exact state at 14:02:15 UTC yesterday.

---

## 2. Dependencies

| Dependency | Required / Optional | Where Used in Console | Documentation Link |
| :--- | :--- | :--- | :--- |
| **AWS KMS** | Optional | Table creation & settings: Server-side encryption at rest using AWS managed or Customer managed keys | [AWS KMS Guide](KMS.md) |
| **Amazon S3** | Optional | Exports and streams tab: Export table data to Amazon S3 buckets | [Amazon S3 Guide](S3.md) |
| **AWS Lambda** | Optional | Exports and streams tab: Connect Lambda functions as event triggers for DynamoDB Streams | [Console Overview](README.md) |
| **AWS IAM** | Optional | Resource-based policies & fine-grained access control | [Console Overview](README.md) |
| **Amazon CloudWatch** | Optional | Monitor tab: Real-time operational graphs for RCU/WCU consumption and throttling | [Console Overview](README.md) |

---

## 3. Console Walkthrough and Tested AWS CLI Commands

All commands below are tested and verified against the local AWS Emulator endpoint (`https://127.0.0.1:9297`).

### 1. Dashboard (`/dynamodb`)
- Region overview metrics: Total tables, Active tables, Total items, Total storage.
- Quick navigation links to create tables and explore items.
- Recent tables preview table with status pills and shortcut links.

### 2. Tables Inventory (`/dynamodb/tables`)
- Global inventory table displaying table name, status (`ACTIVE`, `CREATING`, `UPDATING`), partition key, sort key, capacity mode, RCU/WCU, items count, and total size.
- Real-time name filter input.
- Radio selection to View details, Explore items, or Delete table.

**Matching CLI Command (List Tables)**:
```bash
aws dynamodb list-tables \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 3. Create Table (`/dynamodb/tables/create`)
- **Table name**: Enter a unique name (3-255 characters).
- **Partition key**: Name and attribute type (`String`, `Number`, `Binary`).
- **Sort key (optional)**: Name and attribute type.
- **Table settings**:
  - `Default settings`: On-demand capacity, standard table class, DynamoDB owned encryption.
  - `Customize settings`: Select On-demand or Provisioned (RCU/WCU), choose KMS Customer Managed Key from live dropdown, and enable deletion protection.
- **Tags**: Add key-value resource tags.

**Matching CLI Command (Create Table On-Demand)**:
```bash
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=email,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Create Table Provisioned)**:
```bash
aws dynamodb create-table \
  --table-name Products \
  --attribute-definitions AttributeName=sku,AttributeType=S \
  --key-schema AttributeName=sku,KeyType=HASH \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 4. Table Details (`/dynamodb/tables/[table]`)
Features 8 interactive tabs:
- **Overview**: Table ARN, status, creation date, partition/sort keys, item count, size, capacity mode, and encryption details.
- **Explore items**: Scan vs Query interface, attribute discovery table, Create item modal (Form & JSON views), Edit item, and Delete item.
- **Indexes**: Global Secondary Indexes (GSI) and Local Secondary Indexes (LSI) tables.
- **Monitor**: CloudWatch performance charts (Consumed RCU/WCU, throttles, latency).
- **Additional settings**: Time to Live (TTL) status and modal, Point-in-time recovery (PITR) toggle modal, Deletion protection toggle modal.
- **Backups**: On-demand backups inventory for the table, Create backup modal, and Restore table action.
- **Exports and streams**: DynamoDB Streams toggle, Lambda function trigger selector, and S3 export bucket selector.
- **Tags**: View, add, and remove resource tags.

**Matching CLI Command (Describe Table)**:
```bash
aws dynamodb describe-table \
  --table-name Users \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Put Item)**:
```bash
aws dynamodb put-item \
  --table-name Users \
  --item '{"userId":{"S":"u-101"},"email":{"S":"alex@example.com"},"name":{"S":"Alex"},"role":{"S":"Admin"}}' \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Get Item)**:
```bash
aws dynamodb get-item \
  --table-name Users \
  --key '{"userId":{"S":"u-101"},"email":{"S":"alex@example.com"}}' \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Scan Table)**:
```bash
aws dynamodb scan \
  --table-name Users \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Query Table)**:
```bash
aws dynamodb query \
  --table-name Users \
  --key-condition-expression "userId = :uid" \
  --expression-attribute-values '{":uid":{"S":"u-101"}}' \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Update Time to Live)**:
```bash
aws dynamodb update-time-to-live \
  --table-name Users \
  --time-to-live-specification "Enabled=true,AttributeName=ttl" \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Enable Point-in-Time Recovery)**:
```bash
aws dynamodb update-continuous-backups \
  --table-name Users \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Create Backup)**:
```bash
aws dynamodb create-backup \
  --table-name Users \
  --backup-name Users-Snapshot-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Delete Item)**:
```bash
aws dynamodb delete-item \
  --table-name Users \
  --key '{"userId":{"S":"u-101"},"email":{"S":"alex@example.com"}}' \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**Matching CLI Command (Delete Table)**:
```bash
aws dynamodb delete-table \
  --table-name Users \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 5. Explore Items Global Page (`/dynamodb/explore`)
- Universal item browser across all account tables.
- Table dropdown selector, Scan/Query mode toggle, and item creation/deletion.

### 6. Backups Inventory Page (`/dynamodb/backups`)
- Central repository of all on-demand backups across tables.
- Actions: Restore table from backup (provisions a new table) and Delete backup.

---

## 4. Hands-On Beginner Exercises

### Exercise 1: Create a Table with a Composite Primary Key
1. Navigate to **DynamoDB** -> **Tables** -> click **Create table**.
2. For Table name, enter `OrderHistory`.
3. For Partition key, enter `customerId` with type `String`.
4. Check **Add sort key**, and enter `orderId` with type `String`.
5. Under Table settings, select **Default settings** (On-demand).
6. Click **Create table**.
7. Verify the table status changes to `Active` and appears in the Tables inventory.

### Exercise 2: Insert and Query Items in Form and JSON Views
1. From `/dynamodb/tables`, click `OrderHistory` -> go to the **Explore items** tab.
2. Click **Create item**.
3. In Form view, enter `customerId` = `cust-42` and `orderId` = `ord-1001`.
4. Click **Add new attribute**, choose type `Number`, name `amount`, value `79.99`.
5. Switch to **JSON** view to inspect the synthesized JSON document, then click **Save item**.
6. Under operation type, select **Query**. Enter Partition key value `cust-42` and click **Run**.
7. Verify only matching items for `cust-42` are returned.

### Exercise 3: Enable TTL and Point-in-Time Recovery
1. In the `OrderHistory` table details, switch to the **Additional settings** tab.
2. In the **Time to Live (TTL)** card, click **Manage TTL**.
3. Check **Enable TTL**, enter attribute name `expiresAt`, and click **Save changes**.
4. In the **Point-in-time recovery (PITR)** card, click **Manage PITR**.
5. Check **Enable Point-in-time recovery** and click **Save changes**.
6. Verify both cards reflect status `ENABLED`.

### Exercise 4: Take an On-Demand Backup and Restore to a New Table
1. Switch to the **Backups** tab on `OrderHistory` -> click **Create backup**.
2. Enter Backup name `OrderHistory-v1-snapshot` and submit.
3. Once the backup status shows `AVAILABLE`, click **Restore**.
4. Enter target table name `OrderHistory-Restored` and confirm.
5. Navigate to `/dynamodb/tables` and observe the newly restored table with all items populated.

---

## 5. Limitations and Emulator Behavior

- **Global Tables Multi-Region Replication**: The local emulator runs in a single-Region context (`us-east-1`). Cross-Region replica syncing is simulated.
- **Physical Partition Splitting**: The emulator manages data in local memory/file storage, so automatic partition division at 10 GB thresholds or 1000 WCU / 3000 RCU limits does not create distributed physical hardware slices.
- **Continuous Backups Retention**: The 35-day PITR recovery window is maintained in local state; actual historical second-by-second rewinds are bounded by available snapshot records.

---

## 6. Common Errors and Troubleshooting

| Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `ResourceInUseException: Table is being updated` | Attempted to delete or modify a table while a capacity update was in progress | Wait a few seconds for the table status to return to `ACTIVE` before initiating another change. |
| `ValidationException: The number of attributes in key schema must match the number of attribute definitions` | Provided attribute definitions for attributes not used in primary key or GSI | Only define attributes in `AttributeDefinitions` that are part of the primary key or secondary indexes. |
| `ResourceNotFoundException: Cannot do operations on a non-existent table` | Table name misspelled or table was deleted | Check table name on the Tables page (`/dynamodb/tables`) before querying or modifying. |
| `ConditionalCheckFailedException` | An update or delete condition expression evaluated to false | Verify that the item attributes match the expected condition before sending updates. |
