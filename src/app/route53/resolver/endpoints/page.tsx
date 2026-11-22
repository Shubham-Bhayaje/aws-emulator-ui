import { listResolverEndpointsAction } from "../resolver-actions";
import ResolverEndpointsClient from "./ResolverEndpointsClient";

export const dynamic = "force-dynamic";

export default async function ResolverEndpointsPage() {
  const res = await listResolverEndpointsAction();
  return <ResolverEndpointsClient initialEndpoints={res.endpoints || []} />;
}
