import { describeParametersAction } from "./actions";
import { ParametersClient } from "./ParametersClient";

export const dynamic = "force-dynamic";

export default async function ParameterStorePage() {
  const res = await describeParametersAction();
  return <ParametersClient initialParameters={res.parameters} />;
}
