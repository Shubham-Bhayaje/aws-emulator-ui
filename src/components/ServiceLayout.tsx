/**
 * ServiceLayout – Wraps service pages (S3, SQS, etc.) with a collapsible
 * left sidebar specific to that service, plus a breadcrumb bar.
 * Matches the real AWS Console service page structure.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  label: string;
  href: string;
  group?: string;
};

type ServiceLayoutProps = {
  serviceName: string;
  serviceColor: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

export default function ServiceLayout({
  serviceName,
  serviceColor,
  navItems,
  children,
}: ServiceLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Track recently visited
  useEffect(() => {
    try {
      const stored: Array<{ name: string; href: string; visitedAt?: number }> = JSON.parse(
        localStorage.getItem("recentServices") || "[]"
      );

      let targetHref = "/" + (pathname.split("/")[1] || serviceName.toLowerCase().replace(/\s+/g, ""));
      let targetName = serviceName;

      if (
        pathname.startsWith("/vpc/firewalls") ||
        pathname.startsWith("/vpc/firewall-policies") ||
        pathname.startsWith("/vpc/rule-groups") ||
        pathname.startsWith("/network-firewall") ||
        pathname.startsWith("/networkfirewall")
      ) {
        targetHref = "/vpc/firewalls";
        targetName = "AWS Network Firewall";
      } else if (pathname.startsWith("/vpc/transit-gateway")) {
        targetHref = "/vpc/transit-gateways";
        targetName = "AWS Transit Gateway";
      } else if (pathname.startsWith("/vpc/client-vpn")) {
        targetHref = "/vpc/client-vpn-endpoints";
        targetName = "AWS Client VPN";
      } else if (
        pathname.startsWith("/vpc/vpn-connection") ||
        pathname.startsWith("/vpc/customer-gateway") ||
        pathname.startsWith("/vpc/virtual-private-gateway")
      ) {
        targetHref = "/vpc/vpn-connections";
        targetName = "AWS Site-to-Site VPN";
      } else if (pathname.startsWith("/systems-manager/parameter-store")) {
        targetHref = "/systems-manager/parameter-store";
        targetName = "AWS Systems Manager Parameter Store";
      } else if (pathname.startsWith("/route53/resolver")) {
        targetHref = "/route53/resolver";
        targetName = "AWS Route 53 Resolver";
      } else if (pathname.startsWith("/cloudwatch/logs")) {
        targetHref = "/cloudwatch/logs";
        targetName = "Amazon CloudWatch Logs";
      } else if (pathname.includes("glacier") || serviceName.toLowerCase().includes("glacier")) {
        targetHref = "/glacier";
        targetName = "Amazon S3 Glacier";
      }

      const filtered = stored.filter((s) => {
        if (!s || !s.href) return false;
        const sHref = s.href.toLowerCase().trim();
        const sName = s.name.toLowerCase().trim();
        if (targetHref === "/glacier" && (sHref.includes("glacier") || sName.includes("glacier"))) return false;
        if (sHref === targetHref.toLowerCase().trim() || sName === targetName.toLowerCase().trim()) return false;
        return true;
      });

      filtered.unshift({ name: targetName, href: targetHref, visitedAt: Date.now() });
      localStorage.setItem("recentServices", JSON.stringify(filtered.slice(0, 16)));
    } catch { /* ignore */ }
  }, [serviceName, pathname]);

  // Build breadcrumb from pathname
  const pathParts = pathname.split("/").filter(Boolean);

  return (
    <div className="flex min-h-[calc(100vh-40px)]">
      {/* Service sidebar */}
      <aside
        className={`sticky top-[40px] h-[calc(100vh-40px)] bg-white border-r border-[#d5dbdb] flex flex-col shrink-0 self-start transition-all duration-150 z-30 ${
          collapsed ? "w-[36px]" : "w-[220px]"
        }`}
      >
        {/* Hamburger toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-[40px] border-b border-[#eaeded] hover:bg-[#f2f3f3] text-[#545b64] shrink-0"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        {/* Nav items */}
        {!collapsed && (
          <nav className="flex-1 min-h-0 py-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item, idx) => {
              const prevItem = navItems[idx - 1];
              const showGroupHeader = item.group && (!prevItem || prevItem.group !== item.group);
              const hasExactMatch = navItems.some((n) => n.href === pathname);
              const isActive = hasExactMatch
                ? pathname === item.href
                : pathname.startsWith(item.href + "/") &&
                  !navItems.some(
                    (n) => n.href !== item.href && n.href.length > item.href.length && pathname.startsWith(n.href)
                  );

              return (
                <div key={item.href}>
                  {showGroupHeader && (
                    <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-[#545b64] uppercase tracking-wider border-t border-[#eaeded] first:border-t-0 mt-2 first:mt-0 select-none">
                      {item.group}
                    </div>
                  )}
                  <Link
                    href={item.href}
                    className={`block px-4 py-[5px] text-[13px] border-l-[3px] transition-colors truncate ${
                      isActive
                        ? "border-[#0073bb] bg-[#f2f8fd] text-[#0073bb] font-medium"
                        : "border-transparent text-[#16191f] hover:bg-[#f2f3f3]"
                    }`}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </nav>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Breadcrumb bar */}
        <div className="px-6 py-2 border-b border-[#eaeded] bg-white text-[12px] text-[#545b64] flex items-center gap-1">
          <Link href="/" className="text-[#0073bb] hover:text-[#ec7211] hover:underline">
            Console Home
          </Link>
          {pathParts.map((part, i) => {
            const href = "/" + pathParts.slice(0, i + 1).join("/");
            const isLast = i === pathParts.length - 1;
            const label = part.charAt(0).toUpperCase() + part.slice(1);
            return (
              <span key={href} className="flex items-center gap-1">
                <span className="text-[#aab7b8]">/</span>
                {isLast ? (
                  <span className="text-[#16191f]">{label}</span>
                ) : (
                  <Link href={href} className="text-[#0073bb] hover:text-[#ec7211] hover:underline">
                    {label}
                  </Link>
                )}
              </span>
            );
          })}
        </div>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
