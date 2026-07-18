"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import Link from "next/link";

import { CustomerStatusBadge } from "@/components/shared/customer-status-badge";
import { formatToman } from "@/lib/format/currency";
import { formatJalaliNumeric } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { cn } from "@/lib/utils";
import type { CustomerListRow } from "@/features/customers/services";

const PAYMENT_TYPE_LABELS_FA: Record<string, string> = {
  cash: "نقدی",
  cheque: "چک",
};

export function getCustomerListColumns(onToggleFavorite: (customerId: string, next: boolean) => void): ColumnDef<CustomerListRow>[] {
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
          <Star
            className={cn("size-4", row.original.isFavorite ? "fill-warning text-warning" : "text-muted-foreground")}
          />
        </button>
      ),
    },
    {
      accessorKey: "customerCode",
      header: "کد مشتری",
      cell: ({ row }) => <span dir="ltr">{row.original.customerCode}</span>,
    },
    {
      accessorKey: "name",
      header: "نام مشتری",
      cell: ({ row }) => (
        <Link href={`/customers/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "mobile",
      header: "شماره موبایل",
      enableSorting: false,
      cell: ({ row }) => <span dir="ltr">{toPersianDigits(row.original.mobile)}</span>,
    },
    {
      accessorKey: "defaultPaymentType",
      header: "نوع پرداخت",
      enableSorting: false,
      cell: ({ row }) => PAYMENT_TYPE_LABELS_FA[row.original.defaultPaymentType] ?? row.original.defaultPaymentType,
    },
    {
      accessorKey: "lastOrderDate",
      header: "آخرین سفارش",
      cell: ({ row }) => (row.original.lastOrderDate ? formatJalaliNumeric(new Date(row.original.lastOrderDate)) : "—"),
    },
    {
      id: "outstandingBalance",
      header: "مانده حساب",
      enableSorting: false,
      cell: ({ row }) => {
        const balance = Number(row.original.outstandingBalance);
        return (
          <span className={balance > 0 ? "font-medium text-warning" : "text-foreground-secondary"}>
            {formatToman(balance)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "وضعیت",
      enableSorting: false,
      cell: ({ row }) => <CustomerStatusBadge status={row.original.status} />,
    },
  ];
}
