export interface VpcNavItem {
  label: string;
  href: string;
  group?: string;
}

export const vpcNav: VpcNavItem[] = [
  // Virtual private cloud
  { label: "VPC Dashboard", href: "/vpc", group: "Virtual private cloud" },
  { label: "Your VPCs", href: "/vpc/vpcs", group: "Virtual private cloud" },
  { label: "Subnets", href: "/vpc/subnets", group: "Virtual private cloud" },
  { label: "Route tables", href: "/vpc/route-tables", group: "Virtual private cloud" },
  { label: "Internet gateways", href: "/vpc/internet-gateways", group: "Virtual private cloud" },
  { label: "NAT gateways", href: "/vpc/nat-gateways", group: "Virtual private cloud" },
  { label: "Elastic IP addresses", href: "/vpc/elastic-ips", group: "Virtual private cloud" },
  { label: "Endpoints", href: "/vpc/endpoints", group: "Virtual private cloud" },
  { label: "Peering connections", href: "/vpc/peering-connections", group: "Virtual private cloud" },
  { label: "DHCP option sets", href: "/vpc/dhcp-options", group: "Virtual private cloud" },

  // Security
  { label: "Network ACLs", href: "/vpc/network-acls", group: "Security" },
  { label: "Security groups", href: "/vpc/security-groups", group: "Security" },

  // Transit Gateways
  { label: "Transit gateways", href: "/vpc/transit-gateways", group: "Transit Gateways" },
  { label: "Transit gateway attachments", href: "/vpc/transit-gateway-attachments", group: "Transit Gateways" },
  { label: "Transit gateway route tables", href: "/vpc/transit-gateway-route-tables", group: "Transit Gateways" },

  // Virtual Private Network (VPN)
  { label: "Virtual private gateways", href: "/vpc/virtual-private-gateways", group: "Virtual Private Network (VPN)" },
  { label: "Customer gateways", href: "/vpc/customer-gateways", group: "Virtual Private Network (VPN)" },
  { label: "Site-to-Site VPN connections", href: "/vpc/vpn-connections", group: "Virtual Private Network (VPN)" },
];
