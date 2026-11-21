/**
 * src/app/acm/pca/page.tsx – AWS Private CA Dashboard page.
 * Loads live certificate authorities from the emulator server-side.
 */

import { PcaClient } from "./PcaClient";
import { listCertificateAuthoritiesAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PcaPage() {
  const res = await listCertificateAuthoritiesAction();
  const initialCas = res.success ? res.certificateAuthorities : [];

  return <PcaClient initialCas={initialCas} />;
}
