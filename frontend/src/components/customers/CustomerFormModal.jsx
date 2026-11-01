import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { useToastStore } from "../../store/useToastStore";
import { api } from "../../lib/api";

// Builds fresh form state; this modal is mounted with key={customer?._id || "new"}
// in the page so React remounts it and re-initializes state for each record.
function buildInitialForm(customer) {
  return {
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
  };
}

export default function CustomerFormModal({ isOpen, onClose, customer }) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();

  const isEditMode = !!customer;
  const title = isEditMode ? "تعديل عميل" : "إضافة عميل جديد";

  const [formData, setFormData] = useState(() => buildInitialForm(customer));
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "اسم العميل مطلوب";
    if (!formData.phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        return api.put(`/customers/${customer._id}`, data);
      }
      return api.post("/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      success(
        isEditMode ? "تم تعديل العميل بنجاح" : "تم إضافة العميل بنجاح",
        "تمت العملية"
      );
      onClose();
    },
    onError: (err) => {
      const message =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        "حدث خطأ أثناء حفظ العميل، يرجى المحاولة مرة أخرى";
      showError(message, "خطأ");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
    };

    mutation.mutate(payload);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
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
                {isEditMode ? "جاري التعديل..." : "إضافة العميل"}
              </span>
            ) : (
              isEditMode ? "حفظ التغييرات" : "إضافة العميل"
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            اسم العميل <span className="text-rose-600">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="أدخل اسم العميل"
          />
          {errors.name && <p className="text-sm text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            رقم الهاتف <span className="text-rose-600">*</span>
          </label>
          <Input
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="01xxxxxxxxx"
            type="tel"
          />
          {errors.phone && <p className="text-sm text-rose-600 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            البريد الإلكتروني
          </label>
          <Input
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="example@email.com"
            type="email"
          />
          {errors.email && <p className="text-sm text-rose-600 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            العنوان
          </label>
          <Input
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="المدينة، الشارع"
          />
        </div>
      </form>
    </Modal>
  );
}
