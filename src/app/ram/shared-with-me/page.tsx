import { fetchResourceShares, fetchInvitations } from "../actions";
import SharedWithMeClient from "./SharedWithMeClient";

export const dynamic = "force-dynamic";

export default async function SharedWithMePage() {
  const [sharesRes, invRes] = await Promise.all([
    fetchResourceShares("OTHER-ACCOUNTS"),
    fetchInvitations(),
  ]);

  const shares = sharesRes.success ? sharesRes.data : [];
  const invitations = invRes.success ? invRes.data : [];

  return <SharedWithMeClient shares={shares} invitations={invitations} />;
}
