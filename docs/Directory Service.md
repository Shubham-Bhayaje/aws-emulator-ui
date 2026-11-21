# AWS Directory Service Guide

AWS Directory Service provides multiple ways to set up and run Microsoft Active Directory (AD) alongside other AWS services. It allows you to manage users, groups, and domain policies, join EC2 instances to a centralized domain, and provide single sign-on (SSO) access to AWS applications. Use it when your organization requires enterprise identity management, Windows authentication protocols like Kerberos and NTLM, or federation with on-premises directories.

---

## Key Concepts

### 1. Simple AD
A standalone, managed directory powered by Samba 4 Active Directory compatible software. It provides basic Active Directory features such as user accounts, group memberships, domain-joining Linux and Windows instances, and Kerberos-based SSO.
- *Example*: A development environment named `corp.internal` hosting Linux and Windows servers where users log in with standard domain credentials without requiring Microsoft licensing.

### 2. AWS Managed Microsoft AD
Actual Microsoft Active Directory running on Windows Server domain controllers managed by AWS. It supports full enterprise AD features including trusts with on-premises domains, Group Policy Objects (GPOs), schema extensions, and multi-region replication.
- *Example*: A production deployment with two domain controllers distributed across two Availability Zones in VPC `vpc-12345678` for high availability.

### 3. AD Connector
A directory proxy that redirects directory requests to your existing on-premises Microsoft Active Directory without caching any credentials in the cloud.
- *Example*: Enabling corporate employees to log into the AWS Management Console and WorkSpaces using their existing on-premises credentials.

### 4. Snapshots & Backups
Point-in-time backups of directory data, schema, and domain configuration. Simple AD and AWS Managed Microsoft AD take automated daily snapshots and support manual snapshots on demand.
- *Example*: Taking a manual snapshot named `Pre-Schema-Update-Backup` before applying changes to directory organizational units.

### 5. Access URL & Single Sign-On (SSO)
A personalized portal URL (`https://<alias>.awsapps.com`) that allows directory users to log into AWS applications such as Amazon WorkSpaces, Amazon WorkDocs, and the AWS Management Console with their Active Directory credentials.
- *Example*: Setting an alias `mycorp-sso` to provide users the login URL `https://mycorp-sso.awsapps.com`.

### 6. Trust Relationships & Conditional Forwarders
Mechanisms that allow AWS Managed Microsoft AD to establish trust with external or on-premises Active Directory forests, and route DNS queries for external domains to on-premises DNS servers.
- *Example*: A one-way forest trust allowing users in `onprem.local` to access resources in the AWS cloud directory `cloud.local`.

---

## Console Walkthrough and Verified AWS CLI Commands

Every action below is fully implemented in this console and tested against the local AWS emulator.

### 1. View Directories Inventory (`/directoryservice`)
The main directory table displays all provisioned directories with Directory ID, Name, Type, Edition, Status, DNS IP addresses, VPC ID, and creation date. Metric summary cards show Total Directories, Active, Simple AD, and Managed AD counts.
- **Matching AWS CLI Command**:
```bash
aws ds describe-directories \
  --endpoint-url https://127.0.0.1:9297
```

### 2. Set Up a Directory (`/directoryservice/setup`)
A 5-step wizard to provision a new directory:
- **Step 1 - Directory Type**: Choose between AWS Managed Microsoft AD, Simple AD, or AD Connector.
- **Step 2 - Directory Details**: Configure directory DNS name (e.g., `corp.example.com`), NetBIOS name (`CORP`), administrator password, and description.
- **Step 3 - Network & VPC**: Select an existing VPC and two subnets located in different Availability Zones for redundant domain controller placement.
- **Step 4 - Tags**: Add Key/Value tags.
- **Step 5 - Review & Submit**: Review all configurations and create the directory.

- **Matching AWS CLI Command (Simple AD)**:
```bash
aws ds create-directory \
  --name corp.example.com \
  --password "AdminP@ssw0rd123!" \
  --size Small \
  --vpc-settings VpcId=vpc-12345678,SubnetIds=subnet-11111111,subnet-22222222 \
  --endpoint-url https://127.0.0.1:9297
```

- **Matching AWS CLI Command (AWS Managed Microsoft AD)**:
```bash
aws ds create-microsoft-ad \
  --name corp.enterprise.com \
  --password "CorpAdminP@ss1!" \
  --edition Standard \
  --vpc-settings VpcId=vpc-12345678,SubnetIds=subnet-11111111,subnet-22222222 \
  --endpoint-url https://127.0.0.1:9297
```

### 3. Directory Details & Tabs (`/directoryservice/directories/[directoryId]`)
Clicking any directory opens its details page with 5 tabs:
- **Directory details**: General properties, directory stage, DNS IP addresses, VPC and subnet settings, and administrative reset password action.
- **Snapshots**: List of manual and automated snapshots, with a "Create snapshot" action.
- **Application management**: Access URL alias configuration (`<alias>.awsapps.com`) and Single Sign-On (SSO) toggle.
- **Trusts & Forwarders**: Trust relationships with external forests and DNS conditional forwarders.
- **Tags**: Manage resource tags.

- **Describe Specific Directory**:
```bash
aws ds describe-directories \
  --directory-ids d-003ba5fe5a \
  --endpoint-url https://127.0.0.1:9297
```

### 4. Create and Manage Snapshots
Create point-in-time backup snapshots of your directory for disaster recovery.
- **Create Snapshot**:
```bash
aws ds create-snapshot \
  --directory-id d-003ba5fe5a \
  --name "ProdBackup2026" \
  --endpoint-url https://127.0.0.1:9297
```
- **List Snapshots**:
```bash
aws ds describe-snapshots \
  --directory-id d-003ba5fe5a \
  --endpoint-url https://127.0.0.1:9297
```
- **Delete Snapshot**:
```bash
aws ds delete-snapshot \
  --snapshot-id s-003ba5fe5a \
  --endpoint-url https://127.0.0.1:9297
```

### 5. Application Management (Access URL & Single Sign-On)
Configure an Access URL alias and enable SSO for AWS applications.
- **Create Alias**:
```bash
aws ds create-alias \
  --directory-id d-003ba5fe5a \
  --alias corpexample \
  --endpoint-url https://127.0.0.1:9297
```
- **Enable Single Sign-On**:
```bash
aws ds enable-sso \
  --directory-id d-003ba5fe5a \
  --endpoint-url https://127.0.0.1:9297
```
- **Disable Single Sign-On**:
```bash
aws ds disable-sso \
  --directory-id d-003ba5fe5a \
  --endpoint-url https://127.0.0.1:9297
```

### 6. Reset Administrative Password
Reset the password for the built-in domain administrator account (`Administrator`).
```bash
aws ds reset-user-password \
  --directory-id d-003ba5fe5a \
  --user-name "Administrator" \
  --new-password "NewSecureP@ss2026!" \
  --endpoint-url https://127.0.0.1:9297
```

### 7. Resource Tagging
Add and inspect tags associated with the directory.
- **List Tags**:
```bash
aws ds list-tags-for-resource \
  --resource-id d-003ba5fe5a \
  --endpoint-url https://127.0.0.1:9297
```
- **Add Tags**:
```bash
aws ds add-tags-to-resource \
  --resource-id d-003ba5fe5a \
  --tags Key=Environment,Value=Staging Key=Owner,Value=DevOps \
  --endpoint-url https://127.0.0.1:9297
```
- **Remove Tags**:
```bash
aws ds remove-tags-from-resource \
  --resource-id d-003ba5fe5a \
  --tag-keys Owner \
  --endpoint-url https://127.0.0.1:9297
```

### 8. Delete Directory
Safely de-provision an existing directory from your VPC.
```bash
aws ds delete-directory \
  --directory-id d-003ba5fe5a \
  --endpoint-url https://127.0.0.1:9297
```

---

## Hands-On Exercises for Beginners

### Exercise 1: Provision a Simple AD Directory
1. Navigate to **Directory Service** from the top search bar or **Security, Identity, & Compliance**.
2. Click **Set up directory**.
3. Select **Simple AD** and click **Next**.
4. Enter `dev.local` for the Directory DNS name and provide a strong password.
5. In Network & VPC, choose the default VPC and select subnets in two different Availability Zones.
6. Complete the wizard and verify the directory appears in the table with status `Active`.

### Exercise 2: Configure an Access URL and Enable Single Sign-On
1. From the Directories table, click the Directory ID of `dev.local`.
2. Select the **Application management** tab.
3. In the Access URL card, click **Create access URL**.
4. Enter a unique alias (e.g., `devlab-portal`) and confirm.
5. Once the Access URL `https://devlab-portal.awsapps.com` is configured, click **Enable Single Sign-On (SSO)**.
6. Verify the status updates to `Enabled`.

### Exercise 3: Create and Manage Directory Snapshots
1. On the directory details page, open the **Snapshots** tab.
2. Click **Create snapshot**.
3. Enter `Baseline-Backup` as the snapshot name and submit.
4. Verify the snapshot appears in the table with status `Completed`.
5. Select the snapshot and click **Actions > Delete snapshot** to test backup lifecycle management.

### Exercise 4: Reset Directory Administrator Password
1. On the directory details page, click the **Actions** dropdown in the top right.
2. Select **Reset user password**.
3. Enter `NewSecureP@ssw0rd99!` and submit.
4. Verify the success notification appears confirming the password was changed for `Administrator`.

---

## Emulator Limitations

1. **RestoreFromSnapshot**:
   - The emulator API returns `NotImplemented: operation RestoreFromSnapshot is scaffolded but not implemented in this emulator`. The option is visible in the console with clear guidance that restore operations require real AWS infrastructure.
2. **Real Domain Joining**:
   - Because the emulator runs inside a local sandbox rather than launching real Windows Server domain controllers or Kerberos KDC daemons, actual OS domain joins (`net ads join`) cannot contact the DNS IPs on port 389/88. All AWS API control plane operations (`create`, `describe`, `delete`, `snapshot`, `alias`, `sso`, `tags`) are completely operational.
3. **AD Connector Proxying**:
   - Setting up an AD Connector in the emulator creates the directory resource record, but does not open a live LDAP/RPC tunnel to on-premises domain controllers.

---

## Common Errors and Troubleshooting

1. **ClientException: An alias is required before enabling SSO**
   - *Cause*: Attempting to enable Single Sign-On before an Access URL alias has been created.
   - *Fix*: Create an alias first in the Application management tab (`aws ds create-alias`), then enable SSO.

2. **ValidationException: Subnets must be in different Availability Zones**
   - *Cause*: Selecting two subnets located in the same Availability Zone during directory creation.
   - *Fix*: Directory Service requires domain controllers in at least two distinct AZs. Select two subnets from different zones.

3. **ClientException: Directory already has an alias**
   - *Cause*: Calling `create-alias` when an alias has already been set for the directory.
   - *Fix*: Each directory supports a single access URL alias.
