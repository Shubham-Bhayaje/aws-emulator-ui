# Amazon Virtual Private Cloud (Amazon VPC)

Amazon Virtual Private Cloud (Amazon VPC) enables you to launch AWS resources into a virtual network that you define. This virtual network closely resembles a traditional on-premises network that you'd operate in your own data center, with the benefits of using the scalable infrastructure of AWS. You have complete control over your virtual networking environment, including selection of your own IP address range, creation of subnets, and configuration of route tables and network gateways.

---

## Key Concepts

### 1. Virtual Private Clouds (VPCs)
A VPC is a logically isolated virtual network dedicated to your AWS account. When you create a VPC, you specify an IPv4 Classless Inter-Domain Routing (CIDR) block (for example, `10.0.0.0/16`). You can also associate secondary CIDR blocks, configure DNS resolution and DNS hostnames attributes, and customize tenancy.

### 2. Subnets
A subnet is a segment of your VPC's IP address range where you can place groups of isolated resources. Each subnet must reside entirely within a single Availability Zone (AZ).
- **Public Subnet**: A subnet whose route table has a direct route to an Internet Gateway (`0.0.0.0/0 -> igw-...`). Resources in a public subnet can receive public IP addresses and communicate directly with the internet.
- **Private Subnet**: A subnet without a direct route to an Internet Gateway. Outbound internet access from a private subnet is routed through a Network Address Translation (NAT) gateway or NAT instance located in a public subnet.

### 3. Route Tables and Routes
A route table contains a set of rules, called routes, that determine where network traffic from your subnet or gateway is directed. Each VPC comes with a default main route table containing a local route for the VPC CIDR block. Custom route tables can be associated with specific subnets to override the main route table behavior.
- **Targets**: Route targets can include Internet Gateways (`igw-...`), NAT Gateways (`nat-...`), VPC Peering Connections (`pcx-...`), VPC Endpoints (`vpce-...`), or local VPC addresses.

### 4. Internet Gateways (IGWs)
An Internet Gateway is a horizontally scaled, redundant, and highly available VPC component that allows communication between your VPC and the internet. It performs network address translation for instances assigned public IPv4 addresses. An Internet Gateway is attached to a VPC (one per VPC).

### 5. NAT Gateways
A NAT gateway enables instances in a private subnet to connect to services outside your VPC (such as software repositories on the public internet) while preventing external services from initiating inbound connections to those instances.
- **Public NAT Gateway**: Resides in a public subnet and requires an allocated Elastic IP (EIP) address.
- **Private NAT Gateway**: Resides in a private subnet and enables private routing to other VPCs or on-premises networks without an internet-facing IP.

### 6. Security Groups
A security group acts as a stateful virtual firewall for your EC2 instances and network interfaces to control inbound and outbound traffic.
- **Stateful**: If you send an outbound request from your instance, the response traffic is automatically allowed regardless of inbound security group rules.
- Rules specify protocol (TCP, UDP, ICMP, All), port range, source/destination CIDR blocks, and optional descriptions.

### 7. Network Access Control Lists (NACLs)
A network ACL is an optional stateless layer of security for your VPC that acts as a firewall for controlling traffic in and out of one or more subnets.
- **Stateless**: Responses to allowed inbound traffic are subject to the rules for outbound traffic (and vice versa).
- Rules are numbered sequentially (1 to 32766) and evaluated in ascending order. Each rule explicitly specifies `ALLOW` or `DENY`.

### 8. Elastic IP Addresses (EIPs)
An Elastic IP address is a static, publicly routable IPv4 address designed for dynamic cloud computing. You allocate an Elastic IP from the Amazon pool to your account and associate it with instances, network interfaces, or NAT gateways. When no longer needed, you disassociate and release it back to the pool.

### 9. VPC Endpoints
VPC endpoints enable private connections between your VPC and supported AWS services without requiring an internet gateway, NAT device, VPN connection, or AWS Direct Connect connection.
- **Gateway Endpoints**: High-throughput routing targets added directly to VPC route tables for Amazon S3 and Amazon DynamoDB without extra network hops.
- **Interface Endpoints (AWS PrivateLink)**: Elastic Network Interfaces (ENIs) with private IP addresses created in your subnets serving as entry points for traffic destined for supported services (EC2, SQS, SNS, etc.).

### 10. VPC Peering Connections
A VPC peering connection is a networking connection between two VPCs that enables you to route traffic between them using private IPv4 or IPv6 addresses. Instances in either VPC can communicate with each other as if they were within the same network. Connections can be created between VPCs in the same account or across accounts/regions.

### 11. DHCP Option Sets
A Dynamic Host Configuration Protocol (DHCP) option set defines configuration parameters automatically assigned to instances launched into your VPC, including Domain Name, Domain Name Servers (e.g. `AmazonProvidedDNS`), and NTP servers.

---

## Console Walkthrough and Working AWS CLI Commands

Every action below is supported in this console replica and tested against the local emulator at `https://127.0.0.1:9297`.

### 1. VPCs (`/vpc/vpcs` & `/vpc/vpcs/create`)
- **View VPCs**: Interactive inventory table displaying VPC Name, VPC ID, State, IPv4 CIDR, Default VPC flag, and Tenancy.
- **Create VPC ("VPC only")**: Specify Name tag, IPv4 CIDR block (e.g. `10.0.0.0/16`), and Tenancy.
- **Create VPC ("VPC and more")**: Visual workflow generator that creates a VPC, multiple public and private subnets across 2 Availability Zones, an Internet Gateway, NAT Gateway, and automatically configures route tables.
- **DNS Attributes**: Toggle `Enable DNS hostnames` and `Enable DNS resolution` directly from the VPC actions menu.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=production-vpc}]'
  ```

### 2. Subnets (`/vpc/subnets`, `/vpc/subnets/create`, & `/vpc/subnets/[subnetId]`)
- **View Subnets**: Filterable table showing Subnet Name, Subnet ID, State, VPC ID, CIDR block, Availability Zone, and Available IPv4 addresses.
- **Dedicated Subnet Detail Page (`/vpc/subnets/[subnetId]`)**:
  - **Overview**: Subnet ID, state badge (`Available`), VPC ID, IPv4 CIDR, Available IPv4 addresses, and Availability Zone.
  - **Details Tab**: Complete attribute grid including Subnet ARN, Owner ID, AZ ID, Default subnet flag, Auto-assign public IPv4 toggle, and DNS64 status.
  - **Route Table Tab**: Associated route table details, route targets, and inline "Edit route table association" modal.
  - **Network ACL Tab**: Inbound and outbound firewall rules evaluated for this subnet.
  - **Resource Map Tab**: Visual end-to-end trace from VPC through this Subnet to its Route Table and next-hop gateway.
  - **Tags Tab**: Key-value metadata tags.
- **Create Subnet**: Select VPC, choose Availability Zone (e.g. `us-east-1a`), specify IPv4 CIDR block (e.g. `10.0.1.0/24`), and optional Name tag.
- **Modify Settings**: Toggle `Auto-assign public IPv4 address` on launch directly from the Subnet Detail page.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-subnet \
    --vpc-id <vpc-id> \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1a}]'
  ```

### 3. Route Tables (`/vpc/route-tables` & `/vpc/route-tables/[routeTableId]`)
- **View Route Tables**: Table showing Route Table ID, Name, Main flag, and VPC ID.
- **Dedicated Route Table Detail Page (`/vpc/route-tables/[routeTableId]`)**:
  - **Overview**: Route Table ID, VPC, Main/Custom status pill, explicit subnet association count, and route count.
  - **Routes Tab**: Complete table of destination CIDRs and target hops (Internet Gateway, NAT Gateway, Gateway Endpoints). Includes "Add route" modal and route deletion.
  - **Subnet Associations Tab**: Explicit subnet associations table with links to individual Subnet pages, main-route-table fallback subnets, and "Edit subnet associations" multi-select modal.
  - **Details Tab**: Route Table ID, Route Table ARN, Owner ID, and VPC ID.
  - **Edge Associations Tab**: Gateway edge associations view.
  - **Tags Tab**: Key-value tags table.
- **CLI Command (Create Route Table)**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-route-table \
    --vpc-id <vpc-id> \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=public-rtb}]'
  ```
- **CLI Command (Add Route)**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-route \
    --route-table-id <rtb-id> \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id <igw-id>
  ```
- **CLI Command (Associate Subnet)**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 associate-route-table \
    --route-table-id <rtb-id> \
    --subnet-id <subnet-id>
  ```

### 4. Internet Gateways (`/vpc/internet-gateways`)
- **View Internet Gateways**: Table listing Gateway ID, Name, State (`attached`/`detached`), and Attached VPC ID.
- **Create Internet Gateway**: Specify optional Name tag.
- **Attach / Detach**: Attach a detached gateway to a VPC from the dropdown, or detach when no longer needed.
- **CLI Command**:
  ```bash
  # Create IGW
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=prod-igw}]'

  # Attach to VPC
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 attach-internet-gateway \
    --internet-gateway-id <igw-id> \
    --vpc-id <vpc-id>
  ```

### 5. NAT Gateways (`/vpc/nat-gateways`)
- **View NAT Gateways**: Table showing NAT Gateway ID, Name, State, Connectivity Type (`public`/`private`), Primary Public IP, Primary Private IP, Subnet ID, and VPC ID.
- **Create NAT Gateway**: Select public subnet, choose connectivity type, select an allocated Elastic IP (or click **Allocate Elastic IP** directly in the modal).
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-nat-gateway \
    --subnet-id <public-subnet-id> \
    --allocation-id <eip-allocation-id> \
    --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=prod-nat-1a}]'
  ```

### 6. Security Groups (`/vpc/security-groups`)
- **View Security Groups**: Table showing Group Name, Group ID, Description, VPC ID, and inbound/outbound rule counts.
- **Inbound Rules Tab**: View protocol, port range, source CIDR, and description. Click **Add rule** to authorize HTTP (80), HTTPS (443), SSH (22), or custom TCP/UDP ports. Click **Delete** to revoke a rule.
- **Outbound Rules Tab**: Inspect egress rules (defaults to allowing all outbound traffic).
- **CLI Command (Create Security Group)**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-security-group \
    --group-name web-security-group \
    --description "Allow web tier HTTP and HTTPS traffic" \
    --vpc-id <vpc-id>
  ```
- **CLI Command (Authorize Ingress)**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 authorize-security-group-ingress \
    --group-id <sg-id> \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0
  ```

### 7. Network ACLs (`/vpc/network-acls`)
- **View Network ACLs**: Table displaying Network ACL ID, Name, Default flag, and VPC ID.
- **Inbound / Outbound Tabs**: Sequential evaluation table showing Rule Number, Protocol, Port Range, CIDR, and `ALLOW`/`DENY` action badge.
- **Add Rule Modal**: Add numbered rules (e.g. Rule #100, TCP, Port 80, CIDR `0.0.0.0/0`, Action `ALLOW`).
- **CLI Command (Create Entry)**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-network-acl-entry \
    --network-acl-id <nacl-id> \
    --rule-number 100 \
    --protocol 6 \
    --port-range From=80,To=80 \
    --cidr-block 0.0.0.0/0 \
    --rule-action allow \
    --ingress
  ```

### 8. Elastic IP Addresses (`/vpc/elastic-ips`)
- **View Elastic IPs**: Table showing Allocation ID, Allocated Public IPv4 address, Associated Instance ID, Association ID, and Private IP.
- **Allocate Elastic IP**: Modal to allocate a new public IP from the Amazon network border group pool.
- **Release Elastic IP**: Disassociate and release an Elastic IP address back to AWS.
- **CLI Command**:
  ```bash
  # Allocate
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 allocate-address \
    --domain vpc \
    --tag-specifications 'ResourceType=elastic-ip,Tags=[{Key=Name,Value=nat-eip}]'

  # Release
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 release-address \
    --allocation-id <allocation-id>
  ```

### 9. VPC Endpoints (`/vpc/endpoints`)
- **View Endpoints**: Table displaying Endpoint ID, Service Name, Type (`Gateway`/`Interface`), Status (`available`), and VPC ID.
- **Create Endpoint**: Select AWS service (`com.amazonaws.us-east-1.s3`, `com.amazonaws.us-east-1.dynamodb`, `com.amazonaws.us-east-1.ec2`), choose VPC, and check target route tables (Gateway) or subnets (Interface).
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-vpc-endpoint \
    --vpc-id <vpc-id> \
    --service-name com.amazonaws.us-east-1.s3 \
    --vpc-endpoint-type Gateway \
    --route-table-ids <rtb-id>
  ```

### 10. Peering Connections (`/vpc/peering-connections`)
- **View Peering Connections**: Table displaying Peering Connection ID, Status (`active`/`pending-acceptance`), Requester VPC & CIDR, and Accepter VPC & CIDR.
- **Create Connection**: Select Requester VPC and Accepter VPC.
- **Accept / Reject**: Click **Accept request** or **Reject request** on pending peering connections.
- **CLI Command**:
  ```bash
  # Create request
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-vpc-peering-connection \
    --vpc-id <requester-vpc-id> \
    --peer-vpc-id <accepter-vpc-id>

  # Accept connection
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 accept-vpc-peering-connection \
    --vpc-peering-connection-id <pcx-id>
  ```

### 11. DHCP Option Sets (`/vpc/dhcp-options`)
- **View DHCP Option Sets**: Table listing DHCP Option Set ID, Domain Name, Domain Name Servers, and NTP Servers.
- **Create Option Set**: Provide domain name (e.g. `mycorp.local`), DNS servers (e.g. `AmazonProvidedDNS`), and NTP servers.
- **Associate with VPC**: Select a VPC and associate the custom DHCP options set.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 ec2 create-dhcp-options \
    --dhcp-configurations "Key=domain-name-servers,Values=AmazonProvidedDNS" \
    --tag-specifications 'ResourceType=dhcp-options,Tags=[{Key=Name,Value=corp-dhcp}]'
  ```

---

## Hands-On Beginner Exercises

### Exercise 1: Build a Dual-Subnet VPC with Public Routing
1. Navigate to **Your VPCs** (`/vpc/vpcs`) and click **Create VPC**.
2. Select **VPC only**, enter Name `lab1-vpc`, and CIDR `10.10.0.0/16`. Click **Create VPC**.
3. Navigate to **Subnets** (`/vpc/subnets`) and click **Create subnet**:
   - VPC: `lab1-vpc`
   - Name: `lab1-public-subnet`
   - AZ: `us-east-1a`
   - CIDR: `10.10.1.0/24`
4. Create a second subnet:
   - VPC: `lab1-vpc`
   - Name: `lab1-private-subnet`
   - AZ: `us-east-1b`
   - CIDR: `10.10.2.0/24`
5. Navigate to **Internet gateways** (`/vpc/internet-gateways`), click **Create internet gateway**, name it `lab1-igw`.
6. Select `lab1-igw`, click **Attach to VPC**, and choose `lab1-vpc`.
7. Navigate to **Route tables** (`/vpc/route-tables`), click **Create route table**, name it `lab1-public-rtb`, and select `lab1-vpc`.
8. Select `lab1-public-rtb`, open the **Routes** tab, click **Add route**, enter Destination `0.0.0.0/0`, Target Type `Internet Gateway`, select `lab1-igw`, and save.
9. Open the **Subnet associations** tab, click **Associate subnet**, select `lab1-public-subnet`, and save.
10. Verify: Your public subnet now routes outbound internet traffic through `lab1-igw` while `lab1-private-subnet` remains private!

### Exercise 2: Secure Instances with Security Groups and Network ACLs
1. Navigate to **Security groups** (`/vpc/security-groups`) and click **Create security group**.
2. Name: `lab2-web-sg`, Description: `Web tier HTTP traffic`, VPC: `lab1-vpc`.
3. In the security group details, open **Inbound rules**, click **Add rule**, choose **HTTP (Port 80)** with Source `0.0.0.0/0`, and save.
4. Add another rule for **HTTPS (Port 443)** with Source `0.0.0.0/0`.
5. Navigate to **Network ACLs** (`/vpc/network-acls`) and click **Create network ACL**.
6. Name: `lab2-nacl`, VPC: `lab1-vpc`.
7. In the ACL details, open **Inbound rules**, click **Add inbound rule**:
   - Rule number: `100`
   - Protocol: `TCP (6)`
   - Port range: From `80` To `80`
   - CIDR: `0.0.0.0/0`
   - Action: `ALLOW`
8. Notice the distinction: Security groups are stateful and permit return traffic automatically, while Network ACLs evaluate both inbound and outbound traffic explicitly by rule number.

### Exercise 3: Enable Private Access to Amazon S3 via VPC Gateway Endpoint
1. Navigate to **Endpoints** (`/vpc/endpoints`) and click **Create endpoint**.
2. Name tag: `s3-gateway-endpoint`.
3. Service name: Select `com.amazonaws.us-east-1.s3` (Gateway).
4. VPC: Select `lab1-vpc`.
5. Under **Route tables**, check `lab1-public-rtb`.
6. Click **Create endpoint**.
7. Navigate back to **Route tables** (`/vpc/route-tables`) and select `lab1-public-rtb`.
8. In the **Routes** tab, notice the new route automatically added: Destination `pl-... (com.amazonaws.us-east-1.s3)` pointing directly to the VPC endpoint gateway!

---

## Dedicated Individual Resource Detail Pages

Every VPC resource provides a full-fidelity dedicated detail page accessible via direct URL, by clicking the Name or Resource ID in inventory list tables, by double-clicking any table row, from the bottom preview drawer (`Open <resource> page ↗`), or by clicking cards in the interactive VPC Resource Map:

| Resource Type | Route Pattern | Key Details and Capabilities |
|---|---|---|
| **VPCs** | `/vpc/vpcs/[vpcId]` | VPC details, primary and secondary IPv4 CIDR associations, authentic interactive topology Resource Map, DNS hostnames/resolution toggles, tag manager. |
| **Subnets** | `/vpc/subnets/[subnetId]` | Subnet CIDR, availability zone, available IPs, auto-assign public IPv4 toggle, associated route table and network ACL links, tags. |
| **Route Tables** | `/vpc/route-tables/[routeTableId]` | Full route rule editor (target types: local, igw, nat, vpce, pcx), explicit and main subnet association managers, tags. |
| **Internet Gateways** | `/vpc/internet-gateways/[internetGatewayId]` | Attachment state, attached VPC link, attach/detach workflows, delete confirmation modal, tags. |
| **NAT Gateways** | `/vpc/nat-gateways/[natGatewayId]` | Connectivity type (public/private), allocated Elastic IP, subnet association, delete workflow, tags. |
| **Elastic IPs** | `/vpc/elastic-ips/[allocationId]` | Allocation ID, public IPv4, association ID, network interface, instance link, network border group, release workflow, tags. |
| **VPC Endpoints** | `/vpc/endpoints/[endpointId]` | Endpoint type (Gateway vs Interface), service name, state, associated route tables or subnets table, delete workflow, tags. |
| **Peering Connections** | `/vpc/peering-connections/[peeringConnectionId]` | Requester and accepter VPC side-by-side comparison, accept/reject request handlers, delete peering workflow, tags. |
| **DHCP Option Sets** | `/vpc/dhcp-options/[dhcpOptionsId]` | Domain name, DNS servers, NTP servers, associate with VPC modal, associated VPCs table, delete workflow, tags. |
| **Network ACLs** | `/vpc/network-acls/[networkAclId]` | Inbound and outbound rule managers (rule number, protocol, port range, CIDR, allow/deny), associated subnets list, tags. |

---

## Limitations and Differences from Real AWS

| Feature | Real AWS Console | Mini AWS Console (Emulator) |
|---|---|---|
| Gateway Endpoints Prefix Lists | Managed prefix list (`pl-63a5400a`) populated by AWS global DNS | Local mock gateway target ID registered in route table |
| Network Border Groups | 30+ physical AWS regional border groups | `us-east-1` simulated local network border group |
| NAT Gateway Billing | Hourly NAT gateway charge + per-GB data processing charge | Free local emulation without cloud charges |
| IP Address Tenancy | Dedicated hardware instances and host tenancy options | Standard virtualized tenancy |
| Flow Logs Traffic Capture | Writes actual packet-level PCAP logs to S3 or CloudWatch Logs | Flow logs metadata configuration stored via EC2 emulator commands |

---

## Dependencies

| Dependency | Required or Optional | Where Used in Console | Status |
|---|---|---|---|
| AWS IAM | Required | Endpoint policy IAM principals and VPC flow log delivery roles | Fully Built (`lib/aws.ts` server-side) |
| AWS KMS | Optional | Customer managed key encryption for VPC Flow Logs and endpoint connections | Fully Built (Available in KMS console) |
| Amazon CloudWatch Logs | Optional | VPC Flow Logs forwarding destination | Fully Built (Available in CloudWatch Logs) |
| Amazon S3 | Optional | Gateway endpoint service destination and Flow Logs bucket destination | Fully Built (Available in S3 console) |
| Amazon Route 53 | Optional | Private hosted zones linked to VPCs for custom DNS resolution | Available after Route 53 is built |
| AWS Transit Gateway | Optional | Multi-VPC hub-and-spoke transit network attachments | Available after Transit Gateway is built |
