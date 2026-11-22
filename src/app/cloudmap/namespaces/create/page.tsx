import CreateNamespaceClient from "./CreateNamespaceClient";
import { listVpcsAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function CreateNamespacePage() {
  const vpcs = await listVpcsAction();
  return <CreateNamespaceClient vpcs={vpcs} />;
}
