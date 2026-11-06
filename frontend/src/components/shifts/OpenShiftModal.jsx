import { useState } from "react";
import { Key } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useToastStore } from "../../store/useToastStore";
import { useAuthStore } from "../../store/useAuthStore";

export default function OpenShiftModal({ isOpen, onClose }) {
  const [openingBalance, setOpeningBalance] = useState("");
  const [branchId, setBranchId] = useState("");
  const [errors, setErrors] = useState({});
  const { success, error: showError } = useToastStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  // branches for super_admin selection (scoped users don't need one; the
  // backend derives their branch server-side)
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => api.get("/branches"),
    enabled: isOpen && isSuperAdmin,
  });
  const branches = branchesData?.data || [];

  const mutation = useMutation({
    mutationFn: async (data) => api.post("/shifts/open", data),
    onSuccess: () => {
      success("تم فتح الوردية بنجاح", "تمت العملية");
      setOpeningBalance("");
      setBranchId("");
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
    if (isSuperAdmin && !branchId) {
      newErrors.branchId = "يجب اختيار الفرع لفتح الوردية";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      openingBalance: Number(openingBalance),
      ...(isSuperAdmin ? { branchId } : {}),
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
        {/* Branch selection - required for super_admin only */}
        {isSuperAdmin && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الفرع <span className="text-rose-600">*</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                if (errors.branchId) setErrors({});
              }}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">اختر الفرع</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            {errors.branchId && (
              <p className="text-sm text-rose-600 mt-1">{errors.branchId}</p>
            )}
          </div>
        )}

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
