import VpcsClient from "./VpcsClient";
import { listVpcsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function VpcsPage() {
  const res = await listVpcsAction();
  return <VpcsClient initialVpcs={res.success ? res.vpcs : []} />;
}
