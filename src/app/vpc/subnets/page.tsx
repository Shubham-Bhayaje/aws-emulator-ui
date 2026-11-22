import SubnetsClient from "./SubnetsClient";
import { listSubnetsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SubnetsPage() {
  const res = await listSubnetsAction();
  return <SubnetsClient initialSubnets={res.success ? res.subnets : []} />;
}
