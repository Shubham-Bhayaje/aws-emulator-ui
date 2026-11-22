import { redirect } from "next/navigation";

export default function ClientVpnRedirectPage() {
  redirect("/vpc/client-vpn-endpoints");
}
