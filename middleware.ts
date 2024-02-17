import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";
import {getSession} from "next-auth/react";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  let session = await getSession();
  if (req.nextUrl.pathname.startsWith("/auth")) {
    // This logic is only applied to /about
    if (session?.user) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  if (req.nextUrl.pathname.startsWith("/checkout")) {
    // This logic is only applied to /about
    if (!session.data.session?.user) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher:['/auth/login','/auth/signup'],
}
