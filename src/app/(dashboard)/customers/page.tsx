"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { SortingState } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/table/data-table";
import { toast } from "@/components/ui/toast";
import { toggleFavoriteCustomerAction } from "@/features/customers/actions";
import { getCustomerListColumns } from "@/features/customers/components/customer-list-columns";
import { useCustomerList } from "@/features/customers/hooks/use-customer-list";
import type { CustomerSearchInput } from "@/features/customers/schemas/customer.schema";
import { useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 20;

const SORT_FIELD_MAP: Record<string, CustomerSearchInput["sortBy"]> = {
  name: "name",
  createdAt: "createdAt",
  lastOrderDate: "lastOrderDate",
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const activeSort = sorting[0];
  const searchParams: CustomerSearchInput = {
    query: search || undefined,
    page: pageIndex,
    pageSize: PAGE_SIZE,
    sortBy: activeSort ? (SORT_FIELD_MAP[activeSort.id] ?? "createdAt") : "createdAt",
    sortDirection: activeSort?.desc ? "desc" : "asc",
  };

  const { data, isLoading, isFetching } = useCustomerList(searchParams);

  async function handleToggleFavorite(customerId: string, next: boolean) {
    const result = await toggleFavoriteCustomerAction(customerId, next);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  }

  const columns = getCustomerListColumns(handleToggleFavorite);
  const pageCount = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="مشتریان"
          actions={
            <Button asChild>
              <Link href="/customers/new">
                <Plus className="size-4" />
                مشتری جدید
              </Link>
            </Button>
          }
        />

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
          sorting={sorting}
          onManualSortingChange={(next) => {
            setSorting(next);
            setPageIndex(0);
          }}
          searchPlaceholder="جستجو بر اساس نام، موبایل، کد یا شهر..."
          emptyTitle="مشتری‌ای یافت نشد"
          emptyDescription={search ? "عبارت جستجو را تغییر دهید." : "برای شروع، اولین مشتری را ثبت کنید."}
        />
      </div>
    </PageContainer>
  );
}
