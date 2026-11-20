import { fetchQuotaRequestHistory } from "../actions";
import HistoryClient from "./HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const res = await fetchQuotaRequestHistory();
  const history = res.success ? res.data : [];

  return <HistoryClient initialHistory={history} />;
}
