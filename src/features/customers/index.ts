/**
 * Public surface of the customers feature (FRONTEND-ARCHITECTURE.md §4/§13).
 * Exposes the customer picker (built in Phase 11 explicitly for the order
 * flow) and its option type — the order builder's sanctioned imports.
 */
export { CustomerPicker } from "@/features/customers/components/customer-picker";
export type { CustomerPickerOption } from "@/features/customers/services";
