import DhcpOptionsClient from "./DhcpOptionsClient";
import { listDhcpOptionsAction, listVpcsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function DhcpOptionsPage() {
  const [dhcpRes, vpcsRes] = await Promise.all([
    listDhcpOptionsAction(),
    listVpcsAction(),
  ]);

  return (
    <DhcpOptionsClient
      initialDhcpOptions={dhcpRes.success ? dhcpRes.dhcpOptions : []}
      vpcs={vpcsRes.success ? vpcsRes.vpcs : []}
    />
  );
}
