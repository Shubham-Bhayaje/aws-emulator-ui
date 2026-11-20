import { fetchAllPrincipals } from "../../actions";
import PrincipalsClient from "../../principals/PrincipalsClient";

export const dynamic = "force-dynamic";

export default async function SharedWithMePrincipalsPage() {
  const res = await fetchAllPrincipals("OTHER-ACCOUNTS");
  const initialPrincipals = res.success ? res.data : [];

  return <PrincipalsClient initialPrincipals={initialPrincipals} />;
}
