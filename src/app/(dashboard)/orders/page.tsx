"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, type StatusBadgeStatus } from "@/components/shared/status-badge";
import { DataTable } from "@/components/table/data-table";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import type { OrderStatus } from "@/lib/enums";
import { formatToman } from "@/lib/format/currency";
import { formatJalaliNumeric } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { listOrdersAction } from "@/features/orders/actions";
import type { OrderListRow } from "@/features/orders/services";
import type { OrderSearchInput } from "@/features/orders/schemas/order.schema";

const PAGE_SIZE = 20;

/** Chip set defaults to the actionable list — Completed/Cancelled reachable via their chips, per UX-FLOW.md's Order List rule. */
const STATUS_CHIPS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "draft", label: "پیش‌نویس‌ها" },
  { value: "pre_invoice_generated", label: "پیش‌فاکتور صادر شده" },
  { value: "pending_payment", label: "در انتظار پرداخت" },
  { value: "preparing", label: "در حال آماده‌سازی" },
  { value: "ready", label: "آماده ارسال" },
  { value: "completed", label: "تکمیل‌شده" },
  { value: "cancelled", label: "لغوشده" },
];

const PAYMENT_CHIPS: { value: NonNullable<OrderSearchInput["paymentStatus"]> | "all"; label: string }[] = [
  { value: "all", label: "همه پرداخت‌ها" },
  { value: "unpaid", label: "پرداخت نشده" },
  { value: "partial", label: "پرداخت ناقص" },
  { value: "paid", label: "تسویه کامل" },
];

function paymentBadge(row: OrderListRow): StatusBadgeStatus {
  if (row.paidAmount === 0n) return "unpaid";
  return row.paidAmount >= row.totalAmount ? "fully_settled" : "partial_payment";
}

const columns: ColumnDef<OrderListRow>[] = [
  {
    accessorKey: "orderNumber",
    header: "شماره سفارش",
    enableSorting: false,
    cell: ({ row }) => (
      <Link href={`/orders/${row.original.id}`} className="font-medium text-primary hover:underline" dir="ltr">
        {row.original.orderNumber ?? "— پیش‌نویس —"}
      </Link>
    ),
  },
  {
    accessorKey: "customerName",
    header: "مشتری",
    enableSorting: false,
    cell: ({ row }) => (
      <span>
        {row.original.customerName}
        <span dir="ltr" className="ms-2 text-body-small text-muted-foreground">
          {row.original.customerCode}
        </span>
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "تاریخ",
    enableSorting: false,
    cell: ({ row }) => formatJalaliNumeric(new Date(row.original.createdAt)),
  },
  {
    accessorKey: "totalAmount",
    header: "مبلغ کل",
    enableSorting: false,
    cell: ({ row }) => formatToman(row.original.totalAmount),
  },
  {
    id: "remaining",
    header: "مانده",
    enableSorting: false,
    cell: ({ row }) => {
      const remaining = row.original.totalAmount - row.original.paidAmount;
      return (
        <span className={remaining > 0n ? "font-medium text-warning" : "text-foreground-secondary"}>{formatToman(remaining)}</span>
      );
    },
  },
  {
    id: "paymentStatus",
    header: "پرداخت",
    enableSorting: false,
    cell: ({ row }) => (row.original.status === "draft" ? "—" : <StatusBadge status={paymentBadge(row.original)} />),
  },
  {
    accessorKey: "status",
    header: "وضعیت",
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status as StatusBadgeStatus} />,
  },
];

export default function OrdersPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<(typeof PAYMENT_CHIPS)[number]["value"]>("all");
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  const searchParams: OrderSearchInput = {
    query: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    paymentStatus: paymentFilter === "all" ? undefined : paymentFilter,
    dateFrom: dateRange.from?.toISOString(),
    dateTo: dateRange.to?.toISOString(),
    page: pageIndex,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["orders", "list", searchParams],
    queryFn: async () => {
      const result = await listOrdersAction(searchParams);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    placeholderData: (previous) => previous,
    // Orders change constantly during a working day — much shorter
    // staleTime than the app-wide 30s default (FRONTEND-ARCHITECTURE.md §6).
    staleTime: 5 * 1000,
  });

  const pageCount = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="سفارش‌ها"
          actions={
            <Button asChild>
              <Link href="/orders/new">
                <Plus className="size-4" />
                سفارش جدید
              </Link>
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {STATUS_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => {
                setStatusFilter(chip.value);
                setPageIndex(0);
              }}
              className={cn(
                "h-10 rounded-full border px-4 text-body-small font-medium transition-colors",
                statusFilter === chip.value
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border bg-surface text-foreground-secondary hover:bg-hover",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PAYMENT_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => {
                setPaymentFilter(chip.value);
                setPageIndex(0);
              }}
              className={cn(
                "h-10 rounded-full border px-4 text-body-small font-medium transition-colors",
                paymentFilter === chip.value
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border bg-surface text-foreground-secondary hover:bg-hover",
              )}
            >
              {chip.label}
            </button>
          ))}
          <div className="min-w-64">
            <DateRangePicker
              value={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setPageIndex(0);
              }}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.rows ?? []}
          manual
          loading={isLoading || isFetching}
          pageCount={pageCount}
          pageIndex={pageIndex}
          onPageIndexChange={setPageIndex}
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          searchPlaceholder="جستجو: شماره سفارش، مشتری، کد مشتری، محصول یا کد محصول..."
          emptyTitle="سفارشی یافت نشد"
          emptyDescription={search ? "عبارت جستجو یا فیلترها را تغییر دهید." : "برای شروع، اولین سفارش را ثبت کنید."}
        />
      </div>
    </PageContainer>
  );
}
