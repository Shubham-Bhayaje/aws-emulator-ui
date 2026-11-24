# AWS Network Firewall

AWS Network Firewall is a stateful, managed network firewall and intrusion detection and prevention system (IDS/IPS) for Amazon Virtual Private Cloud (Amazon VPC). It allows cloud architects and security engineers to filter traffic at the perimeter of a VPC, inspecting layer 3 through layer 7 traffic, preventing outbound data exfiltration, and blocking malicious ingress attacks. Use AWS Network Firewall when you need advanced threat protection, Suricata-compatible IPS rule evaluation, outbound domain allowlisting/denylisting, or deep packet inspection beyond standard VPC Security Groups and Network ACLs.

---

## Key Concepts

- **Network Firewall**: The managed stateful firewall resource deployed into dedicated firewall subnets in an Amazon VPC. Each availability zone where the firewall is provisioned receives a dedicated Gateway Load Balancer VPC endpoint (`vpce-xxx`) that routes and inspects network packets.
  *Example*: A firewall named `Production-Edge-Firewall` deployed into subnet `subnet-00000000000000007` in `us-east-1a`.
- **Firewall Policy**: The reusable configuration profile defining the overall behavior of the firewall. It specifies default stateless actions (`aws:pass`, `aws:drop`, `aws:forward_to_sfe`), associates prioritized stateless rule groups, and connects stateful rule groups with default or strict rule ordering.
  *Example*: `App-Security-Policy` with default action `aws:forward_to_sfe` forwarding non-matching stateless traffic to stateful inspection.
- **Stateless Rule Group**: A collection of fast, order-independent 5-tuple packet filtering rules evaluated per-packet without tracking connection state. Each rule has a strict integer priority where lower numbers evaluate first.
  *Example*: A rule matching `TCP:443` outbound with priority `100` and action `pass`.
- **Stateful Rule Group**: A deep-packet inspection engine tracking full TCP/UDP connection state. Supports standard 5-tuple filtering, domain name allowlisting/denylisting (HTTP Host / TLS SNI headers), and Suricata compatible IPS rule syntax.
  *Example*: A domain list rule group configured to allow `.amazon.com` and `.aws.amazon.com` while denying all other outbound HTTP/HTTPS destinations.
- **Firewall Endpoint (VPCE)**: An interface VPC endpoint managed automatically by AWS Network Firewall in each specified subnet. Traffic is routed through the firewall endpoint by adding routes in VPC route tables pointing destination CIDRs (e.g., `0.0.0.0/0`) to the `vpce-xxx` ID.
  *Example*: Route table entry `0.0.0.0/0` -> `vpce-00000000000000096`.

---

## Console Walkthrough & AWS CLI Commands

All AWS CLI commands below have been tested directly against the AWS Emulator at `https://127.0.0.1:9297`.

### 1. Network Firewall Rule Groups (`/vpc/rule-groups`)

The Rule Groups console allows creating and managing both Stateless and Stateful rule groups.

#### Create a Stateful Domain List Rule Group
Navigate to **VPC > Rule groups > Create rule group**. Select **Stateful rule group**, enter a name and capacity units, select **Domain list**, choose header inspection (HTTP Host and TLS SNI), and enter target domain targets:

```bash
aws network-firewall create-rule-group \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --rule-group-name Corporate-Domain-Filter \
  --type STATEFUL \
  --capacity 100 \
  --rule-group '{
    "RulesSource": {
      "RulesSourceList": {
        "Targets": [".example.com", ".internal.corp"],
        "TargetTypes": ["TLS_SNI", "HTTP_HOST"],
        "GeneratedRulesType": "ALLOWLIST"
      }
    }
  }'
```

#### Create a Stateless 5-Tuple Rule Group
Navigate to **VPC > Rule groups > Create rule group**. Select **Stateless rule group**, enter capacity units, and add 5-tuple rules with protocol, source/destination CIDRs, ports, and actions:

```bash
aws network-firewall create-rule-group \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --rule-group-name Stateless-Web-Pass \
  --type STATELESS \
  --capacity 100 \
  --rule-group '{
    "RulesSource": {
      "StatelessRulesAndCustomActions": {
        "StatelessRules": [
          {
            "Priority": 1,
            "RuleDefinition": {
              "Actions": ["aws:pass"],
              "MatchAttributes": {
                "Protocols": [6],
                "Sources": [{"AddressDefinition": "10.0.0.0/16"}],
                "Destinations": [{"AddressDefinition": "0.0.0.0/0"}],
                "DestinationPorts": [{"FromPort": 443, "ToPort": 443}]
              }
            }
          }
        ]
      }
    }
  }'
```

#### List and Describe Rule Groups
```bash
# List all rule groups
aws network-firewall list-rule-groups \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Describe a specific rule group
aws network-firewall describe-rule-group \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --rule-group-name Corporate-Domain-Filter \
  --type STATEFUL
```

---

### 2. Firewall Policies (`/vpc/firewall-policies`)

Firewall policies assemble stateless and stateful rule groups into an executable protection policy.

#### Create a Firewall Policy
Navigate to **VPC > Firewall policies > Create firewall policy**. Configure default stateless actions and link associated rule groups:

```bash
aws network-firewall create-firewall-policy \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --firewall-policy-name Production-Edge-Policy \
  --description "Production security policy with stateful inspection" \
  --firewall-policy '{
    "StatelessDefaultActions": ["aws:forward_to_sfe"],
    "StatelessFragmentDefaultActions": ["aws:forward_to_sfe"],
    "StatefulRuleGroupReferences": [
      {
        "ResourceArn": "arn:aws:network-firewall:us-east-1:000000000000:stateful-rulegroup/Corporate-Domain-Filter"
      }
    ]
  }'
```

#### List and Describe Firewall Policies
```bash
# List policies
aws network-firewall list-firewall-policies \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Describe policy
aws network-firewall describe-firewall-policy \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --firewall-policy-name Production-Edge-Policy
```

---

### 3. Firewalls (`/vpc/firewalls`)

Firewalls deploy the policy into designated subnets inside an Amazon VPC.

#### Create a Network Firewall
Navigate to **VPC > Firewalls > Create firewall**. Select the target VPC, choose one subnet per Availability Zone, and pick an associated Firewall Policy:

```bash
aws network-firewall create-firewall \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --firewall-name Production-Firewall \
  --firewall-policy-arn "arn:aws:network-firewall:us-east-1:000000000000:firewall-policy/Production-Edge-Policy" \
  --vpc-id "vpc-00000000000000001" \
  --subnet-mappings '[{"SubnetId": "subnet-00000000000000007"}]' \
  --delete-protection \
  --description "Edge firewall for production VPC"
```

#### Describe Firewall and Inspect Endpoints
```bash
aws network-firewall describe-firewall \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --firewall-name Production-Firewall
```
*Note*: The output details the provisioned `SyncStates` containing the VPC Endpoint ID (`Attachment.EndpointId`, e.g. `vpce-00000000000000096`).

#### Configure Firewall Logging
Configure `ALERT` and `FLOW` logging destinations in Amazon CloudWatch Logs or Amazon S3:

```bash
aws network-firewall update-logging-configuration \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --firewall-name Production-Firewall \
  --logging-configuration '{
    "LogDestinationConfigs": [
      {
        "LogType": "ALERT",
        "LogDestinationType": "CloudWatchLogs",
        "LogDestination": {
          "logGroup": "/aws/network-firewall/alerts"
        }
      }
    ]
  }'
```

---

## Hands-On Exercises

### Exercise 1: Create a Domain Filtering Stateful Rule Group
**Goal**: Allow web egress only to designated cloud service endpoints while blocking all other domain traffic.
1. In the console, navigate to **VPC > Rule groups** and click **Create rule group**.
2. Select **Stateful rule group**, enter name `Allowed-SaaS-Domains`, and set capacity to `200`.
3. Select **Domain list**, choose **Allowlist**, and enter `.amazonaws.com`, `.github.com`.
4. Check both **TLS SNI** and **HTTP Host**.
5. Click **Create rule group**.
*Expected Result*: The rule group appears in the Rule Groups inventory table with `Status: READY` and `Type: STATEFUL`.

### Exercise 2: Create a Stateless Quick-Pass Rule Group
**Goal**: Fast-track local subnet diagnostic traffic without burdening stateful inspection engines.
1. Navigate to **VPC > Rule groups** and click **Create rule group**.
2. Select **Stateless rule group**, enter name `Allow-ICMP-Diagnostic`, and set capacity to `50`.
3. Add a rule: Priority `10`, Protocol `ICMP`, Source `10.0.0.0/16`, Destination `10.0.0.0/16`, Action `aws:pass`.
4. Click **Create rule group**.
*Expected Result*: The stateless rule group is saved with `Rule count: 1` and capacity allocated.

### Exercise 3: Assemble a Network Firewall Policy
**Goal**: Link stateless and stateful rule groups with default fallbacks.
1. Navigate to **VPC > Firewall policies** and click **Create firewall policy**.
2. Enter name `Perimeter-Firewall-Policy`.
3. Under **Stateless default actions**, set both default action and fragmented packet action to `Forward to stateful rule groups`.
4. Under **Stateful rule groups**, click **Add stateful rule groups** and select `Allowed-SaaS-Domains`.
5. Click **Create firewall policy**.
*Expected Result*: The policy is provisioned with 1 associated stateful rule group and default forwarding behavior.

### Exercise 4: Provision the Firewall and Route Traffic
**Goal**: Deploy the firewall into a VPC subnet and inspect the generated endpoint.
1. Navigate to **VPC > Firewalls** and click **Create firewall**.
2. Enter name `VPC-Edge-Firewall`.
3. Select an active VPC and choose a dedicated firewall subnet.
4. Select `Perimeter-Firewall-Policy`.
5. Click **Create firewall**.
6. View the firewall detail page, navigate to **Firewall details**, and locate the generated **VPC Endpoint ID** (`vpce-...`).
7. Navigate to **VPC > Route tables**, select a private route table, click **Add route**, choose destination `0.0.0.0/0`, select target type **Gateway Load Balancer Endpoint / Network Firewall Endpoint**, and enter the `vpce-...` ID.
*Expected Result*: Traffic targeting `0.0.0.0/0` in the subnet route table is directed through the Network Firewall endpoint.

---

## Limitations & Emulator Differences

- **Amazon Data Firehose Logging**: In the logging configuration modal, Amazon Data Firehose is disabled with the label `"Available after Amazon Data Firehose is built"`, as Firehose is not yet implemented in the mini console. CloudWatch Logs and Amazon S3 are fully supported live.
- **In-Memory Storage**: The AWS Emulator maintains all firewall, policy, and rule group state in memory. When the container stops or restarts, resources will be reset unless restored via initialization scripts.
- **Underlying Packet Processing**: The emulator validates, provisions, and returns standard AWS Network Firewall resource state, ARNs, and VPC endpoints (`vpce-xxx`). It acts as a management control-plane replica; simulated network packet traffic filtering depends on the local container virtualization backend.

---

## Common Errors & Troubleshooting

1. **`InvalidRequestException: Duplicate subnet mapping across same AZ`**
   - *Cause*: A firewall can only have one subnet mapping per Availability Zone.
   - *Fix*: Select subnets situated in distinct Availability Zones (e.g., `us-east-1a`, `us-east-1b`).

2. **`ResourceNotFoundException: Policy not found`**
   - *Cause*: The specified Firewall Policy ARN does not exist or has been deleted.
   - *Fix*: Ensure the firewall policy is created under `/vpc/firewall-policies` before attaching it to a firewall.

3. **`AccessDeniedException`**
   - *Cause*: The active IAM identity lacks `network-firewall:*` permissions.
   - *Fix*: Switch identity to the administrator account or attach `arn:aws:iam::aws:policy/NetworkFirewallFullAccess` to the active IAM user.

---

## Dependencies

### Required
- **[Amazon Virtual Private Cloud (VPC)](VPC.md)**: Required to deploy firewalls and provision VPC endpoints into dedicated subnets.

### Optional
- **[Amazon CloudWatch Logs](CloudWatch%20Logs.md)**: Optional destination for real-time `ALERT` and `FLOW` firewall logs.
- **[Amazon S3](S3.md)**: Optional destination for archived audit log delivery.
- **[AWS Key Management Service (KMS)](KMS.md)**: Optional customer managed key (CMK) encryption for firewalls, policies, and rule groups.
