"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PackageSearch, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProductStatusBadge } from "@/components/shared/product-status-badge";
import { formatJalaliNumeric } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { cn } from "@/lib/utils";
import type { ProductListRow } from "@/features/products/services";

export function getProductListColumns(onToggleFavorite: (productId: string, next: boolean) => void): ColumnDef<ProductListRow>[] {
  return [
    {
      id: "favorite",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          aria-label={row.original.isFavorite ? "حذف از موردعلاقه‌ها" : "افزودن به موردعلاقه‌ها"}
          onClick={() => onToggleFavorite(row.original.id, !row.original.isFavorite)}
          className="flex size-8 items-center justify-center rounded-small hover:bg-hover"
        >
          <Star className={cn("size-4", row.original.isFavorite ? "fill-warning text-warning" : "text-muted-foreground")} />
        </button>
      ),
    },
    {
      id: "photo",
      header: "تصویر",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="relative size-12 overflow-hidden rounded-medium bg-disabled">
          {row.original.imageFilePath ? (
            // unoptimized: /uploads/* is auth-protected, which breaks the
            // cookie-less /_next/image optimizer fetch — see invoice-view.tsx.
            <Image src={row.original.imageFilePath} alt={row.original.name} fill sizes="48px" unoptimized className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <PackageSearch className="size-5 text-muted-foreground" />
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "نام محصول",
      cell: ({ row }) => (
        <Link href={`/products/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "productCode",
      header: "کد محصول",
      cell: ({ row }) => <span dir="ltr">{row.original.productCode}</span>,
    },
    {
      accessorKey: "isActive",
      header: "وضعیت",
      enableSorting: false,
      cell: ({ row }) => <ProductStatusBadge isActive={row.original.isActive} />,
    },
    {
      id: "pieceCount",
      header: "تعداد قطعه‌ها",
      enableSorting: false,
      cell: ({ row }) => toPersianDigits(row.original.pieceCount),
    },
    {
      accessorKey: "updatedAt",
      header: "آخرین بروزرسانی",
      cell: ({ row }) => formatJalaliNumeric(new Date(row.original.updatedAt)),
    },
  ];
}
