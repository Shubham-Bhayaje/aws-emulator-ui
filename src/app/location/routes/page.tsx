import RoutesClient from "./RoutesClient";
import { listRouteCalculatorsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function RoutesPage() {
  const res = await listRouteCalculatorsAction();
  return <RoutesClient initialCalculators={res.calculators || []} />;
}
