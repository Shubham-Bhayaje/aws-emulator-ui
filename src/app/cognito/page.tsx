import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "User pools", href: "/cognito" },
  { label: "Identity pools", href: "/cognito/identity-pools" },
];

export default function CognitoPage() {
  return (
    <ServiceLayout serviceName="Cognito" serviceColor="#DD3522" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">User pools</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon Cognito lets you add user sign-up, sign-in, and access control to your apps.
      </p>
      <ComingSoon
        serviceName="Cognito"
        description="Create user pools and identity pools. Add authentication, authorization, and user management to your web and mobile apps."
      />
    </ServiceLayout>
  );
}
