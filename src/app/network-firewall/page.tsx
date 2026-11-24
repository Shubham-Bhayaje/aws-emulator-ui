import { redirect } from "next/navigation";

export default function NetworkFirewallRootPage() {
  redirect("/vpc/firewalls");
}
