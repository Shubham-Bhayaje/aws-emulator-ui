import { listDeploymentStrategiesAction } from "../actions";
import DeploymentStrategiesClient from "./DeploymentStrategiesClient";

export const dynamic = "force-dynamic";

export default async function DeploymentStrategiesPage() {
  const res = await listDeploymentStrategiesAction();
  const strategies = res.success && res.items ? res.items : [];

  return <DeploymentStrategiesClient initialStrategies={strategies} />;
}
