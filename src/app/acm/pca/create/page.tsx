/**
 * src/app/acm/pca/create/page.tsx – Create Private CA page.
 * Loads live S3 buckets for CRL configuration dropdown dynamically.
 */

import { CreateCaWizardClient } from "./CreateCaWizardClient";
import { fetchS3BucketsForCrlAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function CreateCaPage() {
  const bucketsRes = await fetchS3BucketsForCrlAction();
  const availableBuckets = bucketsRes.success ? bucketsRes.buckets : [];

  return <CreateCaWizardClient availableBuckets={availableBuckets} />;
}
