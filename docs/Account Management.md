# AWS Account Management User Guide and Reference

## 1. What is AWS Account Management?

AWS Account Management provides centralized administrative governance for your AWS account identity, primary contact information, alternate contacts, and regional availability. As cloud architectures evolve, maintaining up-to-date account details ensures that critical billing notices, security advisories, and operational incident notifications reach the appropriate engineering and finance leads. You use AWS Account Management to manage the primary company address, configure specialized billing, operations, and security alternate contacts, and control which opt-in AWS Regions are accessible to your developers. It also enables account owners to safely review closure prerequisites and manage account lifecycle status.

---

## 2. Key Concepts

### Account Identifier & Name
Every AWS account is uniquely identified by a 12-digit number (e.g., `000000000000`) and an editable account display name that helps teams recognize the account across console interfaces and AWS Organizations.
- *Example*: Naming account `000000000000` as `Production-Workloads` makes it instantly identifiable in multi-account environments.

### Primary Contact Information
The physical address, primary phone number, and company name registered to the account owner used as the primary legal and administrative contact for AWS communications.
- *Example*: A corporate headquarters address in Seattle, WA with a verified phone number registered to the company platform owner.

### Alternate Contacts
Specialized contact records configured to route specific categories of AWS notifications to team leads rather than the root account owner. The three supported types are:
- **Billing**: Receives invoice notices, payment alerts, and billing threshold advisories.
- **Operations**: Receives operational incident reports, scheduled maintenance warnings, and service interruption notices.
- **Security**: Receives security incident notifications, compromise alerts, and vulnerability advisories.
- *Example*: Configuring `security-team@example.com` as the Security alternate contact ensures security alerts bypass general administrative inboxes and reach the SOC immediately.

### Opt-in AWS Regions
Newer AWS Regions (such as `af-south-1` in South Africa or `eu-south-2` in Spain) that are disabled by default to minimize accidental resource deployment and reduce compliance attack surface. Accounts can opt in to enable them as needed.
- *Example*: Enabling `af-south-1` allows launching EC2 instances and creating S3 buckets in Cape Town, South Africa.

### Account Closure & Post-Closure Period
The formal procedure of terminating an AWS account. When closed, all resources across all Regions are immediately terminated. A 90-day post-closure period begins, during which the account can be reopened via AWS Support before permanent and irreversible data deletion.
- *Example*: Closing an experimental sandbox account after project completion requires acknowledging resource deletion and confirming with the 12-digit account ID.

---

## 3. Console Walkthrough & Matching AWS CLI Commands

All commands below run against the local emulator endpoint (`https://127.0.0.1:9297`) using emulator credentials (`~/.aws/emulator/9297/emulator_credentials`) and CA bundle (`~/.aws/emulator/9297/ca.pem`).

### A. Account Information (`/account`)
- **Console Action**: Navigate to `/account` to view the Account ID, status (`Active`), creation date, and display name. Click **Edit account name** to change the name.
- **Matching CLI Commands**:
```bash
# View account information
aws account get-account-information \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Update account display name
aws account put-account-name \
  --account-name "Production-Workloads" \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### B. Primary Contact Information (`/account/contact`)
- **Console Action**: Navigate to `/account/contact` to update physical address, phone number, city, postal code, and website URL.
- **Matching CLI Commands**:
```bash
# Get current primary contact details
aws account get-contact-information \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Update primary contact information
aws account put-contact-information \
  --contact-information '{"FullName":"DevOps Lead","AddressLine1":"100 Cloud Blvd","City":"Seattle","StateOrRegion":"WA","PostalCode":"98101","CountryCode":"US","PhoneNumber":"+12065550100"}' \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### C. Alternate Contacts (`/account/alternate-contacts`)
- **Console Action**: Configure or edit Billing, Operations, and Security alternate contacts.
- **Matching CLI Commands**:
```bash
# Set or update a Security alternate contact
aws account put-alternate-contact \
  --alternate-contact-type SECURITY \
  --name "Security Lead" \
  --title "CISO" \
  --email-address "security@example.com" \
  --phone-number "+12065550199" \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# View an alternate contact
aws account get-alternate-contact \
  --alternate-contact-type SECURITY \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Delete an alternate contact
aws account delete-alternate-contact \
  --alternate-contact-type SECURITY \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### D. AWS Regions Management (`/account/regions`)
- **Console Action**: Browse all 32 AWS Regions, filter by status, and enable or disable opt-in Regions.
- **Matching CLI Commands**:
```bash
# List all regions and their opt-in status
aws account list-regions \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Enable an opt-in region
aws account enable-region \
  --region-name af-south-1 \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Query region status
aws account get-region-opt-status \
  --region-name af-south-1 \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Disable an opt-in region
aws account disable-region \
  --region-name af-south-1 \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

## 4. Hands-on Exercises for Beginners

### Exercise 1: Update Account Display Name
- **Objective**: Assign an identifiable name to your local emulator account.
- **Steps**:
  1. Navigate to `/account`.
  2. In the **Account** card, click **Edit account name**.
  3. Enter `My-Learning-Cloud` and click **Save changes**.
- **Expected Result**: A green success banner appears and the Account overview card updates immediately to show `Account name: My-Learning-Cloud`.

### Exercise 2: Configure a Security Alternate Contact
- **Objective**: Ensure security notices bypass primary contact inboxes.
- **Steps**:
  1. Navigate to `/account/alternate-contacts`.
  2. Locate the **Security contact** card and click **Configure** (or **Edit**).
  3. Enter `Full name`: `Alex SecOps`, `Title`: `Security Incident Lead`, `Email address`: `secops@example.com`, and `Phone number`: `+1 206-555-0199`.
  4. Click **Save changes**.
- **Expected Result**: The Security card transitions from "Not configured" to displaying the full contact profile.

### Exercise 3: Enable and Disable an Opt-in AWS Region
- **Objective**: Manage regional availability for an opt-in Region.
- **Steps**:
  1. Navigate to `/account/regions`.
  2. In the search box, type `af-south-1`.
  3. Observe that its status is `Disabled`. Click **Enable**.
  4. In the confirmation dialog, review the regional data residency text and click **Enable region**.
  5. Confirm the status changes to `Enabled`.
  6. Click **Disable**, check the acknowledgment checkbox, and confirm.
- **Expected Result**: The Region transitions cleanly between `Disabled` and `Enabled`.

### Exercise 4: Update Primary Contact Address
- **Objective**: Modify the primary legal address of the account.
- **Steps**:
  1. Navigate to `/account/contact`.
  2. Change `Address line 1` to `410 Terry Ave N` and `City` to `Seattle`.
  3. Click **Save changes**.
- **Expected Result**: The contact form saves and redirecting to `/account` shows the updated physical address.

---

## 5. Limitations & Emulator Differences

| Feature | AWS Real Console | Local AWS Emulator | Why / Handling |
|:---|:---|:---|:---|
| Primary Account Info | Supported | Supported | `get-account-information` returns authentic AccountId and status. |
| Account Name Mutation | Supported | Supported | `put-account-name` updates the local database immediately. |
| Alternate Contacts CRUD | Supported | Supported | `get`, `put`, and `delete-alternate-contact` fully functional across all three contact types. |
| Regional Opt-in Control | Supported | Supported | `list-regions`, `enable-region`, and `disable-region` manage 32 regions with persistence. |
| Organization Email Delegation | Supported | Member Only | In AWS Organizations, management accounts delegate email updates to member accounts. The emulator enforces this constraint. |
| Real SMS OTP Dispatch | Supported | Mocked OTP | The local emulator simulates phone verification with standard verification workflows without real telecom SMS charges. |

---

## 6. Common Errors & Troubleshooting

### 1. `ResourceNotFoundException: No contact of the inputted alternate contact type found`
- **Cause**: Attempting to get an alternate contact before one has been created with `PutAlternateContact`.
- **Fix**: The console safely handles this exception as an empty/unconfigured state, allowing you to click **Configure** to add the contact.

### 2. `AccessDeniedException: The operation failed because the management account can't specify its own AccountId`
- **Cause**: Calling `GetPrimaryEmail` or `StartPrimaryEmailUpdate` on the organization management account itself.
- **Fix**: Primary email operations for the root account are handled through root credential settings; member account delegation APIs apply to child accounts.

### 3. `ValidationException: The one-time passcode submitted is not valid`
- **Cause**: Submitting an incorrect OTP during phone verification.
- **Fix**: Resend the verification code or check the emulator logs for the generated test code.
