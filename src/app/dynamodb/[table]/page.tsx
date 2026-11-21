import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ table: string }>;
}

export default async function TablePage({ params }: PageProps) {
  const resolvedParams = await params;
  const tableName = decodeURIComponent(resolvedParams.table);
  redirect(`/dynamodb/tables/${encodeURIComponent(tableName)}`);
}
