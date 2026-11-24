import { notFound } from "next/navigation";
import {
  fetchLiveFirewall,
  fetchLiveLoggingConfiguration,
  fetchLoggingDestinations,
  fetchLiveTagsForResource,
} from "../../network-firewall-actions";
import FirewallDetailClient from "./FirewallDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ firewallName: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { firewallName } = await params;
  return {
    title: `${firewallName} | Firewalls | VPC | AWS Management Console`,
  };
}

export default async function FirewallDetailPage({ params }: Props) {
  const { firewallName } = await params;
  const fwRes = await fetchLiveFirewall(firewallName);

  if (!fwRes.success || !fwRes.firewall) {
    notFound();
  }

  const [logRes, destRes, tagsRes] = await Promise.all([
    fetchLiveLoggingConfiguration(firewallName),
    fetchLoggingDestinations(),
    fwRes.firewall.FirewallArn
      ? fetchLiveTagsForResource(fwRes.firewall.FirewallArn)
      : Promise.resolve({ success: true, tags: [] }),
  ]);

  return (
    <FirewallDetailClient
      firewall={fwRes.firewall}
      firewallStatus={fwRes.firewallStatus}
      updateToken={fwRes.updateToken || ""}
      initialLoggingConfig={logRes.loggingConfiguration}
      logDestinations={destRes}
      initialTags={tagsRes.tags}
    />
  );
}
