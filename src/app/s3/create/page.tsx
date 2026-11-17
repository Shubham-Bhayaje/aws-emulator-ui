/**
 * Create Bucket page – matches the real AWS Console's "Create bucket" form.
 * Shows General configuration, Block Public Access, Bucket Versioning sections.
 */

import ServiceLayout from "@/components/ServiceLayout";
import Link from "next/link";
import { createBucket } from "../actions";
import { CreateBucketForm } from "./CreateBucketForm";

const s3Nav = [{ label: "Buckets", href: "/s3" }];

export default function CreateBucketPage() {
  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <div className="max-w-[800px]">
        <h1 className="text-[22px] font-bold text-[#16191f] mb-6">Create bucket</h1>
        <CreateBucketForm action={createBucket} />
      </div>
    </ServiceLayout>
  );
}
