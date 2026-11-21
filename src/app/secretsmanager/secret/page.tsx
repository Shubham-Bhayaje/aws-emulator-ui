import { redirect } from "next/navigation";

export default async function SecretQueryRedirect({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  if (name) {
    redirect(`/secretsmanager/${encodeURIComponent(name)}`);
  }
  redirect("/secretsmanager");
}
