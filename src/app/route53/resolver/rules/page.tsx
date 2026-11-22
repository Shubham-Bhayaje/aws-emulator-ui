import { listResolverRulesAction } from "../resolver-actions";
import ResolverRulesClient from "./ResolverRulesClient";

export const dynamic = "force-dynamic";

export default async function ResolverRulesPage() {
  const res = await listResolverRulesAction();
  return <ResolverRulesClient initialRules={res.rules} />;
}
