import Link from "next/link";
import { describeDatabaseAction, listTablesAction } from "../../actions";
import DatabaseDetailClient from "./DatabaseDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ database: string }>;
}

export default async function DatabaseDetailPage(props: Props) {
  const { database: rawDatabase } = await props.params;
  const databaseName = decodeURIComponent(rawDatabase);

  const [dbRes, tablesRes] = await Promise.all([
    describeDatabaseAction(databaseName),
    listTablesAction(databaseName),
  ]);

  if (!dbRes.database) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <div className="bg-white border border-[#eaeded] rounded p-8 shadow-sm space-y-4">
          <h2 className="text-[20px] font-bold text-[#16191f]">Database not found</h2>
          <p className="text-[13px] text-[#545b64]">
            Database <strong className="font-mono text-[#16191f]">{databaseName}</strong> was not found in this Region.
          </p>
          <div className="pt-2">
            <Link
              href="/timestream/databases"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Back to Databases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DatabaseDetailClient
      database={dbRes.database}
      initialTables={tablesRes.tables}
    />
  );
}
