import Link from "next/link";
import {
  describeRepositoryAction,
  describeImagesAction,
  getRepositoryPolicyAction,
  getLifecyclePolicyAction,
  listTagsForResourceAction,
} from "../../actions";
import RepositoryDetailClient from "./RepositoryDetailClient";

export const dynamic = "force-dynamic";

interface RepositoryPageProps {
  params: Promise<{ name: string }>;
}

export default async function RepositoryDetailPage({ params }: RepositoryPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const repoRes = await describeRepositoryAction(decodedName);
  if (!repoRes.success || !repoRes.repository) {
    return (
      <div className="space-y-4 max-w-[800px]">
        <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#0073bb]">
            Console Home
          </Link>
          <span>/</span>
          <Link href="/ecr/repositories" className="hover:text-[#0073bb]">
            Private repositories
          </Link>
          <span>/</span>
          <span className="text-[#16191f] font-semibold">{decodedName}</span>
        </div>

        <div className="bg-white border border-[#d5dbdb] rounded-sm p-12 text-center space-y-3">
          <h1 className="text-[18px] font-bold text-[#16191f]">
            Repository not found
          </h1>
          <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
            The repository <span className="font-mono font-bold text-[#16191f]">{decodedName}</span> does not exist or has been deleted.
          </p>
          <div className="pt-2">
            <Link
              href="/ecr/repositories"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07]"
            >
              Back to repositories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [imagesRes, policyRes, lcpRes, tagsRes] = await Promise.all([
    describeImagesAction(decodedName),
    getRepositoryPolicyAction(decodedName),
    getLifecyclePolicyAction(decodedName),
    repoRes.repository.repositoryArn
      ? listTagsForResourceAction(repoRes.repository.repositoryArn)
      : Promise.resolve({ success: true, tags: [] }),
  ]);

  return (
    <RepositoryDetailClient
      repository={repoRes.repository}
      images={imagesRes.images || []}
      policyText={policyRes.policyText}
      lifecyclePolicyText={lcpRes.lifecyclePolicyText}
      tags={tagsRes.tags || []}
    />
  );
}
