"use client";

import { Download, FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { toast } from "@/components/ui/toast";

/**
 * SCREEN-SPECS.md §18 (XPS→PDF): choose file → convert (with a visible
 * progress state — a frozen-looking screen erodes trust for this
 * audience) → download. Stateless; the server keeps nothing.
 */
export default function XpsToPdfPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>("");

  async function handleConvert() {
    if (!selectedFile) {
      toast.error("ابتدا فایل XPS را انتخاب کنید");
      return;
    }

    setIsConverting(true);
    setResultUrl(null);

    const formData = new FormData();
    formData.set("file", selectedFile);

    try {
      const response = await fetch("/api/utilities/xps-to-pdf", { method: "POST", body: formData });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? "تبدیل با خطا مواجه شد. دوباره تلاش کنید.");
        return;
      }

      const blob = await response.blob();
      setResultUrl(URL.createObjectURL(blob));
      setResultName(selectedFile.name.replace(/\.xps$/i, "") + ".pdf");
      toast.success("تبدیل با موفقیت انجام شد");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.");
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "ابزارها", href: "/utilities" }, { label: "تبدیل XPS به PDF" }]} />
        <h1 className="text-h2 font-semibold text-foreground">تبدیل XPS به PDF</h1>

        <Card className="flex max-w-xl flex-col items-center gap-4 py-10">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xps"
            className="hidden"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] ?? null);
              setResultUrl(null);
            }}
          />

          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="size-5" />
            {selectedFile ? selectedFile.name : "انتخاب فایل XPS..."}
          </Button>

          <Button type="button" loading={isConverting} disabled={!selectedFile} onClick={handleConvert}>
            تبدیل به PDF
          </Button>

          {isConverting ? (
            <p className="flex items-center gap-2 text-body-small text-foreground-secondary">
              <Loader2 className="size-4 animate-spin" />
              در حال تبدیل...
            </p>
          ) : null}

          {resultUrl ? (
            <Button asChild variant="success">
              <a href={resultUrl} download={resultName}>
                <Download className="size-5" />
                دانلود فایل PDF
              </a>
            </Button>
          ) : null}
        </Card>
      </div>
    </PageContainer>
  );
}
