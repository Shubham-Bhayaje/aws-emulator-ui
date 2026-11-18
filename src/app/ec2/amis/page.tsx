/**
 * src/app/ec2/amis/page.tsx – Amazon Machine Images (AMIs).
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function AMIsPage() {
  const sampleAmis = [
    {
      "AMI ID": "ami-0c7217cdde317cfec",
      "AMI Name": "al2023-ami-2023.6.20250128.0-kernel-6.1-x86_64",
      "Source": "amazon/al2023-ami",
      "Owner": "137112412989 (Amazon)",
      "Status": "available",
      "Platform": "Linux/UNIX",
      "Architecture": "x86_64",
      "Creation date": "2025-01-28",
    },
    {
      "AMI ID": "ami-0453ec754f44f9a4a",
      "AMI Name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server",
      "Source": "canonical/ubuntu",
      "Owner": "099720109477 (Canonical)",
      "Status": "available",
      "Platform": "Ubuntu",
      "Architecture": "x86_64",
      "Creation date": "2025-01-15",
    },
  ];

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="AMIs"
        description="An Amazon Machine Image (AMI) provides the information required to launch an instance."
        primaryActionLabel="Launch instance from AMI"
        primaryActionHref="/ec2/launch"
        columns={["AMI ID", "AMI Name", "Source", "Owner", "Status", "Platform", "Architecture", "Creation date"]}
        rows={sampleAmis}
      />
    </ServiceLayout>
  );
}
