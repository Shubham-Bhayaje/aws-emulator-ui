# AWS Key Management Service (KMS) Guide

## 1. What is AWS KMS and When to Use It?

AWS Key Management Service (AWS KMS) makes it easy for you to create and manage cryptographic keys and control their use across a wide range of AWS services and in your applications. It provides a centralized, secure control point for encryption keys without requiring you to maintain physical hardware security modules. You should use AWS KMS whenever you need to protect sensitive application data at rest, such as database fields, storage objects, configuration secrets, or payment credentials. It also allows you to control exactly which IAM users and roles can use keys through granular resource-based key policies and audit all cryptographic requests.

---

## 2. Key Concepts

### Customer Managed Keys (CMKs)
KMS keys in your AWS account that you create, own, and manage. You have complete control over their key policies, IAM permissions, rotation schedules, aliases, tags, and deletion.
*Example*: A symmetric key named `alias/production-app-key` created by your DevOps team to encrypt application user databases.

### AWS Managed Keys
KMS keys created, managed, and used on your behalf by an AWS service that integrates with AWS KMS. They are free of monthly charges, and their key policies cannot be modified directly by users.
*Example*: `alias/aws/s3`, automatically used by Amazon S3 when default SSE-KMS encryption is enabled on a bucket.

### Symmetric vs Asymmetric Keys
- **Symmetric Keys**: Use a single 256-bit AES-GCM secret key for both encryption and decryption (`SYMMETRIC_DEFAULT`).
- **Asymmetric Keys**: Consist of a mathematically linked public/private key pair used for either digital signing and verification (`RSA_2048`, `ECC_NIST_P256`) or public-key encryption and decryption.
*Example*: An asymmetric RSA key pair where external clients use the public key to encrypt payloads that only your backend KMS key can decrypt.

### HMAC Keys
Symmetric keys of varying lengths (`HMAC_256`, `HMAC_384`, `HMAC_512`) used to generate and verify Hash-based Message Authentication Codes to prove data integrity and authenticity.
*Example*: A 256-bit HMAC key used to generate cryptographic authentication tokens for webhooks.

### Key Policy
A resource-based policy JSON document attached directly to a KMS key that defines who can administer and use the key. Without explicit permission in the key policy, even account administrators cannot access the key.
*Example*: A statement allowing the IAM role `arn:aws:iam::000000000000:role/AppBackendRole` to call `kms:Decrypt`.

### Key Rotation
The process of generating new cryptographic backing material for an existing KMS key once every 365 days. The key ID and ARN never change, and older material is preserved indefinitely to decrypt previously encrypted data.
*Example*: Enabling automatic key rotation so your compliance standards are satisfied every year without code or configuration changes.

### Envelope Encryption
A multi-tier cryptographic practice where data is encrypted using a unique, short-lived data key, and the data key itself is encrypted under a KMS root key.
*Example*: Calling `GenerateDataKey` to receive a 256-bit AES key to encrypt a 50 GB database backup locally, storing only the encrypted key blob alongside the backup.

---

## 3. Console Walkthrough & Working AWS CLI Commands

Every action below has been verified against the local emulator endpoint (`https://127.0.0.1:9297`).

### 3.1 Customer Managed Keys Page (`/kms` or `/kms/keys`)
- **What you see**: A table of all customer-managed keys showing their aliases, key IDs, statuses (`Enabled`, `Disabled`, `Pending deletion`), key types, key specs, and deletion dates.
- **Top Metrics**: Total Customer Managed Keys, Enabled Keys, Disabled Keys, and Pending Deletion counts.
- **Actions Menu**:
  - `Enable`: Enables a disabled key.
  - `Disable`: Disables an enabled key.
  - `Create alias`: Assigns an alias to the selected key.
  - `Schedule key deletion`: Enters a 7 to 30 day waiting period before permanent destruction.
  - `Cancel key deletion`: Restores a pending-deletion key to the Disabled state.
  - `Create key`: Navigates to the 5-step key creation wizard.

#### Matching AWS CLI Commands:
```bash
# List all keys in the account
aws --endpoint-url https://127.0.0.1:9297 kms list-keys

# List all aliases
aws --endpoint-url https://127.0.0.1:9297 kms list-aliases

# Describe key metadata
aws --endpoint-url https://127.0.0.1:9297 kms describe-key --key-id <KEY_ID>

# Disable a key
aws --endpoint-url https://127.0.0.1:9297 kms disable-key --key-id <KEY_ID>

# Enable a key
aws --endpoint-url https://127.0.0.1:9297 kms enable-key --key-id <KEY_ID>

# Schedule key deletion (7 days waiting window)
aws --endpoint-url https://127.0.0.1:9297 kms schedule-key-deletion --key-id <KEY_ID> --pending-window-in-days 7

# Cancel key deletion
aws --endpoint-url https://127.0.0.1:9297 kms cancel-key-deletion --key-id <KEY_ID>
```

---

### 3.2 AWS Managed Keys Page (`/kms/default-keys`)
- **What you see**: A read-only inventory of keys managed automatically by AWS services (e.g., `alias/aws/s3`, `alias/aws/ebs`, `alias/aws/dynamodb`).
- **Options**: Filter keys, refresh the list, and click on any key to inspect its metadata, algorithms, and default policy.

#### Matching AWS CLI Command:
```bash
# Filter aliases to view AWS managed keys
aws --endpoint-url https://127.0.0.1:9297 kms list-aliases --query "Aliases[?starts_with(AliasName, 'alias/aws/')]"
```

---

### 3.3 Create Key Wizard (`/kms/keys/create`)
A 5-step guided process replicating the real AWS console:
1. **Configure key**: Choose between Symmetric, Asymmetric (Sign/Verify or Encrypt/Decrypt), or HMAC key types and select the key spec (`SYMMETRIC_DEFAULT`, `RSA_2048`, `ECC_NIST_P256`, `HMAC_256`).
2. **Add labels**: Set a unique Alias (e.g., `alias/app-encryption-key`), an optional Description, and Key-Value resource tags.
3. **Define key administrative permissions**: Select IAM users and roles from the live emulator account to administer the key, and choose whether to allow deletion.
4. **Define key usage permissions**: Select IAM users and roles that can use the key for cryptographic operations, and optionally allow external AWS accounts.
5. **Review and edit key policy**: Review all configurations, inspect or customize the generated JSON policy document, and click Finish to create the key.

#### Matching AWS CLI Commands:
```bash
# Create a standard symmetric key
aws --endpoint-url https://127.0.0.1:9297 kms create-key \
  --description "Application production database key" \
  --key-usage ENCRYPT_DECRYPT

# Create an alias for the new key
aws --endpoint-url https://127.0.0.1:9297 kms create-alias \
  --alias-name "alias/app-production-key" \
  --target-key-id <KEY_ID>

# Create an asymmetric RSA signing key
aws --endpoint-url https://127.0.0.1:9297 kms create-key \
  --key-spec RSA_2048 \
  --key-usage SIGN_VERIFY \
  --description "Digital document signing key"
```

---

### 3.4 Key Details Page (`/kms/keys/[keyId]`)
- **General configuration**: Displays Key ID, ARN, Status, Key spec, Origin, Key manager, Creation date, and Description with an edit modal.
- **Key policy tab**: View and edit the resource-based policy JSON with instant validation and save.
- **Key rotation tab**: Displays automatic rotation status and provides a toggle button to enable or disable annual rotation.
- **Cryptographic operations (Playground) tab**:
  - Live interactive tool to test encrypting plaintext strings into Base64 ciphertext.
  - Live decryption of ciphertext back into original plaintext.
  - Generation of 256-bit or 128-bit data keys (`Plaintext` and `CiphertextBlob`).
- **Tags tab**: Inspect attached tags and open the Manage tags modal to add or delete tags.
- **Aliases tab**: View assigned aliases and create or delete secondary aliases.

#### Matching AWS CLI Commands:
```bash
# Get key policy
aws --endpoint-url https://127.0.0.1:9297 kms get-key-policy --key-id <KEY_ID> --policy-name default

# Update key policy
aws --endpoint-url https://127.0.0.1:9297 kms put-key-policy --key-id <KEY_ID> --policy-name default --policy '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"*"},"Action":"kms:*","Resource":"*"}]}'

# Check key rotation status
aws --endpoint-url https://127.0.0.1:9297 kms get-key-rotation-status --key-id <KEY_ID>

# Enable annual rotation
aws --endpoint-url https://127.0.0.1:9297 kms enable-key-rotation --key-id <KEY_ID>

# Disable annual rotation
aws --endpoint-url https://127.0.0.1:9297 kms disable-key-rotation --key-id <KEY_ID>

# Add resource tags
aws --endpoint-url https://127.0.0.1:9297 kms tag-resource --key-id <KEY_ID> --tags TagKey=Environment,TagValue=Production

# List resource tags
aws --endpoint-url https://127.0.0.1:9297 kms list-resource-tags --key-id <KEY_ID>

# Remove a tag
aws --endpoint-url https://127.0.0.1:9297 kms untag-resource --key-id <KEY_ID> --tag-keys Environment

# Live Encrypt test
aws --endpoint-url https://127.0.0.1:9297 kms encrypt \
  --key-id <KEY_ID> \
  --plaintext $(echo -n "Confidential secret" | base64) \
  --output text --query CiphertextBlob

# Live Decrypt test
aws --endpoint-url https://127.0.0.1:9297 kms decrypt \
  --ciphertext-blob <CIPHERTEXT_BLOB> \
  --output text --query Plaintext | base64 --decode

# Live GenerateDataKey test
aws --endpoint-url https://127.0.0.1:9297 kms generate-data-key \
  --key-id <KEY_ID> \
  --key-spec AES_256
```

---

### 3.5 Custom Key Stores (`/kms/custom-keystores`)
- **What you see**: Overview of custom key stores. In AWS, this allows connecting KMS to an AWS CloudHSM hardware cluster.
- **Emulator behavior**: Displays the list of custom key stores (`describe-custom-key-stores`). Since dedicated CloudHSM hardware is not present in the local emulator, clicking "Create custom key store" shows a clear banner explaining that hardware CloudHSM clusters are not supported by the emulator.

---

## 4. Hands-on Exercises for Beginners

### Exercise 1: Create a Customer Managed Key with an Alias and Tags
**Goal**: Create your first symmetric encryption key through the console.
1. Open the console at `/kms` and click **Create key**.
2. In **Step 1**, leave the default as **Symmetric** with `SYMMETRIC_DEFAULT` spec. Click **Next**.
3. In **Step 2**, enter Alias: `alias/dev-database-key` and Description: `Key for encrypting dev database`.
4. In the **Tags** section, add `Environment` = `Development` and click **Add tag**. Click **Next**.
5. In **Step 3**, select any IAM user/role (or leave default root), keep "Allow key administrators to delete this key" checked, and click **Next**.
6. In **Step 4**, select usage principals and click **Next**.
7. In **Step 5**, review the configuration and click **Finish**.
8. **Expected Result**: You are redirected to the key details page. The key state is `Enabled`, and the alias `alias/dev-database-key` is listed.

---

### Exercise 2: Test Live Encryption and Decryption in the Playground
**Goal**: Verify that your key performs real cryptographic transformations.
1. From the key details page of `alias/dev-database-key`, click the **Cryptographic operations (Playground)** tab.
2. In section **1. Encrypt plaintext data**, type: `MyTopSecretPassword123` into the plaintext box.
3. Click the **Encrypt** button.
4. **Expected Result**: A Base64-encoded `CiphertextBlob` is generated and displayed.
5. Copy the CiphertextBlob and paste it into section **2. Decrypt ciphertext blob**.
6. Click the **Decrypt** button.
7. **Expected Result**: The output displays `Decrypted plaintext: MyTopSecretPassword123`.

---

### Exercise 3: Enable Automatic Key Rotation
**Goal**: Turn on annual rotation for compliance.
1. Navigate to your key details page at `/kms/keys/[keyId]`.
2. Click the **Key rotation** tab.
3. Observe that the status is currently `Disabled`.
4. Click the **Enable rotation** button.
5. **Expected Result**: A success notification appears: `Key rotation enabled.`. The status badge changes to `Enabled` and displays the next rotation date in 365 days.

---

### Exercise 4: Schedule and Cancel Key Deletion
**Goal**: Experience the safety mechanism of the deletion waiting period.
1. Navigate to `/kms` and select the radio button next to your test key.
2. Click **Key actions** and choose **Schedule key deletion**.
3. Enter `7` days in the waiting period input, check the confirmation checkbox, and click **Schedule deletion**.
4. **Expected Result**: The key status changes to `Pending deletion` with a red/orange badge, and cryptographic operations are blocked.
5. While selected, click **Key actions** &gt; **Cancel key deletion** (or click the Cancel deletion button in the banner).
6. **Expected Result**: Deletion is canceled, and the key status safely returns to `Disabled`. You can then click **Enable** to restore it to service.
