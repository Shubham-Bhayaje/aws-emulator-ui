import { listResolverQueryLogConfigsAction } from "../resolver-actions";
import ResolverQueryLoggingClient from "./ResolverQueryLoggingClient";

export const dynamic = "force-dynamic";

export default async function ResolverQueryLoggingPage() {
  const res = await listResolverQueryLogConfigsAction();
  return <ResolverQueryLoggingClient initialConfigs={res.configs} />;
}
