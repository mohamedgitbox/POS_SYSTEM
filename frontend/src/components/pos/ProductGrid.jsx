import { useState, useMemo } from "react";
import { Scan, Search, Package, Plus, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useCartStore } from "../../store/useCartStore";
import { useToastStore } from "../../store/useToastStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Skeleton } from "../ui/Skeleton";

const CATEGORIES = [
  { value: "", label: "جميع الفئات" },
  { value: "electronics", label: "إلكترونيات" },
  { value: "clothing", label: "ملابس" },
  { value: "food", label: "أطعمة" },
  { value: "furniture", label: "أثاث" },
  { value: "sports", label: "رياضة" },
  { value: "books", label: "كتب" },
  { value: "beauty", label: "جم وعناية" },
  { value: "toys", label: "ألعاب" },
  { value: "other", label: "أخرى" },
];

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ج.م`;

export default function ProductGrid() {
  const { user } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);
  const { success, error: showError, info } = useToastStore();

  const [scanValue, setScanValue] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // Branch scope: cashier/branch_manager sell from their branch only
  const branchId = user?.role === "super_admin" ? null : user?.branch || user?.branchId || null;

  // Product catalog (price + identity)
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["posProducts", { search, category }],
    queryFn: () =>
      api.get("/products", {
        params: { page: 1, limit: 60, search, category },
      }),
  });

  const products = useMemo(() => {
    const items = productsData?.data || [];
    // API returns {data:[...]} array of products or paginated {data:{...}}
    return Array.isArray(items) ? items : items?.items || items?.data || [];
  }, [productsData]);

  const { data: invData } = useQuery({
    queryKey: ["posInventory", branchId],
    queryFn: () => api.get(`/inventory/${branchId}`),
    enabled: Boolean(branchId),
  });

  // productId -> available stock in this branch
  const stockByProduct = useMemo(() => {
    const map = {};
    (invData?.data || []).forEach((row) => {
      const pid = row.productId?._id || row.productId;
      if (pid) map[pid] = row.quantity ?? 0;
    });
    return map;
  }, [invData]);

  const handleAdd = (product) => {
    const stock = stockByProduct[product._id];
    if (stock !== undefined && stock <= 0) {
      showError(`نفد مخزون "${product.name}"`, "غير متوفر");
      return;
    }
    addItem(product, 1);
    success(`تم إضافة "${product.name}" إلى السلة`, "السلة");
  };

  // Barcode / SKU scanner fast-path: /products/lookup?barcode=|sku=
  const handleScan = async (e) => {
    e.preventDefault();
    const value = scanValue.trim();
    if (!value) return;

    try {
      const res = await api.get("/products/lookup", {
        params: branchId ? { barcode: value, branchId } : { barcode: value },
      });
      const product = res?.data?.data?.product;
      if (product) {
        handleAdd(product);
        setScanValue("");
        return;
      }
      // Not a barcode — try as SKU
      const bySku = await api.get("/products/lookup", {
        params: branchId ? { sku: value, branchId } : { sku: value },
      });
      const skuProduct = bySku?.data?.data?.product;
      if (skuProduct) {
        handleAdd(skuProduct);
        setScanValue("");
      } else {
        info(`لم يتم العثور على منتج بالرمز "${value}"`, "نتيجة البحث");
      }
    } catch (err) {
      showError(err.message || "تعذر البحث عن المنتج", "خطأ");
    }
  };

  return (
    <div className="space-y-4">
      {/* Barcode scanner input */}
      <form onSubmit={handleScan} className="flex gap-2">
        <div className="relative flex-1">
          <Scan className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            placeholder="امسح الباركود أو أدخل رمز المنتج ثم اضغط Enter"
            className="w-full h-11 pr-10 pl-4 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Scan className="w-4 h-4" />
          مسح
        </button>
      </form>

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرمز..."
            className="w-full h-10 pr-9 pl-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">لا توجد منتجات مطابقة</p>
          <p className="text-sm">جرّب تعديل البحث أو الفئة</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3">
          {products.map((product) => {
            const stock = stockByProduct[product._id];
            const outOfStock = stock !== undefined && stock <= 0;
            const lowStock = stock !== undefined && stock > 0 && stock <= 5;

            return (
              <button
                key={product._id}
                onClick={() => handleAdd(product)}
                disabled={outOfStock}
                className={`text-right rounded-xl border p-4 bg-white transition-all ${
                  outOfStock
                    ? "border-slate-200 opacity-60 cursor-not-allowed"
                    : "border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-[0.98] cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                    <Package className="w-5 h-5" />
                  </span>
                  {outOfStock && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 rounded-full px-2 py-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      نفد المخزون
                    </span>
                  )}
                  {lowStock && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                      كمية محدودة
                    </span>
                  )}
                  {stock !== undefined && stock > 5 && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                      متوفر
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900 truncate mb-1">
                  {product.name}
                </p>
                <p className="text-xs text-slate-400 truncate mb-2">
                  {product.sku}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-600">
                    {formatMoney(product.price)}
                  </span>
                  {!outOfStock && (
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
