# AWS Site-to-Site VPN

AWS Site-to-Site VPN enables you to securely connect your on-premises network or branch office to your Amazon Virtual Private Cloud (Amazon VPC) or AWS Transit Gateway. By creating an encrypted IPsec VPN connection between your customer gateway device and an AWS gateway, traffic flows securely over the public internet without traversing the unencrypted WAN. It is commonly used for hybrid cloud architectures, remote data center migration, off-site database replication, and enterprise disaster recovery. With dual redundant tunnels per connection, AWS Site-to-Site VPN delivers built-in high availability and automated failover.

---

## Key Concepts

### 1. Customer Gateway (CGW)
An AWS resource that represents the physical appliance or software application on your side of the Site-to-Site VPN connection (such as a Cisco ASA, Juniper SRX, Fortinet FortiGate, or strongSwan server).
- **Example**: A customer gateway registered with an external public IP address of `203.0.113.12` and a Border Gateway Protocol (BGP) Autonomous System Number (ASN) of `65000`.

### 2. Virtual Private Gateway (VGW)
The VPN concentrator on the Amazon VPC side of the connection. A virtual private gateway can be attached to exactly one VPC at a time and enables VPN traffic to reach the subnets inside that VPC.
- **Example**: A virtual private gateway `vgw-0123456789abcdef0` with an Amazon-side BGP ASN of `64512` attached to `vpc-0123456789abcdef0`.

### 3. Transit Gateway (TGW) Target
An alternative to a Virtual Private Gateway where the VPN connection terminates directly into an AWS Transit Gateway. This enables hub-and-spoke connectivity across dozens or hundreds of VPCs and on-premises sites through a single central hub.
- **Example**: A VPN connection terminating at `tgw-0123456789abcdef0`, routing traffic across three VPC attachments attached to the same transit gateway.

### 4. Site-to-Site VPN Connection
The logical encrypted link between your Customer Gateway and the AWS Virtual Private Gateway or Transit Gateway. Every AWS VPN connection automatically provisions two redundant IPsec tunnels across different Availability Zones.
- **Example**: A VPN connection `vpn-0123456789abcdef0` linking customer gateway `cgw-0123456789abcdef0` to virtual private gateway `vgw-0123456789abcdef0`.

### 5. IPsec Tunnels and Pre-Shared Keys
Each VPN connection consists of two active IPsec tunnels. Each tunnel has an outside AWS public IP address, an inside link-local `/30` IPv4 CIDR block (from `169.254.0.0/16`), and an encryption pre-shared key (PSK) used for IKE phase 1 authentication.
- **Example**: Tunnel 1 with outside endpoint `54.240.1.1`, inside CIDR `169.254.10.0/30`, and a 64-character pre-shared key.

### 6. Dynamic (BGP) vs Static Routing
- **Dynamic Routing**: Uses BGP to automatically advertise routes between your on-premises network and AWS. Recommended for automated failover between the two redundant tunnels.
- **Static Routing**: Explicit IP CIDR prefixes configured on the VPN connection when the customer gateway device does not support BGP.
- **Example**: Static route `192.168.10.0/24` added to VPN connection `vpn-0123456789abcdef0`.

---

## Console Walkthrough and CLI Commands

All AWS CLI commands below are verified to run against the local AWS Emulator running at `https://127.0.0.1:9297`.

```powershell
$env:AWS_ACCESS_KEY_ID="EMULATOR46BF1B4915F9"
$env:AWS_SECRET_ACCESS_KEY="74CCE172721E16381ABA11BA4F9DFD6A122EEBC4"
$env:AWS_DEFAULT_REGION="us-east-1"
```

### 1. Customer Gateways Page (`/vpc/customer-gateways`)
- View all registered customer gateways, their public IP addresses, BGP ASNs, and lifecycle states.
- Filter customer gateways by ID, Name tag, IP address, or ASN.
- Actions: Delete customer gateway.

**AWS CLI command**:
```bash
aws ec2 describe-customer-gateways \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 2. Create Customer Gateway (`/vpc/customer-gateways/create`)
- Specify Name tag, BGP ASN (e.g. `65000`), and static public IP address.
- Select routing type (BGP dynamic or static).
- Optional device name and certificate ARN for private certificate authentication.

**AWS CLI command**:
```bash
aws ec2 create-customer-gateway \
  --type ipsec.1 \
  --public-ip 198.51.100.1 \
  --bgp-asn 65000 \
  --tag-specifications "ResourceType=customer-gateway,Tags=[{Key=Name,Value=branch-office-router}]" \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 3. Virtual Private Gateways Page (`/vpc/virtual-private-gateways`)
- View all virtual private gateways, their attached VPC IDs, BGP ASNs, and states.
- Actions: Attach to VPC, Detach from VPC, Delete virtual private gateway.

**AWS CLI command**:
```bash
aws ec2 describe-vpn-gateways \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 4. Create Virtual Private Gateway (`/vpc/virtual-private-gateways/create`)
- Configure Name tag.
- Choose Amazon default ASN (`64512`) or enter a custom private ASN between `64512` and `65534` (or 32-bit ASN).

**AWS CLI command**:
```bash
aws ec2 create-vpn-gateway \
  --type ipsec.1 \
  --amazon-side-asn 64512 \
  --tag-specifications "ResourceType=vpn-gateway,Tags=[{Key=Name,Value=primary-vgw}]" \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 5. Attach Virtual Private Gateway to VPC
- Select an available VPC from the dropdown to attach the VGW.

**AWS CLI command**:
```bash
aws ec2 attach-vpn-gateway \
  --vpn-gateway-id vgw-000000000000000dd \
  --vpc-id vpc-00000000000000001 \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 6. Site-to-Site VPN Connections Page (`/vpc/vpn-connections`)
- View all VPN connections, associated Customer Gateways, Virtual Private Gateways or Transit Gateways, tunnel counts, and states.
- Actions: Download configuration, Edit route rules, Delete VPN connection.

**AWS CLI command**:
```bash
aws ec2 describe-vpn-connections \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 7. Create Site-to-Site VPN Connection (`/vpc/vpn-connections/create`)
- Choose target gateway type: **Virtual Private Gateway** or **Transit Gateway**.
- Select or create inline a Customer Gateway.
- Select Routing Options: **Dynamic (requires BGP)** or **Static** (with on-premises CIDR list).
- Optional advanced tunnel configuration: Inside IPv4 CIDRs (`169.254.0.0/16`), custom Pre-Shared Keys.

**AWS CLI command**:
```bash
aws ec2 create-vpn-connection \
  --type ipsec.1 \
  --customer-gateway-id cgw-000000000000000df \
  --vpn-gateway-id vgw-000000000000000dd \
  --options "{\"StaticRoutesOnly\":true}" \
  --tag-specifications "ResourceType=vpn-connection,Tags=[{Key=Name,Value=branch-office-vpn}]" \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 8. Download Configuration Modal
- Generate formatted router configuration scripts for major on-premises vendors:
  - Cisco Systems (ISR, ASA, IOS XE)
  - Juniper Networks (SRX Series, JunOS)
  - Fortinet (FortiGate FortiOS)
  - Generic / StrongSwan (Linux ipsec.conf)
- Export or copy the generated configuration directly into your appliance setup.

### 9. Static Routes Management
- Add or delete static destination CIDRs for a static VPN connection.

**AWS CLI command (Create route)**:
```bash
aws ec2 create-vpn-connection-route \
  --vpn-connection-id vpn-000000000000000e2 \
  --destination-cidr-block 192.168.50.0/24 \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

**AWS CLI command (Delete route)**:
```bash
aws ec2 delete-vpn-connection-route \
  --vpn-connection-id vpn-000000000000000e2 \
  --destination-cidr-block 192.168.50.0/24 \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 10. Delete VPN Connection
- Terminate the encrypted VPN connection.

**AWS CLI command**:
```bash
aws ec2 delete-vpn-connection \
  --vpn-connection-id vpn-000000000000000e2 \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

---

## Hands-On Exercises for Beginners

### Exercise 1: Register an On-Premises Customer Gateway
1. Navigate to **VPC Console** -> **Customer gateways** (`/vpc/customer-gateways`).
2. Click **Create customer gateway**.
3. Name: `datacenter-edge-router`.
4. BGP ASN: `65000`.
5. IP address: `203.0.113.25`.
6. Click **Create customer gateway**.
7. Verify that the customer gateway appears in the list with state `available`.

### Exercise 2: Provision a Virtual Private Gateway and Attach to VPC
1. Navigate to **VPC Console** -> **Virtual private gateways** (`/vpc/virtual-private-gateways`).
2. Click **Create virtual private gateway**.
3. Name: `corporate-vgw`.
4. ASN: Select **Amazon default ASN (64512)**.
5. Click **Create virtual private gateway**.
6. On the detail page or table, select **Actions** -> **Attach to VPC**.
7. Choose `vpc-00000000000000001` and click **Attach to VPC**.
8. Verify state changes to `attached`.

### Exercise 3: Establish a Static Site-to-Site VPN Connection
1. Navigate to **VPC Console** -> **Site-to-Site VPN connections** (`/vpc/vpn-connections`).
2. Click **Create VPN connection**.
3. Name: `datacenter-to-aws-vpn`.
4. Target gateway type: Select **Virtual private gateway** and pick `corporate-vgw`.
5. Customer gateway: Select **Existing** and choose `datacenter-edge-router`.
6. Routing options: Select **Static**.
7. Static IP prefixes: Enter `10.100.0.0/16`.
8. Click **Create VPN connection**.
9. In the VPN connection detail view, inspect the two tunnels under **Tunnel details**, verifying outside IP addresses and telemetry entries.

### Exercise 4: Download Router Configuration for Cisco ASA
1. Open the created VPN connection detail page (`/vpc/vpn-connections/[vpnConnectionId]`).
2. Click **Download configuration** in the top action bar.
3. Vendor: Select **Cisco Systems, Inc.**
4. Platform: Select **ASA 5500 Series**.
5. Software: Select **ASA 9.x**.
6. IKE version: Select **ikev2**.
7. Review the generated configuration template containing crypto maps, tunnel groups, and pre-shared keys.

### Exercise 5: Route Traffic via Virtual Private Gateway in VPC Route Table
1. Navigate to **VPC Console** -> **Route tables** (`/vpc/route-tables`).
2. Select your VPC route table and open the **Routes** tab.
3. Click **Add route**.
4. Destination: `10.100.0.0/16`.
5. Target Type: Select **Virtual Private Gateway**.
6. Target: Select your attached `corporate-vgw`.
7. Click **Add route** and verify the active route entry is added to the routing table.

---

## Limitations and Emulator Behaviors

1. **Simulated IPsec State**: In the local emulator, IPsec tunnels report `DOWN` or `AVAILABLE` with synthetic outside IP addresses (`54.0.0.x`) and simulated link-local inside CIDRs, since real cryptographically established ESP/IKE physical packets are not traversing the internet to a live hardware router.
2. **Accelerated VPN**: AWS Global Accelerator-powered Accelerated VPN endpoints require AWS Global Accelerator infrastructure, which is mocked with standard endpoints in the emulator.
3. **CloudWatch Logs Telemetry**: CloudWatch Logs tunnel logging options are accepted and stored, but mock tunnels do not stream live packet debug logs.

---

## Common Errors and Fixes

### Error: `CustomerGatewayLimitExceeded`
- **Cause**: Reached the quota for customer gateways in the current Region.
- **Fix**: Delete unused or deleted customer gateways or check quotas in AWS Service Quotas.

### Error: `InvalidVpnGatewayID.NotFound` or `Gateway.NotAttached`
- **Cause**: Trying to route traffic to a Virtual Private Gateway that is either deleted or not attached to the target VPC.
- **Fix**: Open `/vpc/virtual-private-gateways/[vpnGatewayId]`, ensure the VGW is attached to the VPC, and verify the attachment state is `attached`.

### Error: `InvalidSubnet.Conflict` in Tunnel Inside CIDR
- **Cause**: Provided tunnel inside CIDR conflicts with reserved ranges or overlapping `/30` blocks.
- **Fix**: AWS requires inside CIDR blocks to be a `/30` range from the `169.254.0.0/16` link-local block, avoiding reserved prefixes (`169.254.0.0/30`, `169.254.1.0/30`, `169.254.2.0/30`, etc.). Leave blank to let AWS automatically allocate non-overlapping `/30` blocks.

---

## Dependencies

| Dependency | Type | Where Used | Docs Link |
|---|---|---|---|
| Amazon VPC | Required | Subnets, routing tables, VPC attachment | [VPC Documentation](VPC.md) |
| AWS Transit Gateway | Optional | Alternative target gateway hub | [Transit Gateway Documentation](TRANSIT_GATEWAY.md) |
| AWS CloudWatch Logs | Optional | Tunnel connection and BGP log groups | [CloudWatch Logs Documentation](CloudWatch%20Logs.md) |
| AWS Certificate Manager / Private CA | Optional | Certificate-based VPN authentication | [ACM](ACM.md) / [Private CA](Private%20CA.md) |
