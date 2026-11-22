import InternetGatewaysClient from "./InternetGatewaysClient";
import { listInternetGatewaysAction, listVpcsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function InternetGatewaysPage() {
  const [igwsRes, vpcsRes] = await Promise.all([
    listInternetGatewaysAction(),
    listVpcsAction(),
  ]);

  return (
    <InternetGatewaysClient
      initialGateways={igwsRes.success ? igwsRes.internetGateways : []}
      vpcs={vpcsRes.success ? vpcsRes.vpcs : []}
    />
  );
}
