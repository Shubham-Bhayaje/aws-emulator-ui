import Link from "next/link";
import { describeTableAction } from "../../../../actions";
import TableDetailClient from "./TableDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ database: string; table: string }>;
}

export default async function TableDetailPage(props: Props) {
  const { database: rawDatabase, table: rawTable } = await props.params;
  const databaseName = decodeURIComponent(rawDatabase);
  const tableName = decodeURIComponent(rawTable);

  const res = await describeTableAction(databaseName, tableName);

  if (!res.table) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <div className="bg-white border border-[#eaeded] rounded p-8 shadow-sm space-y-4">
          <h2 className="text-[20px] font-bold text-[#16191f]">Table not found</h2>
          <p className="text-[13px] text-[#545b64]">
            Table <strong className="font-mono text-[#16191f]">{tableName}</strong> was not found in database <strong className="font-mono text-[#16191f]">{databaseName}</strong>.
          </p>
          <div className="pt-2">
            <Link
              href={`/timestream/databases/${encodeURIComponent(databaseName)}`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Back to Database
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <TableDetailClient table={res.table} />;
}
