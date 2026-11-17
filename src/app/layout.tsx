/**
 * Root layout – No permanent sidebar. Just top bar + content.
 * Uses Inter font (closest match to Amazon Ember used by real AWS Console).
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import { sts } from "@/lib/aws";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";

// Inter is the closest publicly available match to Amazon Ember
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

  return (
    <html lang="en" className={inter.className}>
      <body>
        <TopBar accountId={accountId} userName={userName} region={region} />
        <div className="mt-[40px]">{children}</div>
      </body>
    </html>
  );
}
