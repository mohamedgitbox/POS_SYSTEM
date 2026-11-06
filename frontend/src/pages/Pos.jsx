import { useState } from "react";
import { ShoppingCart, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../components/layout/PageShell";
import ProductGrid from "../components/pos/ProductGrid";
import CartPanel from "../components/pos/CartPanel";
import CheckoutModal from "../components/pos/CheckoutModal";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { usePosBranchStore } from "../store/usePosBranchStore";
import { api } from "../lib/api";

export default function Pos() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount);
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";
  const { branchId: posBranchId, setBranchId } = usePosBranchStore();

  // super_admin picks the branch they are selling from; scoped roles are
  // fixed to their own branch (resolved server-side)
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => api.get("/branches"),
    enabled: isSuperAdmin,
  });
  const branches = branchesData?.data || [];

  return (
    <PageShell
      title="نقطة البيع"
      subtitle={
        isSuperAdmin
          ? posBranchId
            ? "بيع من الفرع المحدد (مسح المنتجات وإتمام عملية البيع)"
            : "اختر الفرع للبدء (مسح المنتجات وإتمام عملية البيع)"
          : "مسح المنتجات وإتمام عملية البيع"
      }
    >
      {isSuperAdmin && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
            <Store className="w-4 h-4 text-blue-600" />
            <label className="text-sm font-medium text-slate-700">فرع البيع</label>
            <select
              value={posBranchId || ""}
              onChange={(e) => setBranchId(e.target.value || null)}
              className="h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">اختر الفرع</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-11rem)]">
        {/* Product search & grid */}
        <div className="flex-1 overflow-y-auto">
          <ProductGrid />
        </div>

        {/* Cart sidebar */}
        <div className="w-full xl:w-96 flex-shrink-0 flex flex-col">
          <CartPanel
            onCheckout={() => setCheckoutOpen(true)}
            checkoutDisabled={itemCount === 0}
          />
        </div>
      </div>

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
      {itemCount === 0 && (
        <div className="fixed bottom-6 left-6 z-40 xl:hidden">
          <div className="flex items-center gap-2 bg-slate-900 text-white text-sm rounded-full px-4 py-2 shadow-lg">
            <ShoppingCart className="w-4 h-4" />
            السلة فارغة
          </div>
        </div>
      )}
    </PageShell>
  );
}
