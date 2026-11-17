import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Environments", href: "/elasticbeanstalk" }];

export default function ElasticBeanstalkPage() {
  return (
    <ServiceLayout serviceName="Elastic Beanstalk" serviceColor="#EC7211" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Environments</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS Elastic Beanstalk makes it easy to deploy, manage, and scale web applications.
      </p>
      <ComingSoon
        serviceName="Elastic Beanstalk"
        description="Deploy and manage web applications and services. Simply upload your code and Elastic Beanstalk handles deployment, capacity provisioning, and load balancing."
      />
    </ServiceLayout>
  );
}
