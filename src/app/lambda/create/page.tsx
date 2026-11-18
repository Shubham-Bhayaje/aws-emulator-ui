/**
 * src/app/lambda/create/page.tsx – Create Function Wizard Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { lambdaNav } from "@/components/lambda/LambdaNav";
import CreateFunctionWizard from "@/components/lambda/CreateFunctionWizard";

export default function CreateFunctionPage() {
  return (
    <ServiceLayout serviceName="Lambda" serviceColor="#EC7211" navItems={lambdaNav}>
      <CreateFunctionWizard />
    </ServiceLayout>
  );
}
