import { listBackupsAction } from "../actions";
import BackupsClient from "./BackupsClient";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const { backups } = await listBackupsAction();

  return <BackupsClient backups={backups} />;
}
