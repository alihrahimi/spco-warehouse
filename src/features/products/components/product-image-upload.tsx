"use client";

import { PackageSearch, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";
import { deleteProductImageAction, uploadProductImageAction } from "@/features/products/actions";

export function ProductImageUpload({ productId, imageFilePath }: { productId: string; imageFilePath: string | null }) {
  const [currentImage, setCurrentImage] = useState(imageFilePath);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirmDialog();

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
    toast.success("تصویر حذف شد");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex size-40 items-center justify-center overflow-hidden rounded-large border border-border bg-disabled">
        {currentImage ? (
          <Image src={currentImage} alt="تصویر محصول" fill sizes="160px" className="object-cover" />
        ) : (
          <PackageSearch className="size-10 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

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
    </div>
  );
}
