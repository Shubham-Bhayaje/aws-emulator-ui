/**
 * src/app/ec2/ami-catalog/page.tsx – AWS AMI Catalog.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import Link from "next/link";

export default function AMICatalogPage() {
  const catalogAmis = [
    {
      name: "Amazon Linux 2023 AMI",
      desc: "Provided by Amazon Web Services. Comes with high performance Linux kernel, AWS CLI, and cloud-init.",
      amiId: "ami-0c7217cdde317cfec",
      platform: "Linux/UNIX",
      architecture: "x86_64, arm64",
    },
    {
      name: "Ubuntu Server 22.04 LTS",
      desc: "Canonical Ubuntu 22.04 LTS standard enterprise cloud image with 5 years of standard security support.",
      amiId: "ami-0453ec754f44f9a4a",
      platform: "Ubuntu",
      architecture: "x86_64, arm64",
    },
    {
      name: "Red Hat Enterprise Linux 9",
      desc: "Enterprise-grade stability and enterprise packages validated by Red Hat.",
      amiId: "ami-0fe630eb857a6ec83",
      platform: "Red Hat",
      architecture: "x86_64",
    },
    {
      name: "Debian 12 (Bookworm)",
      desc: "Community Debian GNU/Linux lightweight universal distribution image.",
      amiId: "ami-058bd2d568351da34",
      platform: "Debian",
      architecture: "x86_64",
    },
  ];

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">AMI Catalog</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Discover and launch verified machine images from Amazon, Quick Start distributions, and AWS Marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalogAmis.map((ami) => (
            <div
              key={ami.amiId}
              className="bg-white border border-[#d5dbdb] rounded-sm p-5 flex flex-col justify-between awsui-shadow hover:border-[#aab7b8] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[15px] font-bold text-[#16191f]">{ami.name}</h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-[#f2f3f3] border border-[#d5dbdb] rounded text-[#545b64]">
                    {ami.platform}
                  </span>
                </div>
                <p className="text-[12px] text-[#545b64] leading-relaxed mb-4">{ami.desc}</p>
                <div className="text-[12px] text-[#545b64] space-y-1 border-t border-[#eaeded] pt-3">
                  <div>
                    AMI ID: <span className="font-mono text-[#0073bb] font-semibold">{ami.amiId}</span>
                  </div>
                  <div>Architecture: <span className="font-mono">{ami.architecture}</span></div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#eaeded] flex justify-end">
                <Link
                  href="/ec2/launch"
                  className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[12px] font-medium hover:bg-[#eb5f07]"
                >
                  Launch instance with AMI
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ServiceLayout>
  );
}
