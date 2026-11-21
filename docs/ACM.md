# AWS Certificate Manager (ACM) Guide

## 1. What is AWS Certificate Manager and When to Use It?

AWS Certificate Manager (ACM) is a managed cloud service that handles the complexity of provisioning, managing, deploying, and renewing Secure Sockets Layer/Transport Layer Security (SSL/TLS) certificates. It provides free public certificates for use with integrated AWS resources like Elastic Load Balancers, Amazon CloudFront distributions, and Amazon API Gateway endpoints. You should use ACM whenever your applications require HTTPS encryption in transit, custom domain security, or automated certificate lifecycle management without manual renewal errors. ACM eliminates the operational overhead of purchasing certificates from third-party certificate authorities, generating certificate signing requests (CSRs), and manually tracking 90-day or 365-day expiration dates.

---

## 2. Key Concepts

### Public Certificates
Free SSL/TLS certificates issued by the Amazon Trust Services certificate authority for public-facing internet domains. ACM handles automated renewal before expiration at no additional charge for integrated AWS services.
*Example*: A wildcard certificate requested for `*.example.com` to terminate HTTPS traffic on an Application Load Balancer.

### Private Certificates
Certificates issued by an internal private certificate authority managed through AWS Private CA for internal networks, VPCs, and microservices.
*Example*: An internal certificate issued for `service.internal.corp` to encrypt inter-service traffic between Kubernetes pods inside a VPC.

### Fully Qualified Domain Name (FQDN) & Subject Alternative Names (SANs)
The primary domain name (FQDN) is the main host name secured by the certificate, while Subject Alternative Names (SANs) allow a single certificate to protect additional distinct domains, subdomains, or wildcard patterns.
*Example*: A certificate with primary domain `example.com` and SANs `www.example.com`, `api.example.com`, and `staging.example.com`.

### DNS Validation
The recommended, automated domain ownership validation method in ACM. ACM generates a unique CNAME record (Name and Value) that you publish in your DNS provider (such as Amazon Route 53) to prove control of the domain.
*Example*: Adding a CNAME record `_676d4d7db7de.example.com` pointing to `_064a9f6aa1.acm-validations.aws.` into your Route 53 public hosted zone.

### Email Validation
An alternative validation method that sends automated verification emails to five standard administrative mailboxes (`admin@`, `administrator@`, `hostmaster@`, `postmaster@`, `webmaster@`) and domain contact addresses listed in WHOIS.
*Example*: Approving certificate issuance by clicking the confirmation link sent to `admin@example.com`.

### Certificate Transparency (CT) Logging
A public logging system that records SSL/TLS certificates issued by public CAs to detect mistakenly or maliciously issued certificates. ACM logs public certificates by default, and allows users to toggle CT logging preferences.
*Example*: Keeping CT logging enabled so your domain certificate appears on public transparency monitors like `crt.sh`.

### Key Algorithms
The cryptographic asymmetric key specification used for the certificate's key pair. ACM supports standard RSA keys (`RSA 2048`, `RSA 3072`, `RSA 4096`) and high-efficiency Elliptic Curve keys (`ECDSA P-256`, `ECDSA P-384`, `ECDSA P-521`).
*Example*: Selecting `RSA_2048` for maximum client compatibility across legacy web browsers and mobile devices.

### Imported Certificates
Certificates obtained from third-party commercial CAs (e.g. DigiCert, Let's Encrypt) or corporate internal CAs that are imported directly into ACM by pasting the PEM-encoded certificate body, private key, and optional CA bundle.
*Example*: Importing an existing wildcard certificate purchased from an external registrar alongside its unencrypted PEM private key.

### In-Use By Tracking
ACM automatically tracks all AWS resources actively associated with each certificate (such as CloudFront distributions, ALB HTTPS listeners, or API Gateway custom domain names) to prevent accidental certificate deletion.
*Example*: An ALB HTTPS listener ARN appearing in the `In use by` table of your production certificate.

---

## 3. Console Walkthrough & Working AWS CLI Commands

All commands below are tested and verified against the local emulator endpoint (`https://127.0.0.1:9297`).

### 3.1 Certificates Inventory Page (`/acm`)
- **What you see**: A full table listing all certificates in your account and Region, showing Domain name, Certificate ID, Type (`AMAZON_ISSUED` or `IMPORTED`), Status (`ISSUED`, `PENDING_VALIDATION`, `FAILED`), In use (`Yes` or `No`), Renewal eligibility, and Key algorithm.
- **Top Metric Cards**:
  - `Total certificates`: Total count of certificates.
  - `Issued`: Certificates currently active and valid.
  - `Pending validation`: Certificates awaiting DNS or email ownership verification.
  - `Failed / Expired`: Certificates requiring attention or re-requesting.
- **Action Buttons**:
  - `Request a certificate`: Launches the 2-step Request Certificate Wizard (`/acm/request`).
  - `Import a certificate`: Opens the certificate import form (`/acm/import`).
  - `Actions > View details`: Opens the selected certificate's details page.
  - `Actions > Delete`: Opens the deletion confirmation dialog.

#### Matching AWS CLI Commands:
```bash
# List all certificates in the current Region
aws acm list-certificates \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1

# Filter certificates by status (ISSUED, PENDING_VALIDATION, FAILED)
aws acm list-certificates \
  --certificate-statuses ISSUED PENDING_VALIDATION \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

---

### 3.2 Request Certificate Wizard (`/acm/request`)
- **Step 1 - Choose certificate type**:
  - `Request a public certificate`: Free public certificates issued by Amazon Trust Services for public internet domains.
  - `Request a private certificate`: Internal certificates signed by a private CA from AWS Private CA.
- **Step 2 - Request public certificate form**:
  - `Fully qualified domain name (FQDN)`: The primary domain name (e.g. `example.com`).
  - `Subject Alternative Names (SANs)`: Dynamic inputs to add subdomains or wildcard patterns (e.g. `*.example.com`, `api.example.com`).
  - `Validation method`:
    - `DNS validation` (Recommended): Fast, automated validation via CNAME records.
    - `Email validation`: Email verification links sent to domain administrators.
  - `Key algorithm`: Dropdown with `RSA 2048`, `RSA 3072`, `RSA 4096`, `ECDSA P-256`, `ECDSA P-384`, `ECDSA P-521`.
  - `Certificate transparency logging`: Checkbox enabling or disabling public log inclusion.
  - `Tags`: Key-value pairs attached at creation.

#### Matching AWS CLI Commands:
```bash
# Request a public certificate with DNS validation and RSA 2048
aws acm request-certificate \
  --domain-name app.example.com \
  --subject-alternative-names "*.app.example.com" \
  --validation-method DNS \
  --key-algorithm RSA_2048 \
  --options CertificateTransparencyLoggingPreference=ENABLED \
  --tags Key=Environment,Value=Production Key=Project,Value=WebApp \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

---

### 3.3 Import a Certificate Page (`/acm/import`)
- **Form Fields**:
  - `Certificate body`: PEM-encoded X.509 certificate (starts with `-----BEGIN CERTIFICATE-----`).
  - `Certificate private key`: Unencrypted PEM-encoded RSA or ECDSA private key (starts with `-----BEGIN RSA PRIVATE KEY-----` or `-----BEGIN PRIVATE KEY-----`).
  - `Certificate chain (optional)`: Intermediate and root CA certificates in PEM format.
  - `Tags (optional)`: Key-value metadata tags.

#### Matching AWS CLI Commands:
```bash
# Import a certificate and private key from local PEM files
aws acm import-certificate \
  --certificate fileb://cert.pem \
  --private-key fileb://key.pem \
  --certificate-chain fileb://chain.pem \
  --tags Key=Source,Value=ExternalCA \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

---

### 3.4 Certificate Details Page (`/acm/certificates/[certificateId]`)
- **Overview Card**:
  - Displays Certificate ARN, Status badge, Type, In use by count, Key algorithm, Serial number, Issuer, Created timestamp, Not before / Not after dates, and Renewal eligibility.
- **Domains & Validation Table**:
  - Lists each domain and SAN with its validation status.
  - Displays generated CNAME `Record name` and `Record value` with one-click copy buttons.
  - `Create records in Route 53`: Modal allowing users to select an active Route 53 hosted zone from the emulator and create the required CNAME records automatically.
  - `Resend validation email`: Triggers email resend for email-validated certificates.
- **Certificate Transparency Logging Card**:
  - Displays logging status and an `Edit` modal to toggle logging preferences between `ENABLED` and `DISABLED`.
- **Certificate Content Viewer**:
  - Displays PEM-encoded certificate body and certificate chain for imported certificates, with one-click copy buttons.
- **Tags Tab & Manager**:
  - Lists all attached tags and provides an interactive modal to add and remove tags.

#### Matching AWS CLI Commands:
```bash
# Describe certificate details
aws acm describe-certificate \
  --certificate-arn <CERTIFICATE_ARN> \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1

# Retrieve the PEM body and chain of an imported certificate
aws acm get-certificate \
  --certificate-arn <CERTIFICATE_ARN> \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1

# List tags on a certificate
aws acm list-tags-for-certificate \
  --certificate-arn <CERTIFICATE_ARN> \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1

# Add tags to a certificate
aws acm add-tags-to-certificate \
  --certificate-arn <CERTIFICATE_ARN> \
  --tags Key=Department,Value=Engineering \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1

# Remove tags from a certificate
aws acm remove-tags-from-certificate \
  --certificate-arn <CERTIFICATE_ARN> \
  --tags Key=Department \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1

# Delete a certificate
aws acm delete-certificate \
  --certificate-arn <CERTIFICATE_ARN> \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

---

### 3.5 AWS Private CA Page (`/acm/pca`)
- Provides the authentic console view for the AWS Private CA tab under ACM.
- Displays private certificate authority count, educational architecture overview, and quick links to request private certificates or return to public certificates.

---

## 4. Hands-on Exercises for Beginners

### Exercise 1: Request a Public SSL/TLS Certificate with DNS Validation
**Goal**: Request a public certificate for your domain and inspect the generated DNS validation records.
1. Open the console at `/acm` and click **Request a certificate**.
2. Keep **Request a public certificate** selected and click **Next**.
3. In **Fully qualified domain name**, enter `demo.learner-aws.com`.
4. Click **Add another name to this certificate** and enter `*.demo.learner-aws.com`.
5. Under **Validation method**, select **DNS validation - recommended**.
6. Under **Key algorithm**, select **RSA 2048**.
7. In **Tags**, enter Key `Environment` and Value `Development`.
8. Click **Request**.
- **Expected Result**: You are redirected to the certificates list showing `demo.learner-aws.com` in `PENDING_VALIDATION` status.

---

### Exercise 2: Import an Existing X.509 Certificate
**Goal**: Generate a self-signed certificate and import it directly into ACM to simulate third-party certificate usage.
1. Generate a test certificate and private key using OpenSSL:
   ```bash
   openssl req -x509 -newkey rsa:2048 -nodes \
     -keyout test_key.pem -out test_cert.pem -days 365 \
     -subj "/CN=test.internal.dev"
   ```
2. Navigate to `/acm/import` in your browser.
3. Paste the contents of `test_cert.pem` into the **Certificate body** box.
4. Paste the contents of `test_key.pem` into the **Certificate private key** box.
5. In **Tags**, add Key `Origin` and Value `OpenSSLTest`.
6. Click **Import certificate**.
- **Expected Result**: ACM imports the certificate, immediately marking its status as **ISSUED** and type as **IMPORTED**.

---

### Exercise 3: Inspect Certificate Details and Route 53 DNS Validation
**Goal**: View the validation options and DNS CNAME credentials for a certificate.
1. Navigate to `/acm` and click on the Certificate ID of your requested certificate (`demo.learner-aws.com`).
2. In the **Domains** section, review the **CNAME name** and **CNAME value** generated by ACM.
3. Click the copy icon next to **CNAME value** to verify the clipboard copy functionality.
4. If you have an active hosted zone configured in Route 53, click **Create records in Route 53**, choose the target zone from the dropdown, and confirm.
- **Expected Result**: The DNS record is automatically added to the Route 53 zone without manually typing hostnames.

---

### Exercise 4: Add and Remove Tags on a Certificate
**Goal**: Attach metadata tags to an existing certificate and remove them.
1. From the certificate detail page, scroll to the **Tags** section.
2. Click **Manage tags**.
3. Add a new tag with Key `CostCenter` and Value `1001`.
4. Click **Save changes**. The new tag appears immediately in the table.
5. Click **Manage tags** again, click the remove button next to `CostCenter`, and click **Save changes**.
- **Expected Result**: The tag is removed and the table updates dynamically.

---

### Exercise 5: Clean Up and Delete a Certificate
**Goal**: Safely delete an unneeded certificate.
1. Navigate back to `/acm`.
2. Select the checkbox or radio button next to `demo.learner-aws.com`.
3. Click **Actions > Delete** (or click **Delete** on the certificate details page).
4. Review the warning prompt and confirm the deletion.
- **Expected Result**: The certificate is deleted and removed from the certificates table.

---

## 5. Limitations & Emulator Differences

| Feature | Real AWS Behavior | Emulator Behavior | Reason |
| :--- | :--- | :--- | :--- |
| **Email Validation** | Sends verification emails to WHOIS and domain administrator email addresses. | Fails with `ADDITIONAL_VERIFICATION_REQUIRED`. | Local emulator environment does not have outbound SMTP or public email delivery configured. |
| **Public CA Issuance** | Amazon Trust Services polls public DNS for CNAME records and issues trusted public certificates within minutes. | Remains in `PENDING_VALIDATION` or marks `ADDITIONAL_VERIFICATION_REQUIRED`. | Local emulator cannot issue globally trusted X.509 certificates across public internet DNS registries. |
| **Imported Certificates** | Immediately transition to `ISSUED` upon successful PEM syntax and key matching. | Supported identically. | PEM validation and key pair consistency are verified locally. |
| **UpdateCertificateOptions** | Only permitted on Amazon-issued certificates in the `ISSUED` state. | Supported identically (`InvalidStateException` returned for imported certificates). | Matches exact AWS business logic. |
| **Route 53 CNAME Creation** | Adds CNAME record sets to Route 53 hosted zones. | Fully supported against local Route 53 service. | Integrates with local Route 53 client in `src/lib/aws.ts`. |
| **Private CA Issuance** | Issues private certificates signed by an active AWS Private CA. | Private CA inventory is supported; live CA signing requires Private CA infrastructure. | Emulated private CA returns configured CAs; requesting private certs requires an active CA ARN. |

---

## 6. Common Errors and How to Fix Them

### 1. `ValidationException: The certificate private key is invalid`
- **Cause**: The private key is either encrypted with a passphrase, contains carriage return formatting errors, or does not match the certificate's public key.
- **Fix**: Ensure the private key is decrypted (`openssl rsa -in key.pem -out unencrypted_key.pem`) and starts with `-----BEGIN RSA PRIVATE KEY-----` or `-----BEGIN PRIVATE KEY-----`.

### 2. `InvalidDomainValidationOptionsException`
- **Cause**: Requesting a certificate with domain validation options that specify a domain name not present in the FQDN or SANs list.
- **Fix**: Ensure each `ValidationDomain` exactly matches or is a superdomain of the corresponding FQDN or SAN.

### 3. `ResourceNotFoundException: Certificate does not exist`
- **Cause**: The requested Certificate ARN was deleted or belongs to a different AWS Region.
- **Fix**: Verify your active Region in the top navigation bar matches the Region where the certificate was requested.

### 4. `ResourceInUseException: Certificate is currently in use`
- **Cause**: Attempting to delete a certificate currently bound to an active CloudFront distribution, Application Load Balancer listener, or API Gateway custom domain.
- **Fix**: Disassociate the certificate from all AWS resources first. Check the **In use by** table on the certificate details page to locate active bindings.

### 5. `InvalidStateException: The UpdateCertificateOptions command is not permitted for imported certificates`
- **Cause**: Attempting to toggle Certificate Transparency Logging on an imported certificate.
- **Fix**: Certificate Transparency logging preferences can only be updated for Amazon-issued certificates.
