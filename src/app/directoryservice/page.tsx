import { describeDirectoriesAction } from "./actions";
import { DirectoriesClient } from "./DirectoriesClient";

export const dynamic = "force-dynamic";

export default async function DirectoryServicePage() {
  const res = await describeDirectoriesAction();
  return <DirectoriesClient initialDirectories={res.directories || []} />;
}
