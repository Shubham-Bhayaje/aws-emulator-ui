import SettingsClient from "./SettingsClient";
import {
  getIndexAction,
  listIndexesAction,
  listViewsAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ResourceExplorerSettingsPage() {
  const [indexRes, listIdxRes, viewsRes] = await Promise.all([
    getIndexAction(),
    listIndexesAction(),
    listViewsAction(),
  ]);

  return (
    <SettingsClient
      currentIndexInfo={indexRes}
      indexes={listIdxRes.indexes}
      views={viewsRes.views}
      defaultViewArn={viewsRes.defaultViewArn}
    />
  );
}
