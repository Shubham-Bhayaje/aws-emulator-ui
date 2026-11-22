import { listClientVpnEndpointsAction } from "../client-vpn-actions";
import ClientVpnEndpointsClient from "./ClientVpnEndpointsClient";

export const dynamic = "force-dynamic";

export default async function ClientVpnEndpointsPage() {
  const res = await listClientVpnEndpointsAction();
  const endpoints = res.success ? res.endpoints : [];

  return <ClientVpnEndpointsClient initialEndpoints={endpoints} />;
}
