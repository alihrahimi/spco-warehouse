"use client";

import { useQuery } from "@tanstack/react-query";

import { listCustomersAction } from "@/features/customers/actions";
import type { CustomerSearchInput } from "@/features/customers/schemas/customer.schema";

const customerKeys = {
  list: (params: CustomerSearchInput) => ["customers", "list", params] as const,
};

export function useCustomerList(params: CustomerSearchInput) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: async () => {
      const result = await listCustomersAction(params);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    // Order List's much shorter staleTime (Frontend Architecture §6) will
    // apply once Order Management exists; the customer list changes less
    // often, so the app-wide 30s default (query-provider.tsx) is fine here.
    placeholderData: (previous) => previous,
  });
}
