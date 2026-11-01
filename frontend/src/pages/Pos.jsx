import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import ProductGrid from "../components/pos/ProductGrid";
import CartPanel from "../components/pos/CartPanel";
import CheckoutModal from "../components/pos/CheckoutModal";
import { useCartStore } from "../store/useCartStore";

export default function Pos() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <PageShell title="نقطة البيع" subtitle="مسح المنتجات وإتمام عملية البيع">
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
