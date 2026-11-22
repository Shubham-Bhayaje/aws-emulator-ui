import SubnetsClient from "./SubnetsClient";
import { listSubnetsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SubnetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const res = await listSubnetsAction();
  return (
    <SubnetsClient
      initialSubnets={res.success ? res.subnets : []}
      initialSearch={sp.search || ""}
    />
  );
}
