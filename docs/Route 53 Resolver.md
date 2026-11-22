# Route 53 Resolver

Route 53 Resolver is Amazon's regional hybrid DNS service that provides recursive DNS resolution for Amazon VPCs and bridges cloud and on-premises name resolution. It allows resources running in private VPCs to resolve domain names hosted in your on-premises data centers, and enables corporate networks to resolve private Amazon Route 53 hosted zones over dedicated AWS Direct Connect or VPN connections. Resolver also provides centralized DNS query logging and DNS Firewall inspection to secure outbound VPC traffic against data exfiltration and domain spoofing.

---

## Key Concepts

- **Inbound Resolver Endpoint**: A set of Elastic Network Interfaces (ENIs) with private IP addresses in your VPC that listen for DNS queries forwarded from on-premises DNS servers. On-premises resolvers forward queries for AWS resources (such as private hosted zones or internal service endpoints) to these inbound IP addresses.
- **Outbound Resolver Endpoint**: A set of ENIs with private IP addresses in your VPC that forward DNS queries from EC2 instances and VPC workloads to DNS resolvers located in your on-premises network or third-party DNS infrastructure.
- **Resolver Rule**: A routing rule that specifies how DNS queries for specific domain names are processed. A `FORWARD` rule routes queries for a given domain name (such as `corp.example.com`) through an Outbound Endpoint to on-premises target IPs. A `SYSTEM` rule instructs Resolver to resolve the domain using the default internal VPC Resolver.
- **Rule Association**: Links a Resolver rule to one or more VPCs. Once associated, all DNS queries originating from that VPC matching the rule's domain name follow the rule's forwarding logic.
- **Query Logging Configuration**: Specifies a destination (Amazon CloudWatch Logs log group or Amazon S3 bucket) where DNS queries originating from associated VPCs are recorded for security auditing and compliance.
- **DNS Firewall**: A managed firewall layer within Route 53 Resolver that monitors and blocks outbound DNS queries to malicious or restricted domain names using AWS-managed threat lists and custom domain lists.

---

## Dependencies

| Dependency | Type | Where Used in Console | Built? | Link |
|---|---|---|---|---|
| Amazon VPC | REQUIRED | Host VPC for Resolver Endpoints, subnet selection, security groups, and VPC rule associations | Yes | [Amazon VPC](file:///c:/PROJECTS/AWS%20GUI/docs/VPC.md) |
| Amazon CloudWatch Logs | OPTIONAL | Destination log groups for Query Logging Configurations | Yes | [Amazon CloudWatch Logs](file:///c:/PROJECTS/AWS%20GUI/docs/CloudWatch%20Logs.md) |
| Amazon S3 | OPTIONAL | Destination S3 buckets for Query Logging Configurations | Yes | [Amazon S3](file:///c:/PROJECTS/AWS%20GUI/docs/S3.md) |
| AWS RAM (Resource Access Manager) | OPTIONAL | Sharing Resolver rules across AWS accounts in an organization | Yes | Native AWS RAM integration |
| Amazon Data Firehose | OPTIONAL | Streaming delivery destination for Query Logging Configurations | No | Option displayed disabled with message "Available after Amazon Data Firehose is built" |

---

## Console Walkthrough and Verified AWS CLI Commands

### 1. Inbound and Outbound Endpoints

Navigate to **Route 53 Resolver > Inbound and outbound endpoints**:
- Click **Create endpoint** to launch the wizard.
- Select endpoint direction (`Inbound` or `Outbound`).
- Choose the host VPC and security groups.
- Select protocols (`Do53` for standard DNS over UDP/TCP port 53, or `DoH` for DNS over HTTPS).
- Choose at least two subnets in different Availability Zones and assign IP addresses (automatically or custom IPv4).

#### Verified AWS CLI: List Endpoints
```bash
aws route53resolver list-resolver-endpoints \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

#### Verified AWS CLI: Create Inbound Endpoint
```bash
aws route53resolver create-resolver-endpoint \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl \
  --creator-request-id "inbound-ep-req-01" \
  --name "corporate-inbound-resolver" \
  --direction INBOUND \
  --security-group-ids "sg-12345678" \
  --ip-addresses SubnetId="subnet-11111111" SubnetId="subnet-22222222" \
  --protocols Do53
```

#### Verified AWS CLI: List Endpoint IP Addresses
```bash
aws route53resolver list-resolver-endpoint-ip-addresses \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl \
  --resolver-endpoint-id "rslvr-in-1234567890abcdef0"
```

---

### 2. Rules and VPC Associations

Navigate to **Route 53 Resolver > Rules**:
- Click **Create rule**.
- Specify a rule name, rule type (`Forward` or `System`), and domain name (e.g., `corp.internal.example.com`).
- For `Forward` rules, select an Outbound Resolver Endpoint and add target IPv4 resolver addresses with port `53`.
- Optionally select a VPC to associate immediately.

#### Verified AWS CLI: Create Conditional Forwarding Rule
```bash
aws route53resolver create-resolver-rule \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl \
  --creator-request-id "rule-req-corp-01" \
  --name "forward-to-corp-dns" \
  --rule-type FORWARD \
  --domain-name "corp.internal.example.com." \
  --resolver-endpoint-id "rslvr-out-1234567890abcdef0" \
  --target-ips Ip="192.168.10.5",Port=53 Ip="192.168.20.5",Port=53
```

#### Verified AWS CLI: Associate Rule with VPC
```bash
aws route53resolver associate-resolver-rule \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl \
  --resolver-rule-id "rslvr-rr-1234567890abcdef0" \
  --vpc-id "vpc-12345678" \
  --name "corp-rule-vpc-association"
```

#### Verified AWS CLI: Disassociate Rule from VPC
```bash
aws route53resolver disassociate-resolver-rule \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl \
  --resolver-rule-id "rslvr-rr-1234567890abcdef0" \
  --vpc-id "vpc-12345678"
```

---

### 3. Query Logging Configurations

Navigate to **Route 53 Resolver > Query logging**:
- Click **Configure query logging**.
- Specify a configuration name (e.g., `vpc-audit-dns-logging`).
- Select destination:
  - **CloudWatch Logs log group**: Choose an existing log group or provide its ARN.
  - **Amazon S3 bucket**: Choose an existing S3 bucket or provide its ARN.
  - **Amazon Data Firehose**: Displayed as disabled with message "Available after Amazon Data Firehose is built".
- Select VPCs to record DNS queries from.

#### Verified AWS CLI: Create Query Logging Configuration
```bash
aws route53resolver create-resolver-query-log-config \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl \
  --creator-request-id "qlog-req-01" \
  --name "vpc-audit-dns-logging" \
  --destination-arn "arn:aws:s3:::my-test-bucket-01"
```

#### Verified AWS CLI: Associate Query Logging Configuration
```bash
aws route53resolver associate-resolver-query-log-config \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl \
  --resolver-query-log-config-id "rqlc-1234567890abcdef0" \
  --resource-id "vpc-12345678"
```

---

### 4. DNS Firewall

Navigate to **Route 53 Resolver > DNS Firewall**:
- View **VPC configurations** showing fail-open status (`ENABLED` or `DISABLED`).
- View **Domain lists** showing AWS-managed threat domain lists:
  - `AWSManagedDomainsMalwareDomainList`
  - `AWSManagedDomainsBotnetCommandandControl`
  - `AWSManagedDomainsAggregateThreatList`
  - `AWSManagedDomainsAmazonThreatList`
- View **Rule groups** and associated firewall rules.

#### Verified AWS CLI: List Firewall Domain Lists
```bash
aws route53resolver list-firewall-domain-lists \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

---

## Beginner Hands-on Exercises

### Exercise 1: Create an Inbound Resolver Endpoint for Hybrid Resolution
1. Navigate to **Route 53 Resolver > Inbound and outbound endpoints** in the console.
2. Click **Create endpoint**.
3. Select **Inbound** direction and choose your VPC.
4. Select a security group that allows inbound UDP and TCP on port 53.
5. Add IP addresses across two subnets in different Availability Zones.
6. Click **Create endpoint**.
7. Observe status transitioning to `OPERATIONAL`. On the endpoint detail page, copy the allocated IPv4 addresses to configure your on-premises DNS conditional forwarder.

### Exercise 2: Configure Conditional DNS Forwarding with an Outbound Rule
1. Under **Inbound and outbound endpoints**, verify an Outbound Endpoint exists.
2. Navigate to **Rules** and click **Create rule**.
3. Enter rule name `forward-corp-lan` and domain name `internal.company.net`.
4. Select the Outbound Endpoint from Step 1.
5. In **Target IP addresses**, enter `10.0.100.10` port `53` and click **Add target IP** to add secondary target `10.0.200.10` port `53`.
6. Select your development VPC under **VPCs that use this rule**.
7. Click **Submit**. Verify the rule appears in the table with 1 associated VPC and 2 target IPs.

### Exercise 3: Enable Centralized DNS Query Logging to S3
1. Navigate to **Query logging** and click **Configure query logging**.
2. Enter configuration name `production-dns-query-audit`.
3. Select **Amazon S3 bucket** and choose an available bucket from the dropdown.
4. Select your production VPCs from the table.
5. Click **Configure query logging**.
6. Navigate into the configuration detail view to verify the associated VPCs list and target S3 bucket destination ARN.

---

## Limitations in Emulator

1. **Physical DNS Packet Routing**: The emulator simulates the AWS Route 53 Resolver control plane APIs (`List*`, `Create*`, `Get*`, `Associate*`, `Disassociate*`, `Delete*`). It does not run a physical BIND or Unbound DNS server daemon listening on physical host network interfaces.
2. **Amazon Data Firehose Streaming**: Kinesis Data Firehose streaming delivery is not yet implemented in the emulator. The destination option is rendered disabled in accordance with console standards.
3. **Multi-Account RAM Sharing**: Cross-account Resource Access Manager (RAM) rule sharing is mocked locally for single-account execution (`000000000000`).

---

## Common Errors and Fixes

- **Error: Minimum 2 IP Addresses Across Different Subnets**:
  - *Symptom*: Endpoint creation fails or validation triggers.
  - *Fix*: AWS Route 53 Resolver requires at least 2 IP addresses across different Availability Zones for high availability. Ensure you select two distinct subnets.
- **Error: Outbound Endpoint Required for Forward Rules**:
  - *Symptom*: Creating a FORWARD rule fails with a missing outbound endpoint message.
  - *Fix*: Conditional forwarding rules forward traffic through outbound ENIs. You must create an Outbound Resolver Endpoint before creating a FORWARD rule.
- **Error: Trailing Dot on Domain Name**:
  - *Symptom*: Domain lookup fails or validation error is reported.
  - *Fix*: FQDNs in DNS require a trailing dot. The console automatically appends a trailing dot (`.`) if omitted.
