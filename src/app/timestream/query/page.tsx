import { listDatabasesAction } from "../actions";
import QueryClient from "./QueryClient";

export const dynamic = "force-dynamic";

export default async function TimestreamQueryPage() {
  const data = await listDatabasesAction();

  return <QueryClient databases={data.databases} />;
}
