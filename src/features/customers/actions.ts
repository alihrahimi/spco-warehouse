"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import {
  customerSchema,
  customerSearchSchema,
  type CustomerInput,
  type CustomerSearchInput,
} from "@/features/customers/schemas/customer.schema";
import {
  changeCustomerStatus,
  createCustomer,
  getRecentCustomers,
  listCustomers,
  searchCustomersForPicker,
  toggleFavoriteCustomer,
  updateCustomer,
  type CustomerListResult,
  type CustomerPickerOption,
} from "@/features/customers/services";
import type { CustomerStatus } from "@/lib/enums";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export interface CreatedCustomerSummary {
  id: string;
  customerCode: string;
  name: string;
  mobile: string;
}

export async function createCustomerAction(input: CustomerInput): Promise<ActionResult<CreatedCustomerSummary>> {
  const session = await requirePermission("customers:edit");

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await createCustomer(parsed.data, session.user.id);
  if (!result.success) {
    return { success: false, error: result.error, fieldErrors: { mobile: result.error } };
  }

  revalidatePath("/customers");
  return {
    success: true,
    data: { id: result.data.id, customerCode: result.data.customerCode, name: result.data.name, mobile: result.data.mobile },
  };
}

export async function updateCustomerAction(customerId: string, input: CustomerInput): Promise<ActionResult> {
  const session = await requirePermission("customers:edit");

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await updateCustomer(customerId, parsed.data, session.user.id);
  if (!result.success) {
    return { success: false, error: result.error, fieldErrors: { mobile: result.error } };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return { success: true, data: undefined };
}

export async function changeCustomerStatusAction(customerId: string, status: CustomerStatus): Promise<ActionResult> {
  const session = await requirePermission("customers:edit");

  const result = await changeCustomerStatus(customerId, status, session.user.id);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return { success: true, data: undefined };
}

export async function toggleFavoriteCustomerAction(customerId: string, isFavorite: boolean): Promise<ActionResult> {
  await requirePermission("customers:edit");

  const result = await toggleFavoriteCustomer(customerId, isFavorite);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/customers");
  return { success: true, data: undefined };
}

/**
 * A read, not a mutation — invoked as a Server Action anyway because it's
 * called from the Client Component customer list (interactive
 * search/sort/pagination without a full navigation), which cannot import
 * `services.ts`'s Prisma-backed code directly. Kept in `actions.ts` rather
 * than a Route Handler for consistency with this codebase's established
 * choice (Server Actions as the one client→server call mechanism outside
 * Auth.js and binary file endpoints — FRONTEND-ARCHITECTURE.md §10).
 */
export async function listCustomersAction(input: CustomerSearchInput): Promise<ActionResult<CustomerListResult>> {
  await requirePermission("customers:view");

  const parsed = customerSearchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "پارامترهای جستجو معتبر نیست" };
  }

  const data = await listCustomers(parsed.data);
  return { success: true, data };
}

/** Backs the search-as-you-type customer picker (Quick Create's architecture-readiness for Order Creation, Phase 13). */
export async function searchCustomersForPickerAction(query: string): Promise<ActionResult<CustomerPickerOption[]>> {
  await requirePermission("customers:view");
  const data = await searchCustomersForPicker(query);
  return { success: true, data };
}

/** Favorites-first, then most-recently-ordered — the picker's default list before the user types anything. */
export async function getRecentCustomersAction(): Promise<ActionResult<CustomerPickerOption[]>> {
  await requirePermission("customers:view");
  const data = await getRecentCustomers();
  return { success: true, data };
}
