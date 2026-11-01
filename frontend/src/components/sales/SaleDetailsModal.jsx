import { useState } from "react";
import { DollarSign, CreditCard, Banknote, AlertTriangle } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useToastStore } from "../../store/useToastStore";

export default function SaleDetailsModal({
  isOpen,
  onClose,
  sale,
  onRefundSuccess,
}) {
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundItems, setRefundItems] = useState(
    sale?.items?.map((item) => ({ productId: item.productId, quantity: item.quantity, productName: item.productName, unitPrice: item.unitPrice, totalPrice: item.totalPrice })) || []
  );
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();

  const refundMutation = useMutation({
    mutationFn: async () => {
      const itemsToRefund = refundItems
        .filter((item) => item.quantity > 0)
        .map((item) => ({ productId: item.productId, quantity: item.quantity }));
      if (itemsToRefund.length === 0) {
        throw new Error("الرجاء اختيار منتج واحد على الأقل للإرجاع");
      }
      return api.post(`/sales/${sale._id}/return`, {
        items: itemsToRefund,
        reason: "إرجاع من شاشة التفاصيل",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sales"]);
      queryClient.invalidateQueries(["salesSummary"]);
      success("تمت عملية الإرجاع بنجاح", "تمت العملية");
      setShowRefundDialog(false);
      onClose();
      if (onRefundSuccess) onRefundSuccess();
    },
    onError: (err) => {
      showError(err?.message || "فشل عملية الإرجاع، يرجى المحاولة مرة أخرى", "خطأ");
    },
  });

  const handleRefund = () => {
    refundMutation.mutate();
  };

  const toggleItemReturn = (productId) => {
    setRefundItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity === 0 ? item.originalQuantity : 0 }
          : item
      )
    );
  };

  // Reset refund items when sale changes
  if (isOpen && sale?._id) {
    setRefundItems(
      sale.items.map((item) => ({
        productId: item.productId,
        originalQuantity: item.quantity,
        quantity: 0,
        productName: item.productName,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }))
    );
  }

  const totalRefundAmount = refundItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const paymentMethodLabel = {
    cash: { label: "نقدي", icon: Banknote },
    card: { label: "بطاقة ائتمان", icon: CreditCard },
    digital: { label: "دفع رقمي", icon: DollarSign },
    other: { label: "أخرى", icon: DollarSign },
  }[sale?.paymentMethod] || { label: sale?.paymentMethod, icon: DollarSign };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="تفاصيل الفاتورة"
        size="xl"
      >
        {sale ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <p className="text-sm text-slate-500">رقم الفاتورة</p>
                <p className="text-lg font-bold text-slate-900">{sale.saleNumber}</p>
              </div>
              <Badge
                variant={
                  sale.status === "completed"
                    ? "success"
                    : sale.status === "returned"
                    ? "outline"
                    : sale.status === "cancelled"
                    ? "danger"
                    : "warning"
                }
              >
                {
                  sale.status === "completed"
                    ? "مكتمل"
                    : sale.status === "returned"
                    ? "تم الإرجاع"
                    : sale.status === "cancelled"
                    ? "ملغي"
                    : "قيد الانتظار"
                }
              </Badge>
            </div>

            {/* Sale info grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-500">التاريخ</p>
                <p className="font-medium">
                  {new Date(sale.createdAt).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">الكاشير</p>
                <p className="font-medium">{sale.cashierId?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">الفرع</p>
                <p className="font-medium">{sale.branchId?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">العميل</p>
                <p className="font-medium">
                  {sale.customerInfo?.name || "زائر"}
                </p>
              </div>
            </div>

            {/* Items table */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3">المنتجات</h3>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead className="text-center">الكمية</TableHead>
                      <TableHead className="text-left">سعر الوحدة</TableHead>
                      <TableHead className="text-left">الإجمالي</TableHead>
                      <TableHead className="text-center">إرجاع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items.map((item) => {
                      const refundItem = refundItems.find((r) => r.productId === item.productId);
                      return (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-left">{Number(item.unitPrice).toLocaleString("ar-EG")} ج.م</TableCell>
                          <TableCell className="text-left font-medium">
                            {Number(item.totalPrice).toLocaleString("ar-EG")} ج.م
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant={refundItem?.quantity > 0 ? "danger" : "outline"}
                              size="sm"
                              onClick={() => toggleItemReturn(item.productId)}
                              disabled={sale.status !== "completed"}
                            >
                              {refundItem?.quantity > 0 ? `إرجاع ${refundItem.quantity}` : "إرجاع"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">المجموع الفرعي</span>
                <span className="font-medium">{Number(sale.subtotal).toLocaleString("ar-EG")} ج.م</span>
              </div>
              {sale.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">الضريبة</span>
                  <span className="font-medium">{Number(sale.tax).toLocaleString("ar-EG")} ج.م</span>
                </div>
              )}
              {sale.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">الخصم</span>
                  <span className="font-medium">-{Number(sale.discount).toLocaleString("ar-EG")} ج.م</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">الإجمالي الكلي</span>
                <span className="font-bold text-lg text-slate-900">{Number(sale.total).toLocaleString("ar-EG")} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">طريقة الدفع</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = paymentMethodLabel.icon;
                    return <Icon className="w-4 h-4" />;
                  })()}
                  <span className="font-medium">{paymentMethodLabel.label}</span>
                </div>
              </div>
              {totalRefundAmount > 0 && (
                <div className="flex justify-between pt-2 border-t border-rose-200 bg-rose-50 -mx-4 px-4 py-2 rounded-lg">
                  <span className="font-bold text-rose-900">مبلغ الإرجاع المختار</span>
                  <span className="font-bold text-rose-900">{Number(totalRefundAmount).toLocaleString("ar-EG")} ج.م</span>
                </div>
              )}
            </div>

            {/* Refund action */}
            {totalRefundAmount > 0 && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => setShowRefundDialog(true)}
              >
                تأكيد وإتمام الإرجاع ({Number(totalRefundAmount).toLocaleString("ar-EG")} ج.م)
              </Button>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Refund confirmation dialog */}
      <Modal
        isOpen={showRefundDialog}
        onClose={() => setShowRefundDialog(false)}
        title="تأكيد الإرجاع"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRefundDialog(false)} disabled={refundMutation.isPending}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={handleRefund}
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري المعالجة...
                </span>
              ) : (
                "تأكيد الإرجاع"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">تنبيه: لا يمكن التراجع عن الإرجاع</p>
              <p className="text-sm text-amber-700">سيتم إعادة المنتجات إلى المخزون وإرجاع المبلغ للعميل.</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-2">المنتجات التي سيتم إرجاعها:</p>
            <ul className="space-y-1 text-sm">
              {refundItems
                .filter((item) => item.quantity > 0)
                .map((item) => (
                  <li key={item.productId} className="flex justify-between py-1 border-b border-slate-100">
                    <span>{item.productName}</span>
                    <span className="font-medium">{Number(item.quantity * item.unitPrice).toLocaleString("ar-EG")} ج.م</span>
                  </li>
                ))}
            </ul>
            <div className="pt-3 border-t border-slate-200 flex justify-between font-bold">
              <span>الإجمالي المسترد:</span>
              <span className="text-rose-700">{Number(totalRefundAmount).toLocaleString("ar-EG")} ج.م</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
