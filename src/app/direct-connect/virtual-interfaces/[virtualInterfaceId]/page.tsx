import { notFound } from "next/navigation";
import { getVirtualInterfaceDetailAction } from "../../dx-actions";
import VirtualInterfaceDetailClient from "./VirtualInterfaceDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ virtualInterfaceId: string }>;
}

export default async function VirtualInterfaceDetailPage(props: Props) {
  const { virtualInterfaceId } = await props.params;
  const res = await getVirtualInterfaceDetailAction(virtualInterfaceId);

  if (!res.success || !res.virtualInterface) {
    notFound();
  }

  return <VirtualInterfaceDetailClient virtualInterface={res.virtualInterface} />;
}
