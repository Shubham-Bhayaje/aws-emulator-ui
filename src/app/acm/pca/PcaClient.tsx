/**
 * src/app/acm/pca/PcaClient.tsx – AWS Private CA view in ACM console.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import Link from "next/link";

export function PcaClient() {
  return (
    <div style={{ padding: "20px 24px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: "12px", color: "#687078", marginBottom: "16px" }}>
        <Link href="/acm" style={{ color: "#0073bb", textDecoration: "none" }}>
          Certificate Manager
        </Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "#16191f" }}>AWS Private CA</span>
      </nav>

      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#16191f", margin: 0 }}>
            AWS Private Certificate Authority
          </h1>
          <p style={{ fontSize: "14px", color: "#687078", margin: "4px 0 0 0" }}>
            Create and manage private certificate authorities to issue and revoke certificates for internal network communication and microservices.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/acm/request"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 16px",
              height: "32px",
              minHeight: "32px",
              maxHeight: "32px",
              whiteSpace: "nowrap",
              fontSize: "13px",
              fontWeight: "600",
              color: "#ffffff",
              backgroundColor: "#ec7211",
              border: "1px solid #ec7211",
              borderRadius: "4px",
              textDecoration: "none",
            }}
          >
            Request a certificate
          </Link>
        </div>
      </div>

      {/* Info Banner */}
      <div
        style={{
          backgroundColor: "#f2f8fd",
          border: "1px solid #0073bb",
          borderLeft: "5px solid #0073bb",
          borderRadius: "4px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#16191f",
          lineHeight: "1.5",
        }}
      >
        <strong style={{ display: "block", marginBottom: "4px", color: "#0073bb" }}>
          AWS Private CA Integration
        </strong>
        AWS Certificate Manager integrates directly with AWS Private CA. When you request a private certificate in ACM, ACM issues the certificate using your selected private certificate authority and manages automatic renewal.
      </div>

      {/* Main Content Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #eaeded",
          borderRadius: "4px",
          boxShadow: "0 1px 1px 0 rgba(0,28,36,0.1)",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#16191f", marginTop: 0, marginBottom: "12px" }}>
          Private certificate authorities (0)
        </h2>
        <p style={{ fontSize: "13px", color: "#687078", marginBottom: "20px" }}>
          You do not have any active private certificate authorities configured in this Region.
        </p>

        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px dashed #d5dbdb",
            borderRadius: "4px",
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#16191f", marginBottom: "8px" }}>
              How AWS Private CA works with ACM
            </h3>
            <p style={{ fontSize: "13px", color: "#545b64", lineHeight: "1.6", marginBottom: "20px" }}>
              AWS Private CA provides highly-available private CA infrastructure in the cloud. ACM issues end-entity certificates signed by your private CA that can be deployed to AWS services such as Elastic Load Balancing, API Gateway, and CloudFront, or exported for use on on-premises servers.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <Link
                href="/acm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 16px",
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#16191f",
                  backgroundColor: "#ffffff",
                  border: "1px solid #aab7b8",
                  borderRadius: "4px",
                  textDecoration: "none",
                }}
              >
                Back to Certificates
              </Link>
              <Link
                href="/acm/request"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 16px",
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#ffffff",
                  backgroundColor: "#ec7211",
                  border: "1px solid #ec7211",
                  borderRadius: "4px",
                  textDecoration: "none",
                }}
              >
                Request certificate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
