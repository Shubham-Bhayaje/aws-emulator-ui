import Link from "next/link";
import { redirect } from "next/navigation";
import { listKeyspacesAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function GenericCreateTablePage() {
  const { keyspaces } = await listKeyspacesAction();
  const userKeyspaces = keyspaces.filter((k) => !k.isSystem);

  if (userKeyspaces.length === 1) {
    redirect(`/keyspaces/${encodeURIComponent(userKeyspaces[0].keyspaceName)}/create-table`);
  }

  return (
    <div className="max-w-xl mx-auto p-8 text-center space-y-6">
      <div className="bg-white border border-[#eaeded] rounded p-8 shadow-sm space-y-4">
        <h2 className="text-[20px] font-bold text-[#16191f]">Select a keyspace</h2>
        <p className="text-[13px] text-[#545b64]">
          Every Cassandra table belongs to a keyspace. Choose a keyspace below to create a table.
        </p>

        {userKeyspaces.length === 0 ? (
          <div className="space-y-4 pt-2">
            <p className="text-[13px] text-[#545b64]">
              You do not have any user keyspaces yet. Create a keyspace first.
            </p>
            <Link
              href="/keyspaces/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Create keyspace
            </Link>
          </div>
        ) : (
          <div className="space-y-2 pt-2 text-left">
            {userKeyspaces.map((k) => (
              <Link
                key={k.keyspaceName}
                href={`/keyspaces/${encodeURIComponent(k.keyspaceName)}/create-table`}
                className="block p-3 border border-[#eaeded] rounded hover:border-[#ec7211] hover:bg-[#f2f8fd] transition-colors"
              >
                <div className="font-bold text-[14px] text-[#0073bb]">{k.keyspaceName}</div>
                <div className="text-[11px] text-[#545b64]">{k.replicationStrategy}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
