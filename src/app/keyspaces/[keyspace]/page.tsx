import Link from "next/link";
import { getKeyspaceAction } from "../actions";
import KeyspaceDetailClient from "./KeyspaceDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ keyspace: string }>;
}

export default async function KeyspaceDetailPage(props: Props) {
  const { keyspace: rawKeyspace } = await props.params;
  const keyspaceName = decodeURIComponent(rawKeyspace);

  const { keyspace, tables, error } = await getKeyspaceAction(keyspaceName);

  if (!keyspace) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="bg-white border border-[#eaeded] rounded p-8 shadow-sm space-y-4">
          <h2 className="text-[20px] font-bold text-[#16191f]">Keyspace not found</h2>
          <p className="text-[13px] text-[#545b64]">
            Keyspace <strong className="font-mono text-[#16191f]">{keyspaceName}</strong> was not found in this Region.
          </p>
          <div className="pt-2">
            <Link
              href="/keyspaces"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Back to Keyspaces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <KeyspaceDetailClient
      keyspace={keyspace}
      initialTables={tables || []}
      initialError={error}
    />
  );
}
