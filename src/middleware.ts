import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALIAS_REDIRECTS: Record<string, string> = {
  "/certificatemanager": "/acm",
  "/certificate-manager": "/acm",
  "/certificate_manager": "/acm",
  "/acm/home": "/acm",
  "/directory-services": "/directoryservice",
  "/directory-service": "/directoryservice",
  "/ds": "/directoryservice",
  "/cloudhsm/clusters": "/cloudhsm",
  "/cloudhsm/home": "/cloudhsm",
  "/pca": "/acm/pca",
  "/acm-pca": "/acm/pca",
  "/private-ca": "/acm/pca",
  "/s3glacier": "/glacier",
  "/s3-glacier": "/glacier",
  "/s3_glacier": "/glacier",
  "/glacier/vaults": "/glacier",
  "/glaciervaults": "/glacier",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cleanPath = pathname.toLowerCase().replace(/\/$/, "");

  if (ALIAS_REDIRECTS[cleanPath]) {
    const destination = ALIAS_REDIRECTS[cleanPath];
    return NextResponse.redirect(new URL(destination, request.url), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
