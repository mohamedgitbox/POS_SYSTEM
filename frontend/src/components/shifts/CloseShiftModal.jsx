import { useState, useMemo } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useToastStore } from "../../store/useToastStore";

export default function CloseShiftModal({ isOpen, onClose, shiftId }) {
  const [closingBalance, setClosingBalance] = useState("");
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();

  const { data: summaryData } = useQuery({
    queryKey: ["shiftSummary", shiftId],
    queryFn: () => api.get(`/shifts/${shiftId}/summary`),
    enabled: isOpen && !!shiftId,
  });

  const shift = useMemo(() => summaryData?.data?.shift, [summaryData]);
  const totals = useMemo(() => summaryData?.data?.totals, [summaryData]);
  const expectedBalance = totals?.expectedBalance ?? shift?.openingBalance ?? 0;
  const cashSales = totals?.cashSales ?? 0;

  const discrepancy = useMemo(() => {
    const cb = Number(closingBalance) || 0;
    return cb - expectedBalance;
  }, [closingBalance, expectedBalance]);

  const closeMutation = useMutation({
    mutationFn: async (data) => api.post(`/shifts/${shiftId}/close`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["shifts"]);
      queryClient.invalidateQueries(["activeShift"]);
      queryClient.invalidateQueries(["shiftSummary"]);
      success("تم إغلاق الوردية بنجاح", "تمت العملية");
      setClosingBalance("");
      setErrors({});
      onClose();
    },
    onError: (err) => {
      showError(err?.message || "فشل إغلاق الوردية، يرجى المحاولة مرة أخرى", "خطأ");
    },
  });

  const validate = () => {
    const newErrors = {};
    if (closingBalance === "" || Number(closingBalance) < 0) {
      newErrors.closingBalance = "رصيد الإغلاق مطلوب ويجب أن يكون رقماً موجباً";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    closeMutation.mutate({ closingBalance: Number(closingBalance) });
  };

  const discrepancyColor = useMemo(() => {
    if (discrepancy === 0) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (discrepancy > 0) return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  }, [discrepancy]);

  const discrepancyText = useMemo(() => {
    if (discrepancy === 0) return "متطابق - لا فرق";
    return discrepancy > 0 ? `فائض: ${Math.abs(discrepancy).toFixed(2)} ج.م` : `نقص: ${Math.abs(discrepancy).toFixed(2)} ج.م`;
  }, [discrepancy]);

  if (!isOpen || !shift) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !closeMutation.isPending && onClose()}
      title="إغلاق الوردية"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={closeMutation.isPending}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={closeMutation.isPending}
          >
            {closeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الإغلاق...
              </span>
            ) : (
              "إغلاق الوردية"
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shift info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500">رقم الوردية</p>
            <p className="font-medium">{shift.id}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">وقت الفتح</p>
            <p className="font-medium">
              {new Date(shift.openedAt).toLocaleString("ar-EG", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600">رصيد الفتح</span>
            <span className="font-medium">{Number(shift.openingBalance).toLocaleString("ar-EG")} ج.م</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">مجموع المبيعات النقدية</span>
            <span className="font-medium">+{Number(cashSales).toLocaleString("ar-EG")} ج.م</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900">الرصيد المتوقع</span>
            <span className="font-bold">{Number(expectedBalance).toLocaleString("ar-EG")} ج.م</span>
          </div>
        </div>

        {/* Closing balance input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            رصيد الإغلاق الفعلي <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              value={closingBalance}
              onChange={(e) => {
                setClosingBalance(e.target.value);
                if (errors.closingBalance) setErrors({});
              }}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          {errors.closingBalance && (
            <p className="text-sm text-rose-600 mt-1">{errors.closingBalance}</p>
          )}
        </div>

        {/* Discrepancy */}
        <div className={`rounded-xl p-4 border ${discrepancyColor}`}>
          <div className="flex items-center gap-2 mb-1">
            {discrepancy !== 0 && <AlertTriangle className="w-4 h-4" />}
            <span className="font-bold">الفرق</span>
          </div>
          <p className="font-medium">{discrepancyText}</p>
          <p className="text-sm opacity-80">
            الفرق = رصيد الإغلاق - الرصيد المتوقع
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">تنبيه: تأكيد إغلاق الوردية</p>
            <p className="text-sm text-amber-700">
              سيتم حفظ الفارق بين الرصيد الفعلي والمتوقع وسجّل كإجراء نهائي. تأكد من عد النقود بدقة قبل المتابعة.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
