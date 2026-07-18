"use client";

import { useQuery } from "@tanstack/react-query";

import { listProductsAction } from "@/features/products/actions";
import type { ProductSearchInput } from "@/features/products/schemas/product.schema";

const productKeys = {
  list: (params: ProductSearchInput) => ["products", "list", params] as const,
};

export function useProductList(params: ProductSearchInput) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      const result = await listProductsAction(params);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    placeholderData: (previous) => previous,
  });
}
