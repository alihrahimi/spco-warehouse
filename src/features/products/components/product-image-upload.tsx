"use client";

import { useQueryClient } from "@tanstack/react-query";
import { PackageSearch, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";
import { deleteProductImageAction, uploadProductImageAction } from "@/features/products/actions";

export function ProductImageUpload({
  productId,
  imageFilePath,
  canEdit = true,
}: {
  productId: string;
  imageFilePath: string | null;
  /** View-only roles (`products:view` without `products:edit`, e.g. Warehouse Staff) still see the photo — just not the upload/delete controls. */
  canEdit?: boolean;
}) {
  const [currentImage, setCurrentImage] = useState(imageFilePath);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const router = useRouter();

  /**
   * The stale-image bug lived HERE, not in storage: every upload already
   * writes a fresh immutable UUID filename and updates the DB path, so the
   * server is never stale. But the OLD path kept living in client caches —
   * React Query's product list / order grid / accounting-helper queries all
   * hold `imageFilePath`, and the browser's HTTP cache happily keeps
   * serving the old URL's image (even after its file is deleted server-
   * side) to whoever still renders that old path. So the previous photo
   * survived until some unrelated remount refetched. Flushing the React
   * Query cache wholesale plus refreshing the server-component tree the
   * instant an image changes makes every consumer pick up the NEW path
   * immediately — and a new path can never be served stale, because no
   * cache anywhere has ever seen it.
   */
  function invalidateEveryImageConsumer() {
    void queryClient.invalidateQueries();
    router.refresh();
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("image", file);

    setIsUploading(true);
    const result = await uploadProductImageAction(productId, formData);
    setIsUploading(false);
    event.target.value = "";

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setCurrentImage(result.data.imageFilePath);
    invalidateEveryImageConsumer();
    toast.success("تصویر بروزرسانی شد");
  }

  async function handleDelete() {
    const confirmed = await confirm({
      title: "تصویر محصول حذف شود؟",
      variant: "delete",
      confirmLabel: "حذف",
    });
    if (!confirmed) return;

    const result = await deleteProductImageAction(productId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setCurrentImage(null);
    invalidateEveryImageConsumer();
    toast.success("تصویر حذف شد");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex size-40 items-center justify-center overflow-hidden rounded-large border border-border bg-disabled">
        {currentImage ? (
          // unoptimized: /uploads/* is auth-protected, which breaks the
          // cookie-less /_next/image optimizer fetch — see invoice-view.tsx.
          <Image src={currentImage} alt="تصویر محصول" fill sizes="160px" unoptimized className="object-cover" />
        ) : (
          <PackageSearch className="size-10 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {canEdit ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelected}
          />

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="compact" loading={isUploading} onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
              {currentImage ? "تغییر تصویر" : "افزودن تصویر"}
            </Button>
            {currentImage ? (
              <Button type="button" variant="ghost" size="compact" onClick={handleDelete}>
                <Trash2 className="size-4" />
                حذف
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
