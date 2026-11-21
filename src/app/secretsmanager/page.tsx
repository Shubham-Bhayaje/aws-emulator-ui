import { fetchSecretsAction } from "./actions";
import { SecretsClient } from "./SecretsClient";

export const dynamic = "force-dynamic";

export default async function SecretsPage() {
  const result = await fetchSecretsAction(true);

  return <SecretsClient initialSecrets={result.secrets || []} />;
}
