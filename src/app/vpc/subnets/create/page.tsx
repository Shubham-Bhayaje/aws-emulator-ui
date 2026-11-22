import CreateSubnetClient from "./CreateSubnetClient";
import { listVpcsAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function CreateSubnetPage() {
  const vpcsRes = await listVpcsAction();
  return <CreateSubnetClient vpcs={vpcsRes.success ? vpcsRes.vpcs : []} />;
}
