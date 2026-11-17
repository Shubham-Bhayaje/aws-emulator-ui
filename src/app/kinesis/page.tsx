import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Data streams", href: "/kinesis" },
  { label: "Delivery streams", href: "/kinesis/delivery-streams" },
];

export default function KinesisPage() {
  return (
    <ServiceLayout serviceName="Kinesis" serviceColor="#8B5CF6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Data streams</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon Kinesis makes it easy to collect, process, and analyze real-time streaming data.
      </p>
      <ComingSoon
        serviceName="Kinesis"
        description="Create and manage data streams. Collect and process large streams of data records in real time for analytics, machine learning, and more."
      />
    </ServiceLayout>
  );
}
