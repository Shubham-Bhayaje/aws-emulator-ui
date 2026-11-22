import { notFound } from "next/navigation";
import { getDhcpOptionsDetailAction } from "../../actions";
import DhcpOptionsDetailClient from "./DhcpOptionsDetailClient";

export const dynamic = "force-dynamic";

export default async function DhcpOptionsDetailPage({
  params,
}: {
  params: Promise<{ dhcpOptionsId: string }>;
}) {
  const { dhcpOptionsId } = await params;
  const res = await getDhcpOptionsDetailAction(dhcpOptionsId);

  if (!res.success || !res.dhcpOptions) {
    notFound();
  }

  return (
    <DhcpOptionsDetailClient
      dhcpOptions={res.dhcpOptions}
      associatedVpcs={res.associatedVpcs || []}
      allVpcs={res.allVpcs || []}
    />
  );
}
