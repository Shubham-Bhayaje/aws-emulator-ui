/**
 * [service]/page.tsx – Dynamic service page for all AWS services in the catalog.
 * Renders an authentic AWS Management Console layout and overview.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";
import RedirectClient from "@/components/RedirectClient";
import { findServiceByHref, findServiceById, ALL_SERVICES } from "@/lib/services-catalog";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ service: string }>;
};

export default async function DynamicServicePage(props: Props) {
  const { service: slug } = await props.params;

  // Handle common aliases and glacier redirects immediately
  const cleanSlug = slug.toLowerCase().replace(/[-_\s]+/g, "");
  if (cleanSlug === "s3glacier" || cleanSlug === "glaciervaults") {
    redirect("/glacier");
  }

  let service = findServiceByHref("/" + slug) || findServiceById(slug);

  if (service && service.href && service.href.toLowerCase() !== ("/" + slug).toLowerCase()) {
    redirect(service.href);
  }

  if (!service) {
    const aliasMatch = ALL_SERVICES.find((s) => {
      if (s.id.toLowerCase().replace(/[-_\s]+/g, "") === cleanSlug) return true;
      return (s.aliases || []).some(
        (a) => a.toLowerCase().replace(/[-_\s]+/g, "") === cleanSlug
      );
    });

    if (aliasMatch && aliasMatch.href && aliasMatch.href.toLowerCase() !== ("/" + slug).toLowerCase()) {
      redirect(aliasMatch.href);
    }
    service = aliasMatch;
  }

  if (!service) {
    return (
      <div className="max-w-[1200px] mx-auto p-6 space-y-6">
        <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-4 max-w-xl mx-auto mt-12 shadow-sm">
          <h2 className="text-[20px] font-bold text-[#16191f]">Service Not Found</h2>
          <p className="text-[13px] text-[#545b64]">
            The requested service <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded font-mono text-[#16191f]">/{slug}</code> is not cataloged in this AWS console environment.
          </p>
          <div className="pt-2">
            <Link
              href="/services"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
            >
              Browse AWS Services Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const nav = [
    { label: `${service.shortName} Overview`, href: service.href },
    { label: "Documentation", href: `https://docs.aws.amazon.com/${service.id}/`, external: true },
  ];

  return (
    <ServiceLayout
      serviceName={service.shortName}
      serviceColor={service.color || "#FF9900"}
      navItems={nav}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[22px] font-bold text-[#16191f]">{service.name}</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
            {service.category}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
            Coming Soon
          </span>
        </div>
        <p className="text-[13px] text-[#545b64] max-w-3xl leading-relaxed">
          {service.desc}
        </p>
      </div>

      <ComingSoon
        serviceName={service.name}
        description={service.desc}
      />
    </ServiceLayout>
  );
}
