/**
 * src/app/ec2/launch-templates/create/page.tsx – Create Launch Template Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import CreateLaunchTemplateWizard from "@/components/ec2/CreateLaunchTemplateWizard";
import {
  fetchLiveSecurityGroups,
  fetchLiveKeyPairs,
  fetchLiveLaunchTemplates,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function CreateLaunchTemplatePage() {
  const [sgRes, kpRes, ltRes] = await Promise.all([
    fetchLiveSecurityGroups(),
    fetchLiveKeyPairs(),
    fetchLiveLaunchTemplates(),
  ]);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <CreateLaunchTemplateWizard
        initialSecurityGroups={sgRes.securityGroups}
        initialKeyPairs={kpRes.keyPairs}
        existingTemplates={ltRes.templates.map((t) => ({ id: t.id, name: t.name }))}
      />
    </ServiceLayout>
  );
}
