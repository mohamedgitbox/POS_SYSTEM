import { useState } from "react";
import {
  Banknote,
  CreditCard,
  Smartphone,
  MoreHorizontal,
  CheckCircle2,
  Receipt,
  Loader2,
} from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useCartStore } from "../../store/useCartStore";
import { useToastStore } from "../../store/useToastStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useAuthStore } from "../../store/useAuthStore";
import { usePosBranchStore } from "../../store/usePosBranchStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

const PAYMENT_METHODS = [
  { value: "cash", label: "نقدي", icon: Banknote },
  { value: "card", label: "بطاقة بنكية", icon: CreditCard },
  { value: "digital", label: "محفظة رقمية", icon: Smartphone },
  { value: "other", label: "أخرى", icon: MoreHorizontal },
];

const formatMoney = (value, symbol = "ج.م") =>
  `${Number(value || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${symbol}`;

export default function CheckoutModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();
  const { items, subtotal, tax, total, clearCart } = useCartStore();
  const { taxRate, currencySymbol } = useSettingsStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";
  // super_admin sells from the branch selected in the POS header; scoped
  // roles get their branch resolved server-side
  const posBranchId = usePosBranchStore((s) => s.branchId);
  const noBranchSelected = isSuperAdmin && !posBranchId;

  const [discount, setDiscount] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  // Customer options for Walk-in / registered customers
  const { data: customersData } = useQuery({
    queryKey: ["posCustomers"],
    queryFn: () => api.get("/customers", { params: { page: 1, limit: 200 } }),
    enabled: isOpen,
  });

  const customers = [
    { _id: "", name: "عميل نقدي (بدون تسجيل)" },
    ...(customersData?.data || []),
  ];

  const discountValue = Math.min(Number(discount) || 0, subtotal);
  const payableTotal = Math.max(total - discountValue, 0);
  const paidNum = paymentMethod === "cash" ? Number(paidAmount) : NaN;
  const change = paymentMethod === "cash" && !Number.isNaN(paidNum) ? paidNum - payableTotal : 0;
  const insufficientCash =
    paymentMethod === "cash" && Number.isNaN(paidNum) === false && paidNum < payableTotal;

  const resetForm = () => {
    setDiscount("");
    setCustomerId("");
    setPaymentMethod("cash");
    setPaidAmount("");
    setLastSale(null);
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
    // Give the success screen a moment before clearing
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/sales", {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        customerId: customerId || undefined,
        paymentMethod,
        tax: Number(tax.toFixed(2)),
        discount: Number(discountValue.toFixed(2)),
        ...(isSuperAdmin ? { branchId: posBranchId } : {}),
      });

      const sale = res?.data?.data?.sale || res?.data?.data || res?.data;

      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["activeShift"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reportsDashboard"] });

      clearCart();
      setLastSale(sale || { createdAt: new Date().toISOString() });
      success("تمت عملية البيع بنجاح", "تمت العملية");
    } catch (err) {
      showError(err.message || "فشل إتمام عملية البيع", "خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  // Success state after completing a sale
  if (lastSale) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="تمت العملية بنجاح">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            تم إتمام عملية البيع
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            تم تسجيل الفاتورة وخصم المخزون بنجاح
          </p>

          <div className="w-full bg-slate-50 rounded-xl p-4 space-y-2 text-sm mb-6">
            {lastSale.invoiceNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الفاتورة</span>
                <span className="font-mono font-bold text-slate-900">
                  {lastSale.invoiceNumber}
                </span>
              </div>
            )}
            {lastSale._id && !lastSale.invoiceNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">معرّف الفاتورة</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {String(lastSale._id).slice(-8)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">المبلغ المدفوع</span>
              <span className="font-bold text-slate-900">
                {formatMoney(payableTotal, currencySymbol)}
              </span>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>الباقي للعميل</span>
                <span className="font-bold">{formatMoney(change, currencySymbol)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <Button variant="primary" className="flex-1" onClick={handleClose}>
              عملية بيع جديدة
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="إتمام عملية الدفع" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Right column: summary */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-500 gap-2">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4" />
                عدد المنتجات
              </span>
              <span className="font-medium text-slate-900">{items.length}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>المجموع الفرعي</span>
              <span className="font-medium text-slate-900">
                {formatMoney(subtotal, currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>الضريبة ({Number(taxRate).toLocaleString("ar-EG")}%)</span>
              <span className="font-medium text-slate-900">{formatMoney(tax, currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>الخصم</span>
              <span className="font-medium text-rose-600">
                - {formatMoney(discountValue, currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>المبلغ القابل للدفع</span>
              <span className="text-blue-600">{formatMoney(payableTotal, currencySymbol)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الخصم (ج.م)
            </label>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              العميل
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {customers.map((c) => (
                <option key={c._id || "walkin"} value={c._id || ""}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Left column: payment */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              طريقة الدفع
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method.value);
                    setPaidAmount("");
                  }}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm transition-colors ${
                    paymentMethod === method.value
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <method.icon className="w-5 h-5" />
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "cash" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  المبلغ المستلم (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={payableTotal.toFixed(2)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {insufficientCash && (
                  <p className="text-xs text-rose-600 mt-1">
                    المبلغ المستلم أقل من المبلغ المطلوب
                  </p>
                )}
                {!insufficientCash && paidAmount !== "" && (
                  <p className="text-xs text-emerald-700 mt-1">
                    الباقي: {formatMoney(change, currencySymbol)}
                  </p>
                )}
              </div>
              {/* Quick cash buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[payableTotal, 50, 100, 200].map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPaidAmount(String(Number(v.toFixed(2))))}
                    className="h-9 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {i === 0 ? "المبلغ بالضبط" : v}
                  </button>
                ))}
              </div>
            </>
          )}

          <Button
            variant="success"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || items.length === 0 || insufficientCash || noBranchSelected}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 ml-2" />
            )}
            {noBranchSelected
              ? "اختر الفرع أولاً"
              : submitting
                ? "جارٍ إتمام البيع..."
                : "تأكيد الدفع"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
