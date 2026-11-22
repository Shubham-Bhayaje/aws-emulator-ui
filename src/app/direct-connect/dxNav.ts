export interface DxNavItem {
  label: string;
  href: string;
  group?: string;
}

export const dxNav: DxNavItem[] = [
  { label: "Dashboard", href: "/direct-connect", group: "Direct Connect" },
  { label: "Connections", href: "/direct-connect/connections", group: "Direct Connect" },
  { label: "Direct Connect gateways", href: "/direct-connect/gateways", group: "Direct Connect" },
  { label: "Virtual interfaces", href: "/direct-connect/virtual-interfaces", group: "Direct Connect" },
  { label: "LAGs", href: "/direct-connect/lags", group: "Direct Connect" },
];
