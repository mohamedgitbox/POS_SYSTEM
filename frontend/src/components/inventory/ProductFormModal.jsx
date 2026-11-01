import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { useToastStore } from "../../store/useToastStore";
import { api } from "../../lib/api";

// Builds fresh form state; this modal is mounted with key={product?._id || "new"}
// in the page so React remounts it and re-initializes state for each record.
function buildInitialForm(product) {
  if (!product) return defaultForm;
  return {
    name: product.name || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    category: product.category || "other",
    price: product.price != null ? String(product.price) : "",
    cost: product.cost != null ? String(product.cost) : "",
    reorderLevel:
      product.inventory?.reorderLevel != null
        ? String(product.inventory.reorderLevel)
        : "0",
  };
}

const CATEGORIES = [
  { value: "electronics", label: "إلكترونيات" },
  { value: "clothing", label: "ملابس" },
  { value: "food", label: "طعام" },
  { value: "furniture", label: "أثاث" },
  { value: "sports", label: "رياضة" },
  { value: "books", label: "كتب" },
  { value: "beauty", label: "تجميل" },
  { value: "toys", label: "ألعاب" },
  { value: "other", label: "أخرى" },
];

const defaultForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "other",
  price: "",
  cost: "",
  reorderLevel: "0",
};

export default function ProductFormModal({ isOpen, onClose, product }) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();

  const isEditMode = !!product;
  const title = isEditMode ? "تعديل منتج" : "إضافة منتج جديد";

  const [formData, setFormData] = useState(() => buildInitialForm(product));
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "اسم المنتج مطلوب";
    if (!formData.sku.trim()) newErrors.sku = "رمز المنتج (SKU) مطلوب";
    if (!formData.category) newErrors.category = "التصنيف مطلوب";
    if (formData.price === "" || Number(formData.price) <= 0) {
      newErrors.price = "سعر البيع يجب أن يكون رقماً موجباً";
    }
    if (formData.cost === "" || Number(formData.cost) < 0) {
      newErrors.cost = "سعر التكلفة يجب أن يكون رقماً موجباً أو صفراً";
    }
    if (formData.reorderLevel === "" || Number(formData.reorderLevel) < 0) {
      newErrors.reorderLevel = "حد الطلب يجب أن يكون رقماً موجباً أو صفراً";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        return api.put(`/products/${product._id}`, data);
      }
      return api.post("/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      success(
        isEditMode
          ? "تم تعديل المنتج بنجاح"
          : "تم إضافة المنتج بنجاح",
        "تمت العملية"
      );
      onClose();
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "حدث خطأ أثناء حفظ المنتج، يرجى المحاولة مرة أخرى";
      showError(message, "خطأ");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      barcode: formData.barcode.trim(),
      category: formData.category,
      price: Number(formData.price),
      cost: Number(formData.cost),
      reorderLevel: Number(formData.reorderLevel),
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
                {isEditMode ? "جاري التعديل..." : "جاري الإضافة..."}
              </span>
            ) : (
              isEditMode ? "حفظ التغييرات" : "إضافة المنتج"
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            اسم المنتج <span className="text-rose-600">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="أدخل اسم المنتج"
          />
          {errors.name && <p className="text-sm text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            رمز المنتج (SKU) <span className="text-rose-600">*</span>
          </label>
          <Input
            value={formData.sku}
            onChange={(e) => handleChange("sku", e.target.value)}
            placeholder="أدخل رمز المنتج"
          />
          {errors.sku && <p className="text-sm text-rose-600 mt-1">{errors.sku}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            الباركود
          </label>
          <Input
            value={formData.barcode}
            onChange={(e) => handleChange("barcode", e.target.value)}
            placeholder="أدخل الباركود (إن وجد)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            التصنيف <span className="text-rose-600">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className={`w-full h-10 px-3 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.category
                ? "border-rose-500"
                : "border-slate-300"
            }`}
          >
            <option value="">اختر التصنيف</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-rose-600 mt-1">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            سعر البيع <span className="text-rose-600">*</span>
          </label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => handleChange("price", e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {errors.price && (
            <p className="text-sm text-rose-600 mt-1">{errors.price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            سعر التكلفة
          </label>
          <Input
            type="number"
            value={formData.cost}
            onChange={(e) => handleChange("cost", e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {errors.cost && (
            <p className="text-sm text-rose-600 mt-1">{errors.cost}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            حد الطلب (Reorder Level)
          </label>
          <Input
            type="number"
            value={formData.reorderLevel}
            onChange={(e) => handleChange("reorderLevel", e.target.value)}
            placeholder="0"
            min="0"
          />
          {errors.reorderLevel && (
            <p className="text-sm text-rose-600 mt-1">{errors.reorderLevel}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
