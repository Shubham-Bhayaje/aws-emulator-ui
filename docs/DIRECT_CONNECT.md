# AWS Direct Connect Guide

## 1. Overview and Use Cases

AWS Direct Connect links your internal network to an AWS Direct Connect location over a standard Ethernet fiber-optic cable. One end of the cable is connected to your router, the other to an AWS Direct Connect router. With this connection in place, you can create virtual interfaces directly to public AWS services (such as Amazon S3) and to Amazon VPC, bypassing internet service providers in your network path. Use AWS Direct Connect when you require dedicated, predictable throughput (1 Gbps, 10 Gbps, or 100 Gbps), lower data transfer costs, reduced latency for real-time applications, or strict compliance rules prohibiting traversal over the public internet.

---

## 2. Key Concepts

### Dedicated Connection
A physical Ethernet connection allocated exclusively to your single AWS account, ordered at an AWS colocation facility (e.g., Equinix or CoreSite) at bandwidths of 1 Gbps, 10 Gbps, or 100 Gbps.
- **Example:** An enterprise orders a 10 Gbps dedicated port at Equinix Ashburn (EqDC2) to link their private data center directly to `us-east-1`.

### Letter of Authorization and Connecting Facility Assignment (LOA-CFA)
An official authorization document issued by AWS after you request a dedicated connection. You provide this document to your colocation facility provider so they can run the physical cross-connect fiber to AWS equipment.
- **Example:** You download the LOA-CFA PDF from the AWS Console and submit a cross-connect ticket to Equinix referencing the assigned patch panel and port IDs.

### Direct Connect Gateway (DXGW)
A globally available networking hub that allows a single Direct Connect connection to communicate with multiple Virtual Private Clouds (VPCs) across multiple AWS Regions and accounts.
- **Example:** A Direct Connect Gateway associated with private virtual interfaces in Virginia (`us-east-1`) and Oregon (`us-west-2`) routing traffic across both regions over one physical fiber link.

### Virtual Interface (VIF)
A logical VLAN and BGP peering session provisioned on top of a physical Direct Connect connection.
- **Private Virtual Interface:** Connects to an Amazon VPC via a Virtual Private Gateway (VGW) or Direct Connect Gateway. Uses private IP addresses and private ASNs.
- **Transit Virtual Interface:** Connects to an AWS Transit Gateway via a Direct Connect Gateway. Supports transitive hub-and-spoke topologies across hundreds of VPCs.
- **Public Virtual Interface:** Connects to public AWS service endpoints (Amazon S3, DynamoDB) using public BGP routing and public IP prefixes.

### BGP Peering
Border Gateway Protocol (BGP) session established between your on-premises edge router and the AWS Direct Connect endpoint using 802.1Q VLAN encapsulation and optional MD5 authentication.
- **Example:** Customer router (ASN 65000, IP 169.254.255.2/30) peers with AWS Direct Connect endpoint (ASN 64512, IP 169.254.255.1/30).

### Link Aggregation Group (LAG)
A logical interface combining up to four dedicated connections at the same colocation facility into a single link using IEEE 802.3ad / 802.1ax Link Aggregation Control Protocol (LACP).
- **Example:** Four 10 Gbps ports grouped into a single 40 Gbps active-active aggregated connection.

---

## 3. Console Walkthrough and Verified AWS CLI Commands

### 3.1 View Colocation Locations
- **Console:** Navigate to `AWS Direct Connect > Connections > Create connection > Location`.
- **AWS CLI:**
```bash
aws --endpoint-url https://127.0.0.1:9297 --no-verify-ssl directconnect describe-locations
```

### 3.2 Create a Dedicated Connection
- **Console:** Navigate to `AWS Direct Connect > Connections > Create connection`. Enter Connection name (e.g., `corp-datacenter-link`), select Location (`EqDC2-EQ`), Bandwidth (`1Gbps`), and configure Tags.
- **AWS CLI:**
```bash
aws --endpoint-url https://127.0.0.1:9297 --no-verify-ssl directconnect create-connection \
  --connection-name "corp-datacenter-link" \
  --location "EqDC2" \
  --bandwidth "1Gbps"
```

### 3.3 List and Inspect Connections
- **Console:** Navigate to `AWS Direct Connect > Connections`. Click on any connection ID to view Details, Virtual Interfaces, and download the LOA-CFA.
- **AWS CLI:**
```bash
aws --endpoint-url https://127.0.0.1:9297 --no-verify-ssl directconnect describe-connections
```

### 3.4 Create a Direct Connect Gateway
- **Console:** Navigate to `AWS Direct Connect > Direct Connect gateways > Create Direct Connect gateway`. Enter Gateway name (`corporate-dx-gateway`) and Amazon-side ASN (`64512`).
- **AWS CLI:**
```bash
aws --endpoint-url https://127.0.0.1:9297 --no-verify-ssl directconnect create-direct-connect-gateway \
  --direct-connect-gateway-name "corporate-dx-gateway" \
  --amazon-side-asn 64512
```

### 3.5 List Direct Connect Gateways
- **Console:** Navigate to `AWS Direct Connect > Direct Connect gateways`.
- **AWS CLI:**
```bash
aws --endpoint-url https://127.0.0.1:9297 --no-verify-ssl directconnect describe-direct-connect-gateways
```

### 3.6 Create a Private Virtual Interface
- **Console:** Navigate to `AWS Direct Connect > Virtual interfaces > Create virtual interface`. Select Private, choose Connection, specify VLAN `100`, Customer ASN `65000`, BGP IPs `169.254.255.1/30` and `169.254.255.2/30`, and associate with a Direct Connect Gateway.
- **AWS CLI:**
```bash
aws --endpoint-url https://127.0.0.1:9297 --no-verify-ssl directconnect create-private-virtual-interface \
  --connection-id "dxcon-00000002" \
  --new-private-virtual-interface "virtualInterfaceName=corp-vif,vlan=100,asn=65000,amazonAddress=169.254.255.1/30,customerAddress=169.254.255.2/30,directConnectGatewayId=a8c7f732-281a-4812-a381-000000000001"
```

### 3.7 List Virtual Interfaces
- **Console:** Navigate to `AWS Direct Connect > Virtual interfaces`.
- **AWS CLI:**
```bash
aws --endpoint-url https://127.0.0.1:9297 --no-verify-ssl directconnect describe-virtual-interfaces
```

### 3.8 Delete a Virtual Interface
- **Console:** Navigate to `AWS Direct Connect > Virtual interfaces`. Select the virtual interface, click `Actions > Delete`, confirm with `delete`.
- **AWS CLI:**
```bash
aws --endpoint-url https://127.0.0.1:9297 --no-verify-ssl directconnect delete-virtual-interface \
  --virtual-interface-id "dxvif-00000003"
```

### 3.9 Delete a Dedicated Connection
- **Console:** Navigate to `AWS Direct Connect > Connections`. Select the connection, click `Actions > Delete`, confirm with `delete`.
- **AWS CLI:**
```bash
aws --endpoint-url https://127.0.0.1:9297 --no-verify-ssl directconnect delete-connection \
  --connection-id "dxcon-00000002"
```

---

## 4. Hands-on Exercises

### Exercise 1: Provision a 1 Gbps Dedicated Connection and Inspect LOA-CFA
- **Goal:** Order a dedicated physical port at Equinix Ashburn and generate the facility cross-connect letter.
- **Steps:**
  1. Open the console at `/direct-connect/connections/create`.
  2. Set Connection name to `lab-dedicated-port`, choose `EqDC2-EQ` (Equinix DC2 Ashburn), and Bandwidth `1Gbps`.
  3. Click `Create connection`.
  4. From `/direct-connect/connections`, click on the created connection ID.
  5. Open the `LOA-CFA` tab and view the generated Letter of Authorization.
- **Expected Result:** Connection transitions to `requested` or `available`, and the LOA-CFA specifies the customer account, port allocation, and optical media specifications.

### Exercise 2: Create a Multi-Region Direct Connect Gateway
- **Goal:** Set up a global gateway for multi-VPC routing with a custom private ASN.
- **Steps:**
  1. Go to `/direct-connect/gateways/create`.
  2. Enter Gateway name `global-transit-dxgw` and Amazon-side ASN `64512`.
  3. Click `Create Direct Connect gateway`.
  4. Verify the gateway appears in the list with state `available`.
- **Expected Result:** A Direct Connect Gateway resource is created with state `available` and owner account `000000000000`.

### Exercise 3: Provision a Private Virtual Interface and Download Router Configuration
- **Goal:** Establish a VLAN and BGP peering endpoint attached to your Direct Connect Gateway, then export Cisco IOS configuration.
- **Steps:**
  1. Go to `/direct-connect/virtual-interfaces/create`.
  2. Choose `Private`, name `onprem-private-vif`, select your connection, set VLAN to `200`, Customer ASN to `65000`, and select your Direct Connect Gateway.
  3. Click `Create virtual interface`.
  4. Open the created VIF detail page, switch to `Download router configuration` tab, and review the Cisco IOS commands.
- **Expected Result:** The virtual interface is created with status `available`, BGP peering IP endpoints are assigned, and exact Cisco IOS sub-interface and BGP neighbor statements are displayed.

---

## 5. Emulator Limitations

- **Hardware Cross-Connect Simulation:** The emulator simulates the Direct Connect control plane API. Physical optical link state and cross-connect cabling are not physically simulated.
- **Scaffolded APIs:**
  - `DeleteDirectConnectGateway`: Returns `NotImplemented` from this emulator. Handled gracefully in the console UI.
  - `CreateTransitVirtualInterface` and `CreatePublicVirtualInterface`: Scaffolded with informative messages.
  - `DescribeLags`: Scaffolded in emulator; LAGs dashboard provides full architectural education.
- **Automatic Cascade Deletion:** In the emulator, deleting a parent connection immediately marks child virtual interfaces as `deleted`.

---

## 6. Common Errors and Troubleshooting

### "No Direct Connect connections found"
- **Cause:** Attempting to create a Virtual Interface before ordering a physical connection.
- **Fix:** Navigate to `/direct-connect/connections/create` and provision a dedicated port first.

### "VLAN tag must be an integer between 1 and 4094"
- **Cause:** VLAN tag outside valid 802.1Q range or left empty.
- **Fix:** Enter an integer between 1 and 4094 that is not already in use on the selected physical connection.

### "Direct Connect gateway ASN conflict"
- **Cause:** Customer ASN and Amazon-side ASN must not be identical for eBGP sessions.
- **Fix:** Ensure Customer ASN (e.g., 65000) differs from Amazon-side ASN (default 64512).

---

## 7. Service Dependencies

| Dependency | Required / Optional | Where Used in Console | Status |
|---|---|---|---|
| Amazon VPC | Optional | Attaching Private Virtual Interfaces to Virtual Private Gateways | Built |
| AWS Transit Gateway | Optional | Connecting Transit Virtual Interfaces to multi-VPC hubs | Built |
| CloudWatch Logs | Optional | Monitoring connection metrics and link state | Built |
| AWS KMS | Optional | MACsec key encryption on 10G/100G dedicated links | Built |
