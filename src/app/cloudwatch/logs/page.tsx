import { listLogGroupsAction, getKmsKeysAction } from "./actions";
import LogGroupsClient from "./LogGroupsClient";

export const dynamic = "force-dynamic";

export default async function CloudWatchLogsPage() {
  const [groupsRes, kmsKeys] = await Promise.all([
    listLogGroupsAction(),
    getKmsKeysAction(),
  ]);

  return (
    <LogGroupsClient
      initialLogGroups={groupsRes.logGroups}
      kmsKeys={kmsKeys}
      initialError={groupsRes.error}
    />
  );
}
