import { Trash2, Minus, Plus, ShoppingCart, Lock, X } from "lucide-react";
import Button from "../ui/Button";
import { useCartStore } from "../../store/useCartStore";

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ج.م`;

export default function CartPanel({ onCheckout, checkoutDisabled = false }) {
  const { items, updateQuantity, removeItem, clearCart, itemCount, subtotal, tax, total } =
    useCartStore();

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900">السلة الحالية</h3>
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full min-w-6 h-6 px-2 inline-flex items-center justify-center">
            {itemCount}
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            إفراغ السلة
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 text-slate-400">
            <ShoppingCart className="w-12 h-12 mb-3 text-slate-200" />
            <p className="text-sm font-medium text-slate-500">السلة فارغة</p>
            <p className="text-xs mt-1">
              امسح الباركود أو اضغط على منتج لإضافته
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(item.price)} × {item.quantity}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center text-slate-600 transition-colors"
                    aria-label="إنقاص الكمية"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center text-slate-600 transition-colors"
                    aria-label="زيادة الكمية"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-left flex-shrink-0 w-20">
                  <p className="text-sm font-bold text-slate-900">
                    {formatMoney(item.price * item.quantity)}
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                  aria-label="إزالة من السلة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Totals + checkout */}
      <div className="border-t border-slate-200 p-5 space-y-3 bg-white">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm text-slate-600">
            <span>المجموع الفرعي</span>
            <span className="font-medium">{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>الضريبة (5%)</span>
            <span className="font-medium">{formatMoney(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>الإجمالي</span>
            <span className="text-blue-600">{formatMoney(total)}</span>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onCheckout}
          disabled={checkoutDisabled}
        >
          <Lock className="w-4 h-4 ml-2" />
          {checkoutDisabled ? "أضف منتجات أولاً" : "متابعة الدفع"}
        </Button>
      </div>
    </div>
  );
}
