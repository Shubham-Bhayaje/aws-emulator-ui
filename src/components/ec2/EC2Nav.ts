/**
 * EC2Nav.ts – Full authentic AWS EC2 Console Navigation Tree.
 * Complete replica of AWS Management Console categorized sidebar menu.
 * Zero emojis, Cloudscape enterprise styling.
 */

import { NavItem } from "@/components/ServiceLayout";

export const ec2Nav: NavItem[] = [
  // Top Level
  { label: "EC2 Dashboard", href: "/ec2" },
  { label: "Global View", href: "/ec2/global-view" },

  // Instances
  { group: "Instances", label: "Instances", href: "/ec2/instances" },
  { group: "Instances", label: "Instance Types", href: "/ec2/instance-types" },
  { group: "Instances", label: "Launch Templates", href: "/ec2/launch-templates" },
  { group: "Instances", label: "Spot Requests", href: "/ec2/spot-requests" },
  { group: "Instances", label: "Savings Plans", href: "/ec2/savings-plans" },
  { group: "Instances", label: "Reserved Instances", href: "/ec2/reserved-instances" },
  { group: "Instances", label: "Dedicated Hosts", href: "/ec2/dedicated-hosts" },
  { group: "Instances", label: "Capacity Reservations", href: "/ec2/capacity-reservations" },

  // Images
  { group: "Images", label: "AMIs", href: "/ec2/amis" },
  { group: "Images", label: "AMI Catalog", href: "/ec2/ami-catalog" },

  // Elastic Block Store
  { group: "Elastic Block Store", label: "Volumes", href: "/ec2/volumes" },
  { group: "Elastic Block Store", label: "Snapshots", href: "/ec2/snapshots" },
  { group: "Elastic Block Store", label: "Lifecycle Manager", href: "/ec2/lifecycle-manager" },

  // Network & Security
  { group: "Network & Security", label: "Security Groups", href: "/ec2/security-groups" },
  { group: "Network & Security", label: "Elastic IPs", href: "/ec2/elastic-ips" },
  { group: "Network & Security", label: "Placement Groups", href: "/ec2/placement-groups" },
  { group: "Network & Security", label: "Key Pairs", href: "/ec2/key-pairs" },
  { group: "Network & Security", label: "Network Interfaces", href: "/ec2/network-interfaces" },

  // Load Balancing
  { group: "Load Balancing", label: "Load Balancers", href: "/ec2/load-balancers" },
  { group: "Load Balancing", label: "Target Groups", href: "/ec2/target-groups" },

  // Auto Scaling
  { group: "Auto Scaling", label: "Launch Configurations", href: "/ec2/launch-configurations" },
  { group: "Auto Scaling", label: "Auto Scaling Groups", href: "/ec2/auto-scaling-groups" },
];
