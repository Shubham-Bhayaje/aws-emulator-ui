import ViewsClient from "./ViewsClient";
import { listViewsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ResourceExplorerViewsPage() {
  const res = await listViewsAction();
  return (
    <ViewsClient
      initialViews={res.views}
      defaultViewArn={res.defaultViewArn}
      initialError={res.error}
    />
  );
}
