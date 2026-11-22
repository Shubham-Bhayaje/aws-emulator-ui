import { listLagsAction } from "../dx-actions";
import LagsClient from "./LagsClient";

export const dynamic = "force-dynamic";

export default async function LagsPage() {
  const res = await listLagsAction();
  return <LagsClient initialLags={res.lags || []} />;
}
