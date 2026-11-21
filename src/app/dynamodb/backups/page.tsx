import { listBackupsAction, listTablesAction } from "../actions";
import BackupsClient from "./BackupsClient";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const [{ backups }, { tables }] = await Promise.all([
    listBackupsAction(),
    listTablesAction(),
  ]);

  const activeTableNames = (tables || []).map((t) => t.name);

  return <BackupsClient backups={backups} activeTableNames={activeTableNames} />;
}
