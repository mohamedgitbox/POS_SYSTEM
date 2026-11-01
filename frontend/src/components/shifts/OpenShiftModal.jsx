import { useState } from "react";
import { Key } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useToastStore } from "../../store/useToastStore";

export default function OpenShiftModal({ isOpen, onClose }) {
  const [openingBalance, setOpeningBalance] = useState("");
  const [errors, setErrors] = useState({});
  const { success, error: showError } = useToastStore();

  const mutation = useMutation({
    mutationFn: async (data) => api.post("/shifts/open", data),
    onSuccess: () => {
      success("تم فتح الوردية بنجاح", "تمت العملية");
      setOpeningBalance("");
      setErrors({});
      onClose();
    },
    onError: (err) => {
      showError(err?.message || "فشل فتح الوردية، يرجى المحاولة مرة أخرى", "خطأ");
    },
  });

  const validate = () => {
    const newErrors = {};
    if (openingBalance === "" || Number(openingBalance) < 0) {
      newErrors.openingBalance = "رصيد الفتح مطلوب ويجب أن يكون رقماً موجباً أو صفراً";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      openingBalance: Number(openingBalance),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="فتح وردية جديدة"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الفتح...
              </span>
            ) : (
              "فتح الوردية"
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">رصيد الوردية</p>
            <p className="text-sm text-blue-700">
              أدخل المبلغ النقدي الذي ستبدأ به الوردية (الصندوق)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            رصيد الفتح <span className="text-rose-600">*</span>
          </label>
          <Input
            type="number"
            value={openingBalance}
            onChange={(e) => {
              setOpeningBalance(e.target.value);
              if (errors.openingBalance) setErrors({});
            }}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {errors.openingBalance && (
            <p className="text-sm text-rose-600 mt-1">{errors.openingBalance}</p>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600">
            سيتم احتساب الفرق بين الرصيد المتوقع والنقدي الفعلي عند إغلاق الوردية.
          </p>
        </div>
      </form>
    </Modal>
  );
}
