import Link from "next/link";

export default function PublicRepositoriesPage() {
  const publicShowcase = [
    {
      name: "amazonlinux",
      description: "Official Amazon Linux container images provided by AWS",
      stars: "2.4k",
      downloads: "1B+",
      url: "public.ecr.aws/amazonlinux/amazonlinux",
    },
    {
      name: "aws-cli",
      description: "Official AWS Command Line Interface version 2 container image",
      stars: "980",
      downloads: "250M+",
      url: "public.ecr.aws/aws-cli/aws-cli",
    },
    {
      name: "lambda/nodejs",
      description: "Base images for Node.js AWS Lambda functions",
      stars: "1.1k",
      downloads: "500M+",
      url: "public.ecr.aws/lambda/nodejs",
    },
    {
      name: "lambda/python",
      description: "Base images for Python AWS Lambda functions",
      stars: "1.3k",
      downloads: "600M+",
      url: "public.ecr.aws/lambda/python",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/" className="hover:text-[#0073bb]">
          Console Home
        </Link>
        <span>/</span>
        <Link href="/ecr/repositories" className="hover:text-[#0073bb]">
          Amazon ECR
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-semibold">Public repositories</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">
            Amazon ECR Public Gallery
          </h1>
          <p className="text-[13px] text-[#545b64]">
            Share your container software publicly with developers worldwide or browse trusted container images from AWS and verified publishers.
          </p>
        </div>

        <Link
          href="/ecr/repositories/create"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] transition-colors shadow-xs flex items-center"
        >
          Create repository
        </Link>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4 space-y-1.5 shadow-xs">
          <div className="font-bold text-[14px] text-[#16191f]">
            Global public access
          </div>
          <p className="text-[12px] text-[#545b64] leading-relaxed">
            Public repositories can be pulled by anyone, anywhere with or without an AWS account or credentials.
          </p>
        </div>
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4 space-y-1.5 shadow-xs">
          <div className="font-bold text-[14px] text-[#16191f]">
            Generous free bandwidth
          </div>
          <p className="text-[12px] text-[#545b64] leading-relaxed">
            AWS provides free data transfer out for all public image downloads, with unlimited bandwidth for workloads running in AWS.
          </p>
        </div>
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4 space-y-1.5 shadow-xs">
          <div className="font-bold text-[14px] text-[#16191f]">
            Verified publisher badges
          </div>
          <p className="text-[12px] text-[#545b64] leading-relaxed">
            Public galleries showcase official software vendor certificates, usage metrics, and multi-architecture image artifacts.
          </p>
        </div>
      </div>

      {/* Featured Public Repositories */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
        <div className="border-b border-[#eaeded] pb-3">
          <h2 className="text-[16px] font-bold text-[#16191f]">
            Popular public container images
          </h2>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Pre-built base images maintained by AWS and ready to use in your Dockerfiles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {publicShowcase.map((p) => (
            <div
              key={p.name}
              className="p-4 border border-[#eaeded] rounded-sm hover:border-[#0073bb] bg-[#fafafa] space-y-2 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[14px] text-[#0073bb]">
                  {p.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e6f4ea] text-[#137333] border border-[#a2dca0]">
                  Official
                </span>
              </div>
              <p className="text-[12px] text-[#545b64]">{p.description}</p>
              <div className="pt-1 font-mono text-[11px] text-[#16191f] bg-white p-2 border border-[#eaeded] rounded-sm break-all">
                docker pull {p.url}:latest
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
