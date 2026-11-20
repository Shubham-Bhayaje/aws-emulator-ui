import { fetchPermissions } from "../actions";
import PermissionsLibraryClient from "./PermissionsLibraryClient";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const res = await fetchPermissions();
  const permissions = res.success ? res.data : [];

  return <PermissionsLibraryClient initialPermissions={permissions} />;
}
