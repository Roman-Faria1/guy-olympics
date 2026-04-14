import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import {
  createAdminSupabaseClient,
  getSupabaseStorageBucket,
  hasSupabaseServerConfig,
} from "@/lib/supabase";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const competitionSlug = formData.get("competitionSlug");
  const file = formData.get("file");

  if (typeof competitionSlug !== "string") {
    return NextResponse.json({ error: "competitionSlug is required" }, { status: 400 });
  }

  const unauthorized = await requireAdmin(competitionSlug);
  if (unauthorized) {
    return unauthorized;
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (hasSupabaseServerConfig()) {
    const supabase = createAdminSupabaseClient();
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const filename = `${competitionSlug}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase
      .storage
      .from(getSupabaseStorageBucket())
      .upload(filename, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error:
            "Supabase upload failed. Make sure the storage bucket exists and is public.",
          details: uploadError.message,
        },
        { status: 500 },
      );
    }

    const { data } = supabase.storage.from(getSupabaseStorageBucket()).getPublicUrl(filename);
    return NextResponse.json({ photoPath: data.publicUrl });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ photoPath: `/uploads/${filename}` });
}
