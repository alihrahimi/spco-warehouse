import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse, type NextRequest } from "next/server";

import { requirePermission } from "@/lib/auth/session";

const execFileAsync = promisify(execFile);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * XPS → PDF conversion (SCREEN-SPECS.md §17: stateless file-in/file-out,
 * no database record). XPS is a Microsoft print format with no viable
 * pure-JS converter, so this shells out to GhostXPS (`gxps`, part of the
 * Ghostscript family) — a real conversion, with the binary as a documented
 * VPS provisioning step (`apt install ghostscript` provides it on Debian/
 * Ubuntu), same flagged-system-dependency pattern as Playwright's
 * Chromium. Missing binary fails fast with a clear Persian error.
 *
 * Temp files live in the OS temp dir under random UUID names and are
 * removed in `finally` — nothing persists server-side.
 */
export async function POST(request: NextRequest) {
  await requirePermission("utilities:use");

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "فایلی انتخاب نشده است" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".xps")) {
    return NextResponse.json({ error: "فایل انتخاب‌شده باید با پسوند .xps باشد" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "حجم فایل نباید بیشتر از ۲۵ مگابایت باشد" }, { status: 400 });
  }

  const workDirectory = path.join(os.tmpdir(), `xps-${randomUUID()}`);
  const inputPath = path.join(workDirectory, "input.xps");
  const outputPath = path.join(workDirectory, "output.pdf");

  try {
    await mkdir(workDirectory, { recursive: true });
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

    try {
      await execFileAsync("gxps", ["-sDEVICE=pdfwrite", `-sOutputFile=${outputPath}`, "-dNOPAUSE", "-dBATCH", inputPath], {
        timeout: 120_000,
      });
    } catch (error) {
      const isMissingBinary = (error as NodeJS.ErrnoException).code === "ENOENT";
      console.error("gxps conversion failed:", error);
      return NextResponse.json(
        {
          error: isMissingBinary
            ? "موتور تبدیل XPS روی سرور نصب نشده است (بسته ghostscript). با مدیر سیستم تماس بگیرید."
            : "تبدیل با خطا مواجه شد. از سالم بودن فایل XPS مطمئن شوید و دوباره تلاش کنید.",
        },
        { status: isMissingBinary ? 501 : 422 },
      );
    }

    const pdf = await readFile(outputPath);
    const downloadName = `${file.name.replace(/\.xps$/i, "")}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadName)}"`,
      },
    });
  } finally {
    await rm(workDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
}
