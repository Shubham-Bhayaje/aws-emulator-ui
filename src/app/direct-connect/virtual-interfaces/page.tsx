import { listVirtualInterfacesAction } from "../dx-actions";
import VirtualInterfacesClient from "./VirtualInterfacesClient";

export const dynamic = "force-dynamic";

export default async function VirtualInterfacesPage() {
  const res = await listVirtualInterfacesAction();
  return <VirtualInterfacesClient initialVirtualInterfaces={res.virtualInterfaces || []} />;
}
