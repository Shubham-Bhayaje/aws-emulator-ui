import { describeBackupsAction } from "../actions";
import { BackupsClient } from "./BackupsClient";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const res = await describeBackupsAction();
  return <BackupsClient initialBackups={res.backups || []} initialError={res.error} />;
}
