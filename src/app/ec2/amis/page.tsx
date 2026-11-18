/**
 * src/app/ec2/amis/page.tsx – Amazon Machine Images (AMIs).
 * Connected to live AWS Emulator via fetchLiveAmis action.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";
import { fetchLiveAmis } from "../actions";

export const dynamic = "force-dynamic";

export default async function AMIsPage() {
  const { amis } = await fetchLiveAmis();

  const rows = amis.map((a) => ({
    "AMI ID": a.id,
    "AMI Name": a.name,
    "Owner": a.owner,
    "Status": a.state,
    "Platform": a.platform,
    "Architecture": a.architecture,
    "Creation date": a.creationDate,
  }));

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="AMIs"
        description="An Amazon Machine Image (AMI) provides the information required to launch an instance."
        primaryActionLabel="Launch instance from AMI"
        primaryActionHref="/ec2/launch"
        columns={["AMI ID", "AMI Name", "Owner", "Status", "Platform", "Architecture", "Creation date"]}
        rows={rows}
        emptyTitle="No AMIs found"
        emptyDescription="You have not created or registered any private AMIs in region us-east-1 on this emulator."
      />
    </ServiceLayout>
  );
}
