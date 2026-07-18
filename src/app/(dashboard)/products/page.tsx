"use client";

import { Plus, Ruler } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/table/data-table";
import { toast } from "@/components/ui/toast";
import { toggleFavoriteProductAction } from "@/features/products/actions";
import { getProductListColumns } from "@/features/products/components/product-list-columns";
import { useProductList } from "@/features/products/hooks/use-product-list";
import type { ProductSearchInput } from "@/features/products/schemas/product.schema";

const PAGE_SIZE = 20;

const SORT_FIELD_MAP: Record<string, ProductSearchInput["sortBy"]> = {
  name: "name",
  productCode: "createdAt",
  updatedAt: "updatedAt",
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "updatedAt", desc: true }]);

  const activeSort = sorting[0];
  const searchParams: ProductSearchInput = {
    query: search || undefined,
    page: pageIndex,
    pageSize: PAGE_SIZE,
    sortBy: activeSort ? (SORT_FIELD_MAP[activeSort.id] ?? "updatedAt") : "updatedAt",
    sortDirection: activeSort?.desc ? "desc" : "asc",
  };

  const { data, isLoading, isFetching } = useProductList(searchParams);

  async function handleToggleFavorite(productId: string, next: boolean) {
    const result = await toggleFavoriteProductAction(productId, next);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  const columns = getProductListColumns(handleToggleFavorite);
  const pageCount = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="محصولات"
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/products/sizes">
                  <Ruler className="size-4" />
                  مدیریت سایزها
                </Link>
              </Button>
              <Button asChild>
                <Link href="/products/new">
                  <Plus className="size-4" />
                  محصول جدید
                </Link>
              </Button>
            </>
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
          searchPlaceholder="جستجو بر اساس نام یا کد محصول..."
          emptyTitle="محصولی یافت نشد"
          emptyDescription={search ? "عبارت جستجو را تغییر دهید." : "برای شروع، اولین محصول را ثبت کنید."}
        />
      </div>
    </PageContainer>
  );
}
