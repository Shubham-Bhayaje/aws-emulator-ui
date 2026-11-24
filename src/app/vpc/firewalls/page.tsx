import { fetchLiveFirewalls } from "../network-firewall-actions";
import FirewallsClient from "./FirewallsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Firewalls | VPC | AWS Management Console",
};

export default async function FirewallsPage() {
  const res = await fetchLiveFirewalls();
  const firewalls = res.success ? res.firewalls : [];
  const error = res.error || null;

  return <FirewallsClient initialFirewalls={firewalls} initialError={error} />;
}
