/**
 * ServiceLayout – Wraps service pages (S3, SQS, etc.) with a collapsible
 * left sidebar specific to that service, plus a breadcrumb bar.
 * Matches the real AWS Console service page structure.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
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
      const stored = JSON.parse(localStorage.getItem("recentServices") || "[]");
      const filtered = stored.filter((s: { name: string }) => s.name !== serviceName);
      filtered.unshift({ name: serviceName, href: `/${serviceName.toLowerCase().replace(/\s/g, "")}`, visitedAt: Date.now() });
      localStorage.setItem("recentServices", JSON.stringify(filtered.slice(0, 10)));
    } catch { /* ignore */ }
  }, [serviceName]);

  // Build breadcrumb from pathname
  const pathParts = pathname.split("/").filter(Boolean);

  return (
    <div className="flex min-h-[calc(100vh-40px)]">
      {/* Service sidebar */}
      <aside
        className={`bg-white border-r border-[#d5dbdb] flex flex-col shrink-0 transition-all duration-150 ${
          collapsed ? "w-[36px]" : "w-[200px]"
        }`}
      >
        {/* Hamburger toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-[40px] border-b border-[#eaeded] hover:bg-[#f2f3f3] text-[#545b64]"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        {/* Nav items */}
        {!collapsed && (
          <nav className="flex-1 py-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-[6px] text-[13px] border-l-[3px] ${
                    isActive
                      ? "border-[#0073bb] bg-[#f2f8fd] text-[#0073bb] font-medium"
                      : "border-transparent text-[#16191f] hover:bg-[#f2f3f3]"
                  }`}
                >
                  {item.label}
                </Link>
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
