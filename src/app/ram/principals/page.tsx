import { fetchAllPrincipals } from "../actions";
import PrincipalsClient from "./PrincipalsClient";

export const dynamic = "force-dynamic";

export default async function PrincipalsPage() {
  const res = await fetchAllPrincipals("SELF");
  const initialPrincipals = res.success ? res.data : [];

  return <PrincipalsClient initialPrincipals={initialPrincipals} />;
}
