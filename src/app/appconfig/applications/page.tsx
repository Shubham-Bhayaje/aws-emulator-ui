import { listApplicationsAction } from "../actions";
import ApplicationsClient from "./ApplicationsClient";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const res = await listApplicationsAction();
  const applications = res.success && res.items ? res.items : [];

  return <ApplicationsClient initialApplications={applications} />;
}
