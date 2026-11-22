import { getDxDependencyDataAction } from "../../dx-actions";
import CreateVirtualInterfaceClient from "./CreateVirtualInterfaceClient";

export const dynamic = "force-dynamic";

export default async function CreateVirtualInterfacePage() {
  const deps = await getDxDependencyDataAction();
  return (
    <CreateVirtualInterfaceClient
      connections={deps.connections || []}
      directConnectGateways={deps.directConnectGateways || []}
      vpnGateways={deps.vpnGateways || []}
    />
  );
}
