/**
 * Root layout – No permanent sidebar. Just top bar + content.
 * Uses Inter font (closest match to Amazon Ember used by real AWS Console).
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import TopBar from "@/components/TopBar";
import { sts } from "@/lib/aws";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { getActiveIdentity } from "@/lib/identity";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mini AWS Console",
  description: "A local AWS console for the AWS Emulator",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let accountId = "000000000000";
  let userName = "emulator";
  const region = process.env.AWS_REGION || "us-east-1";

  try {
    const res = await sts.send(new GetCallerIdentityCommand({}));
    accountId = res.Account ?? accountId;
    const arnParts = (res.Arn ?? "").split("/");
    userName = arnParts[arnParts.length - 1] || userName;
  } catch {
    // Use defaults if STS fails
  }

  // Load the active identity from session cookies
  const activeIdentity = await getActiveIdentity();
  if (activeIdentity && activeIdentity.name && activeIdentity.type !== "admin") {
    userName = activeIdentity.name;
  }

  return (
    <html lang="en" className={inter.className}>
      <body>
        <Script
          id="perf-measure-fix"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined" && window.performance && window.performance.measure) {
                const _origMeasure = window.performance.measure.bind(window.performance);
                window.performance.measure = function (name, startMarkOrOptions, endMark) {
                  try {
                    return _origMeasure(name, startMarkOrOptions, endMark);
                  } catch (e) {
                    return undefined;
                  }
                };
              }
            `,
          }}
        />
        <TopBar
          accountId={accountId}
          userName={userName}
          region={region}
          initialIdentity={activeIdentity}
        />
        <div className="mt-[40px]">{children}</div>
      </body>
    </html>
  );
}
