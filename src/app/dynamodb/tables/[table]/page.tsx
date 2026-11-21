import Link from "next/link";
import {
  getTableDetailAction,
  scanTableAction,
  listBackupsAction,
  getKmsKeysAction,
  getLambdaFunctionsAction,
  getS3BucketsAction,
} from "../../actions";
import TableDetailClient from "./TableDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ table: string }>;
}

export default async function TableDetailPage(props: Props) {
  const { table: rawTable } = await props.params;
  const tableName = decodeURIComponent(rawTable);

  const [detailRes, scanRes, backupsRes, kmsKeys, lambdaFunctions, s3Buckets] =
    await Promise.all([
      getTableDetailAction(tableName),
      scanTableAction({ tableName, limit: 100 }),
      listBackupsAction(tableName),
      getKmsKeysAction(),
      getLambdaFunctionsAction(),
      getS3BucketsAction(),
    ]);

  if (!detailRes.table) {
    const hasBackups = (backupsRes.backups || []).length > 0;
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="bg-white border border-[#eaeded] rounded p-8 shadow-sm space-y-4">
          <h2 className="text-[20px] font-bold text-[#16191f]">Table not found</h2>
          <p className="text-[13px] text-[#545b64]">
            Table <strong className="font-mono text-[#16191f]">{tableName}</strong> was not found in this Region.
            {hasBackups && (
              <span className="block mt-2 text-[#16191f]">
                However, <strong>{backupsRes.backups.length}</strong> on-demand backup{backupsRes.backups.length > 1 ? "s are" : " is"} available for this table.
              </span>
            )}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {hasBackups && (
              <Link
                href="/dynamodb/backups"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Restore from Backups
              </Link>
            )}
            <Link
              href="/dynamodb/tables"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded ${
                hasBackups
                  ? "bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
                  : "bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              }`}
            >
              Back to Tables
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TableDetailClient
      table={detailRes.table}
      initialItems={scanRes.items}
      backups={backupsRes.backups}
      kmsKeys={kmsKeys}
      lambdaFunctions={lambdaFunctions}
      s3Buckets={s3Buckets}
    />
  );
}
