# AWS Transit Gateway

AWS Transit Gateway connects Amazon VPCs and on-premises networks through a central hub. This simplifies your network architecture and eliminates complex peering relationships. As cloud infrastructure grows, Transit Gateway scales across accounts, VPCs, and networks with a single gateway managing connections and routing.

---

## Key Concepts

### 1. Transit Gateway
An AWS Transit Gateway acts as a regional virtual router for network traffic flowing between your Virtual Private Clouds (VPCs) and on-premises networks.
- **Example**: A central transit gateway (`tgw-0123456789abcdef0`) routes traffic between three separate VPCs (Development, Staging, Production) without needing point-to-point VPC peering connections between each pair.

### 2. Transit Gateway Attachments
An attachment is a connection between a network resource (such as a VPC, VPN connection, or Direct Connect gateway) and a transit gateway.
- **Example**: Attaching VPC A (`vpc-00000000000000001`) with subnets in Availability Zones `us-east-1a` and `us-east-1b` creates attachment `tgw-attach-0123456789abcdef0`.

### 3. Transit Gateway Route Tables
A transit gateway contains one or more route tables that determine where network packets arriving on associated attachments are forwarded.
- **Example**: A default transit gateway route table (`tgw-rtb-0123456789abcdef0`) contains routes directing CIDR `10.0.0.0/16` to VPC A's attachment and `10.1.0.0/16` to VPC B's attachment.

### 4. Route Table Associations
An association links an attachment to exactly one transit gateway route table. When traffic leaves the attachment and enters the transit gateway, the gateway evaluates that route table to make forwarding decisions.
- **Example**: Attachment A is associated with Transit Gateway Route Table 1. Packets from VPC A are routed according to rules defined in Route Table 1.

### 5. Route Table Propagations
A propagation allows an attachment to advertise its CIDR prefixes dynamically into one or more transit gateway route tables without requiring manual static route entry.
- **Example**: Enabling route propagation for VPC B's attachment on Route Table 1 automatically creates an active route for VPC B's CIDR `10.1.0.0/16` pointing to VPC B's attachment.

### 6. Static Routes and Blackhole Routes
Static routes are manually created route table entries. If traffic destined for a CIDR should be intentionally dropped, a blackhole route can be created.
- **Example**: Creating a route with destination `192.168.0.0/16` marked as `blackhole` causes the transit gateway to drop any traffic destined for that prefix.

---

## Console Walkthrough and Working AWS CLI Commands

Every action below is supported in this console replica and tested against the local AWS Emulator at `https://127.0.0.1:9297`.

### 1. Transit Gateways (`/vpc/transit-gateways`)
- **Inventory List**: Displays Name, Transit Gateway ID, State, Owner ID, ASN, and Creation Time.
- **Create Transit Gateway** (`/vpc/transit-gateways/create`):
  - Configure Name tag, Description, Amazon-side ASN (default `64512`), Auto-accept shared attachments, Default route table association, Default route table propagation, VPN ECMP support, DNS support, Multicast support, and CIDR blocks.
- **Detail View** (`/vpc/transit-gateways/[transitGatewayId]`):
  - View gateway configuration options, connected attachments, associated route tables, and resource tags.
- **Delete Gateway**: Removes the transit gateway once all attachments have been deleted.

```bash
# Describe Transit Gateways
aws ec2 describe-transit-gateways \
  --endpoint-url https://127.0.0.1:9297

# Create a Transit Gateway
aws ec2 create-transit-gateway \
  --description "Corporate Network Hub" \
  --options AmazonSideAsn=64512,AutoAcceptSharedAttachments=disable,DefaultRouteTableAssociation=enable,DefaultRouteTablePropagation=enable,DnsSupport=enable \
  --tag-specifications "ResourceType=transit-gateway,Tags=[{Key=Name,Value=hub-tgw}]" \
  --endpoint-url https://127.0.0.1:9297

# Delete a Transit Gateway
aws ec2 delete-transit-gateway \
  --transit-gateway-id tgw-0123456789abcdef0 \
  --endpoint-url https://127.0.0.1:9297
```

---

### 2. Transit Gateway Attachments (`/vpc/transit-gateway-attachments`)
- **Inventory List**: Displays Attachment ID, Name, Transit Gateway ID, Resource Type, Resource ID (VPC ID), and State.
- **Create Attachment** (`/vpc/transit-gateway-attachments/create`):
  - Select target Transit Gateway.
  - Choose Attachment Type (`VPC` active; `VPN`, `Direct Connect gateway`, `Connect`, and `Peering` clearly marked with integration status).
  - Select target VPC and one subnet per Availability Zone.
  - Configure IPv6 support and Appliance mode support.
- **Detail View** (`/vpc/transit-gateway-attachments/[attachmentId]`):
  - Summary metadata, connected VPC, subnet allocation list, route table associations, and tags.
- **Delete Attachment**: Terminates the network attachment.

```bash
# Describe Transit Gateway Attachments
aws ec2 describe-transit-gateway-attachments \
  --endpoint-url https://127.0.0.1:9297

# Create a VPC Attachment
aws ec2 create-transit-gateway-vpc-attachment \
  --transit-gateway-id tgw-0123456789abcdef0 \
  --vpc-id vpc-00000000000000001 \
  --subnet-ids subnet-00000000000000007 \
  --tag-specifications "ResourceType=transit-gateway-attachment,Tags=[{Key=Name,Value=vpc-a-attachment}]" \
  --endpoint-url https://127.0.0.1:9297

# Delete a VPC Attachment
aws ec2 delete-transit-gateway-vpc-attachment \
  --transit-gateway-attachment-id tgw-attach-0123456789abcdef0 \
  --endpoint-url https://127.0.0.1:9297
```

---

### 3. Transit Gateway Route Tables (`/vpc/transit-gateway-route-tables`)
- **Inventory List**: Displays Route Table ID, Name, Transit Gateway ID, State, Default association flag, and Default propagation flag.
- **Create Route Table** (`/vpc/transit-gateway-route-tables/create`):
  - Specify Name and Transit Gateway ID.
- **Detail View** (`/vpc/transit-gateway-route-tables/[routeTableId]`):
  - **Details**: Summary attributes and creation time.
  - **Associations**: View and associate attachments (`AssociateTransitGatewayRouteTable`).
  - **Propagations**: View, enable, and disable route propagations (`EnableTransitGatewayRouteTablePropagation`, `DisableTransitGatewayRouteTablePropagation`).
  - **Routes**: View active and blackhole routes, add static routes (`CreateTransitGatewayRoute`), and delete routes (`DeleteTransitGatewayRoute`).
  - **Tags**: Resource metadata tags.
- **Delete Route Table**: Deletes custom transit gateway route tables.

```bash
# Describe Transit Gateway Route Tables
aws ec2 describe-transit-gateway-route-tables \
  --endpoint-url https://127.0.0.1:9297

# Create a Transit Gateway Route Table
aws ec2 create-transit-gateway-route-table \
  --transit-gateway-id tgw-0123456789abcdef0 \
  --tag-specifications "ResourceType=transit-gateway-route-table,Tags=[{Key=Name,Value=custom-rtb}]" \
  --endpoint-url https://127.0.0.1:9297

# Associate an Attachment with a Route Table
aws ec2 associate-transit-gateway-route-table \
  --transit-gateway-route-table-id tgw-rtb-0123456789abcdef0 \
  --transit-gateway-attachment-id tgw-attach-0123456789abcdef0 \
  --endpoint-url https://127.0.0.1:9297

# Enable Route Propagation
aws ec2 enable-transit-gateway-route-table-propagation \
  --transit-gateway-route-table-id tgw-rtb-0123456789abcdef0 \
  --transit-gateway-attachment-id tgw-attach-0123456789abcdef0 \
  --endpoint-url https://127.0.0.1:9297

# Disable Route Propagation
aws ec2 disable-transit-gateway-route-table-propagation \
  --transit-gateway-route-table-id tgw-rtb-0123456789abcdef0 \
  --transit-gateway-attachment-id tgw-attach-0123456789abcdef0 \
  --endpoint-url https://127.0.0.1:9297

# Create a Static Route
aws ec2 create-transit-gateway-route \
  --transit-gateway-route-table-id tgw-rtb-0123456789abcdef0 \
  --destination-cidr-block 10.10.0.0/16 \
  --transit-gateway-attachment-id tgw-attach-0123456789abcdef0 \
  --endpoint-url https://127.0.0.1:9297

# Create a Blackhole Route
aws ec2 create-transit-gateway-route \
  --transit-gateway-route-table-id tgw-rtb-0123456789abcdef0 \
  --destination-cidr-block 192.168.100.0/24 \
  --blackhole \
  --endpoint-url https://127.0.0.1:9297
```

---

### 4. VPC Route Table Target Integration (`/vpc/route-tables/[routeTableId]`)
- When creating routes in standard Amazon VPC route tables, users can select **Transit Gateway** as the target network hop alongside Internet Gateways, NAT Gateways, and Gateway Endpoints.
- Entering a destination prefix (e.g., `10.200.0.0/16`) and selecting a Transit Gateway creates a VPC route forwarding traffic into the transit gateway hub.

---

## Hands-On Exercises for Beginners

### Exercise 1: Create a Central Transit Hub and Connect a VPC
1. Navigate to **Transit gateways** under the **VIRTUAL PRIVATE CLOUD** sidebar menu.
2. Click **Create transit gateway**. Set the Name tag to `lab-hub-tgw`, leave default settings (ASN `64512`, Default association and propagation enabled), and click **Create transit gateway**.
3. Verify that the gateway status is `available`.
4. Navigate to **Transit gateway attachments** and click **Create transit gateway attachment**.
5. Select `lab-hub-tgw`, choose Attachment type `VPC`, select your default VPC, and choose a subnet for `us-east-1a`.
6. Click **Create transit gateway attachment**. Verify the attachment status transitions to `available`.
- **Expected Result**: The VPC is connected to the Transit Gateway, and its CIDR is automatically propagated into the default Transit Gateway Route Table.

### Exercise 2: Inspect Transit Gateway Route Tables and Propagations
1. Navigate to **Transit gateway route tables**.
2. Click on the default route table associated with your gateway.
3. Open the **Associations** tab to confirm your attachment is listed.
4. Open the **Routes** tab to view routes dynamically propagated from attached VPCs.
- **Expected Result**: The route table shows an active route for the attached VPC's CIDR block.

### Exercise 3: Create a Static Blackhole Route for Security Filtering
1. Open the detail view of your transit gateway route table and navigate to the **Routes** tab.
2. Click **Create static route**.
3. Enter Destination CIDR `172.16.99.0/24` and check **Drop traffic (Blackhole)**.
4. Click **Create static route**.
- **Expected Result**: A new route entry appears with State `blackhole`, indicating that any traffic arriving for that CIDR will be dropped.

---

## Limitations

1. **Disassociate Route Table**: The local AWS emulator provides a scaffolded response for `DisassociateTransitGatewayRouteTable`. The console displays the status and handles associations cleanly.
2. **Delete Route**: The local AWS emulator provides a scaffolded response for `DeleteTransitGatewayRoute`.
3. **External Dependencies**:
   - VPN Attachments: Requires AWS Site-to-Site VPN.
   - Direct Connect Gateway Attachments: Requires AWS Direct Connect.
   - Transit Gateway Connect: Requires SD-WAN Connect.
   - Inter-Region Peering: Requires multi-region emulator support.
   These options are displayed in the console matching AWS Console layout but are safely disabled with clear notices.

---

## Common Errors and How to Fix Them

1. **IncorrectState when deleting Transit Gateway**:
   - *Cause*: A Transit Gateway cannot be deleted while attachments are still connected to it.
   - *Fix*: Delete all VPC attachments associated with the gateway first, then delete the Transit Gateway.

2. **No subnets found for selected VPC**:
   - *Cause*: The selected VPC does not have any subnets created in the region.
   - *Fix*: Go to `/vpc/subnets`, create subnets in the VPC, and return to the attachment creation form.

3. **Cannot delete Default Association Route Table**:
   - *Cause*: AWS prevents deleting the default association route table while it is linked as the primary default table for the gateway.
   - *Fix*: Create a custom route table if you wish to use independent routing domains.

---

## Dependencies

| Dependency | Type | Where Used | Docs Link |
| :--- | :--- | :--- | :--- |
| Amazon VPC | Required | VPC attachments, subnets, and route table targets | [Amazon VPC](file:///c:/PROJECTS/AWS%20GUI/docs/VPC.md) |
| AWS RAM | Optional | Sharing transit gateways across AWS accounts | [AWS RAM](file:///c:/PROJECTS/AWS%20GUI/docs/RAM.md) |
| AWS KMS | Optional | Transit gateway encryption | [AWS KMS](file:///c:/PROJECTS/AWS%20GUI/docs/KMS.md) |
| AWS Site-to-Site VPN | Optional | VPN attachments (disabled until service built) | Backlog |
| AWS Direct Connect | Optional | Direct Connect gateway attachments (disabled until service built) | Backlog |
