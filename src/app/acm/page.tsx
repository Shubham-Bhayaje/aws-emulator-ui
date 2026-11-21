import { fetchCertificatesAction } from "./actions";
import { CertificatesClient } from "./CertificatesClient";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const result = await fetchCertificatesAction();

  return <CertificatesClient initialCertificates={result.certificates || []} />;
}
