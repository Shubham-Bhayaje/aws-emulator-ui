import { fetchKmsKeysAction } from "../actions";
import { StoreSecretWizard } from "./StoreSecretWizard";

export const dynamic = "force-dynamic";

export default async function NewSecretPage() {
  const kmsRes = await fetchKmsKeysAction();

  return <StoreSecretWizard kmsKeys={kmsRes.keys || []} />;
}
