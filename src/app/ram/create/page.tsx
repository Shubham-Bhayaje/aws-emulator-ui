import { fetchAvailableResourcesForSharing, fetchPermissions } from "../actions";
import CreateResourceShareWizard from "./CreateResourceShareWizard";

export const dynamic = "force-dynamic";

export default async function CreateResourceSharePage() {
  const [resResources, resPermissions] = await Promise.all([
    fetchAvailableResourcesForSharing(),
    fetchPermissions(),
  ]);

  const availableResources = resResources.success ? resResources.data : [];
  const allPermissions = resPermissions.success ? resPermissions.data : [];

  return (
    <CreateResourceShareWizard
      availableResources={availableResources}
      allPermissions={allPermissions}
    />
  );
}
