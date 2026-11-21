import { listTablesAction } from "../actions";
import ExploreItemsClient from "./ExploreItemsClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const { tables } = await listTablesAction();

  return <ExploreItemsClient tables={tables} />;
}
