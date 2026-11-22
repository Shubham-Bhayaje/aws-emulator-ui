import { listCustomerGatewaysAction } from "../vpn-actions";
import CustomerGatewaysClient from "./CustomerGatewaysClient";

export const dynamic = "force-dynamic";

export default async function CustomerGatewaysPage() {
  const res = await listCustomerGatewaysAction();

  return (
    <CustomerGatewaysClient
      initialCustomerGateways={res.success ? res.customerGateways : []}
    />
  );
}
