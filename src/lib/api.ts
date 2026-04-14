import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";

export async function requireAdmin(slug: string) {
  const authenticated = await isAdminAuthenticated(slug);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
