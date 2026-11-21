# AWS Secrets Manager Guide

## 1. What is AWS Secrets Manager and When to Use It?

AWS Secrets Manager is a secure credential management service that enables you to store, rotate, retrieve, audit, and manage sensitive application secrets such as database credentials, API access tokens, OAuth keys, and connection strings throughout their lifecycles. It encrypts secret data at rest using AWS Key Management Service (AWS KMS) and removes hardcoded secrets from source code, configuration files, and container definitions. You should use Secrets Manager whenever your applications connect to databases, external SaaS APIs, or microservices and need programmatic access to credentials without exposing plaintext secrets in source code or version control. Additionally, Secrets Manager provides automated credential rotation workflows with AWS Lambda, ensuring credentials are periodically updated without application downtime.

---

## 2. Key Concepts

### Secrets
A secure vault entry containing metadata (name, description, ARN, encryption key, tags) and an encrypted secret payload (either a structured JSON string or arbitrary plaintext).
*Example*: A secret named `production/mysql/app-user` containing host, port, username, and password.

### Secret Value (Key/Value vs Plaintext)
The confidential payload protected by Secrets Manager. Secrets Manager accepts structured JSON key/value pairs (rendered into editable grids in the console) or raw plaintext strings (such as private certificates, RSA keys, or API tokens).
*Example*: A key/value secret containing `{"api_key": "live_sk_948274928"}`.

### Versions and Staging Labels
Every time a secret value is modified, Secrets Manager generates an immutable new version identified by a Version ID UUID. Secrets Manager manages versions using staging labels:
- `AWSCURRENT`: The active version returned by default when calling `GetSecretValue`.
- `AWSPREVIOUS`: The previous version, retained to support rollbacks if rotation fails.
*Example*: Version `6edf65a8` labeled with `AWSCURRENT` and version `f581d0bc` labeled with `AWSPREVIOUS`.

### Encryption at Rest (AWS KMS)
Every secret value is encrypted using an envelope encryption key from AWS KMS before being persisted to disk. You can use the default AWS managed key (`aws/secretsmanager`) or a customer managed key created in AWS KMS for fine-grained key policies and auditing.
*Example*: Encrypting application secrets using a customer managed key with alias `alias/production-secrets-key`.

### Automated Rotation
The capability to periodically change secret values on a predefined schedule (e.g. every 30 days) using an AWS Lambda rotation function that updates both the database/service and the secret in Secrets Manager.
*Example*: Automatically rotating a database admin password every 30 days using a Lambda function without restarting application instances.

### Resource-based Policies
JSON policy documents attached directly to a secret that specify which IAM identities (including roles from other AWS accounts) can perform actions like `GetSecretValue` or `DescribeSecret`.
*Example*: Allowing an IAM role in an external analytics account to call `secretsmanager:GetSecretValue`.

### Deletion Lifecycle & Recovery Window
Secrets Manager uses a safety recovery window when deleting secrets. By default, secrets are scheduled for deletion between 7 and 30 days into the future, during which they can be restored at any time. Secrets can also be deleted immediately and permanently with force deletion.
*Example*: Scheduling `staging/api-key` for deletion with a 7-day recovery window, and restoring it before the 7 days expire.

---

## 3. Console Walkthrough & Working AWS CLI Commands

All commands below are tested and verified against the local emulator endpoint (`https://127.0.0.1:9297`).

### 3.1 Secrets Inventory Page (`/secretsmanager`)
- **What you see**: A table of all secrets in your account and Region, showing Secret name, Description, Status (`Active` or `Scheduled for deletion in X days`), Rotation status, Last changed date, and Last accessed date.
- **Top Metric Cards**:
  - `Total active secrets`: Count of active secrets.
  - `Scheduled for deletion`: Count of secrets in recovery waiting period.
  - `Rotation enabled`: Count of secrets with automated rotation.
- **Controls**:
  - `Search secrets by name, description, or tag` input.
  - `Show secrets scheduled for deletion` checkbox.
  - `Store a new secret` primary button.
  - `Actions` dropdown (`View details`, `Delete secret`, `Restore secret`).

#### Matching AWS CLI Commands:
```bash
# List all secrets in the current Region
aws --endpoint-url https://127.0.0.1:9297 secretsmanager list-secrets

# List all secrets including those scheduled for deletion
aws --endpoint-url https://127.0.0.1:9297 secretsmanager list-secrets \
  --include-planned-deletion
```

---

### 3.2 Store a New Secret Wizard (`/secretsmanager/new`)
A 4-step wizard:
- **Step 1 - Choose secret type**: Select `Other type of secret`. Choose `Key/value` or `Plaintext`. Choose encryption key (`aws/secretsmanager` or customer managed KMS key).
- **Step 2 - Configure secret**: Enter `Secret name` (e.g. `production/db/credentials`), optional description, and metadata tags.
- **Step 3 - Configure rotation**: Choose whether to enable automatic rotation and configure schedule interval in days.
- **Step 4 - Review**: Review parameters and copy generated code samples in Node.js, Python, or AWS CLI. Click `Store`.

#### Matching AWS CLI Commands:
```bash
# Store a new secret with key/value JSON payload and tags
aws --endpoint-url https://127.0.0.1:9297 secretsmanager create-secret \
  --name "production/db/credentials" \
  --description "Database credentials for web app" \
  --secret-string '{"username":"dbadmin","password":"SuperSecretPassword123!"}' \
  --tags Key=Environment,Value=Production Key=Application,Value=Portal
```

---

### 3.3 Secret Details Page (`/secretsmanager/[secretName]`)
- **Secret details card**: ARN (with copy button), Description, KMS encryption key, timestamps (Created, Last changed, Last accessed).
- **Secret value card**:
  - Secret value is protected by default.
  - Click `Retrieve secret value` to decrypt and view payload.
  - Switch between `Key/value` view (with individual key/value copy buttons and mask toggles) and `Plaintext` view.
  - Click `Edit secret value` to create a new secret version via `PutSecretValue`.
- **Rotation configuration card**: View rotation status, interval, and Lambda ARN.
- **Resource permissions card**: View attached JSON resource policy, with `Edit permissions` and `Delete permissions` buttons.
- **Tags card**: Table of attached tags, with `Edit tags` button.
- **Version history table**: Lists all versions with Version ID, staging labels (`AWSCURRENT`, `AWSPREVIOUS`), and creation dates.
- **Sample code generator**: Working integration snippets for Node.js (AWS SDK v3), Python (boto3), and AWS CLI.

#### Matching AWS CLI Commands:
```bash
# Describe secret metadata
aws --endpoint-url https://127.0.0.1:9297 secretsmanager describe-secret \
  --secret-id "production/db/credentials"

# Retrieve decrypted secret value (AWSCURRENT)
aws --endpoint-url https://127.0.0.1:9297 secretsmanager get-secret-value \
  --secret-id "production/db/credentials"

# Update secret value (creates new version with AWSCURRENT label)
aws --endpoint-url https://127.0.0.1:9297 secretsmanager put-secret-value \
  --secret-id "production/db/credentials" \
  --secret-string '{"username":"dbadmin","password":"NewUpdatedPassword456!"}'

# Update secret description and metadata
aws --endpoint-url https://127.0.0.1:9297 secretsmanager update-secret \
  --secret-id "production/db/credentials" \
  --description "Updated production database credentials"

# Attach a resource policy
aws --endpoint-url https://127.0.0.1:9297 secretsmanager put-resource-policy \
  --secret-id "production/db/credentials" \
  --resource-policy '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"arn:aws:iam::000000000000:root"},"Action":"secretsmanager:GetSecretValue","Resource":"*"}]}'

# Delete resource policy
aws --endpoint-url https://127.0.0.1:9297 secretsmanager delete-resource-policy \
  --secret-id "production/db/credentials"

# Add tags
aws --endpoint-url https://127.0.0.1:9297 secretsmanager tag-resource \
  --secret-id "production/db/credentials" \
  --tags Key=CostCenter,Value=IT-101

# Remove tags
aws --endpoint-url https://127.0.0.1:9297 secretsmanager untag-resource \
  --secret-id "production/db/credentials" \
  --tag-keys CostCenter

# Schedule secret for deletion with 7-day recovery window
aws --endpoint-url https://127.0.0.1:9297 secretsmanager delete-secret \
  --secret-id "production/db/credentials" \
  --recovery-window-in-days 7

# Restore secret scheduled for deletion
aws --endpoint-url https://127.0.0.1:9297 secretsmanager restore-secret \
  --secret-id "production/db/credentials"

# Permanently delete secret without recovery window
aws --endpoint-url https://127.0.0.1:9297 secretsmanager delete-secret \
  --secret-id "production/db/credentials" \
  --force-delete-without-recovery
```

---

## 4. Hands-on Exercises for Beginners

### Exercise 1: Store a Database Credential Secret
**Goal**: Create a new secret using structured key/value pairs.
1. Navigate to `/secretsmanager` in the console.
2. Click **Store a new secret**.
3. Under **Secret type**, leave **Other type of secret** selected.
4. In the **Key/value** table, add the following rows:
   - Key: `host`, Value: `db.internal.local`
   - Key: `port`, Value: `5432`
   - Key: `username`, Value: `appuser`
   - Key: `password`, Value: `P@ssword123!`
5. Click **Next**.
6. For **Secret name**, enter `app/staging/db`.
7. For **Description**, enter `Staging database credentials`.
8. Add a tag with Key `Environment` and Value `Staging`.
9. Click **Next** through Step 3 (Rotation disabled).
10. Review your settings in Step 4 and click **Store**.
- **Expected Result**: You are redirected to the details page for `app/staging/db`.

---

### Exercise 2: Retrieve and Decrypt Secret Values
**Goal**: Safely reveal secret values and inspect individual keys.
1. Open the details page for `app/staging/db`.
2. Notice the **Secret value** card displays `Secret value is hidden for security`.
3. Click **Retrieve secret value**.
4. The key/value grid appears with passwords masked as dots (`••••••••••••`).
5. Click **Show** next to the `password` field to reveal `P@ssword123!`.
6. Click **Copy** to test clipboard copying.
7. Click the **Plaintext** tab to view the formatted JSON representation.
- **Expected Result**: The secret value is retrieved, decrypted, and displayed.

---

### Exercise 3: Update Secret Value to Create a New Version
**Goal**: Update the password and observe version staging label movement.
1. On the secret details page, click **Edit secret value**.
2. Change the `password` value to `NewPassword789!`.
3. Click **Save**.
4. Scroll to the **Secret versions** section.
- **Expected Result**: A new version appears with the `AWSCURRENT` label. The previous version moves to `AWSPREVIOUS`.

---

### Exercise 4: Attach a Resource Policy for Access Control
**Goal**: Define granular resource permissions.
1. On the secret details page, scroll to **Resource permissions**.
2. Click **Edit permissions**.
3. Paste the following policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": { "AWS": "arn:aws:iam::000000000000:root" },
         "Action": "secretsmanager:GetSecretValue",
         "Resource": "*"
       }
     ]
   }
   ```
4. Click **Save policy**.
- **Expected Result**: The policy is attached and displayed with JSON syntax highlighting.

---

### Exercise 5: Schedule Deletion and Restore
**Goal**: Experience the Secrets Manager safety deletion workflow.
1. From the secret details page, click **Delete secret**.
2. Select **Schedule deletion with recovery window** and enter `7` days.
3. Click **Delete secret**.
4. Notice the status badge updates to `Scheduled for deletion (7 days remaining)`.
5. Click **Restore secret** and confirm.
- **Expected Result**: The secret status immediately returns to `Active`.

---

## 5. Limitations & Emulator Differences

| Feature | Real AWS Behavior | Emulator Behavior | Reason |
| :--- | :--- | :--- | :--- |
| **Multi-Region Replication** | Replicates secrets and versions automatically across multiple global AWS Regions. | Operates in the single configured primary Region (`us-east-1`). | The local emulator runs as a single-region engine. |
| **Automated Rotation** | Invokes an AWS Lambda rotation function triggered by CloudWatch events to rotate credentials. | Supported via API; actual background rotation execution requires a deployed Lambda function. | Local environment does not execute recurring cron daemon tasks by default. |
| **Secret Deletion** | Retains deleted secrets for 7-30 days before permanent destruction. | Identical. Both scheduled recovery windows and immediate force deletion are fully supported. | Verified against emulator engine. |
| **KMS Encryption** | Encrypts secret payloads using AWS KMS customer managed or default keys. | Fully integrated with local KMS service. | Encrypts and decrypts via local KMS engine. |

---

## 6. Common Errors and How to Fix Them

### 1. `ResourceNotFoundException: Secrets Manager can't find the specified secret`
- **Cause**: The secret name was mistyped, deleted permanently, or created in a different Region.
- **Fix**: Check your spelling and ensure your active Region matches the Region where the secret was created.

### 2. `InvalidRequestException: You can't perform this operation on the secret because it was scheduled for deletion`
- **Cause**: Trying to retrieve or update the secret value of a secret in recovery deletion mode.
- **Fix**: Restore the secret first by clicking **Restore secret** in the console or running `aws secretsmanager restore-secret`.

### 3. `MalformedPolicyDocumentException: This resource policy contains a syntax error`
- **Cause**: The JSON policy has invalid syntax or does not conform to the IAM specification.
- **Fix**: Validate that the policy contains `Version: "2012-10-17"`, valid `Statement` arrays, valid `Effect`, `Principal`, `Action`, and `Resource`.

### 4. `ValidationException: 1 validation error detected`
- **Cause**: Secret name contains invalid characters (must be alphanumeric and `/_+=.@-`) or exceeds length limits.
- **Fix**: Ensure the secret name adheres to the regex pattern `^[a-zA-Z0-9/_+=.@-]+$`.
