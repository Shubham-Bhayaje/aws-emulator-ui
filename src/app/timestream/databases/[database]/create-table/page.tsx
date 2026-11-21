import CreateTableClient from "./CreateTableClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ database: string }>;
}

export default async function CreateTablePage(props: Props) {
  const { database: rawDatabase } = await props.params;
  const databaseName = decodeURIComponent(rawDatabase);

  return <CreateTableClient databaseName={databaseName} />;
}
