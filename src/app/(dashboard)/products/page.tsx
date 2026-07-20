import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { ProductsPageClient } from "@/features/products/components/products-page-client";

/** Thin server wrapper: only job is resolving `products:edit` server-side so the client list never renders edit-only controls (favorite toggle, size management, new product) for a view-only viewer — see the matching comment on the product detail page for why that matters beyond cosmetics. */
export default async function ProductsPage() {
  const session = await getCurrentSession();
  const canEdit = Boolean(session && hasPermission(session.user.role, "products:edit"));

  return <ProductsPageClient canEdit={canEdit} />;
}
