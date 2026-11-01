import { useState } from "react";
import { Package } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import ProductTable from "../components/inventory/ProductTable";
import ProductFormModal from "../components/inventory/ProductFormModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useToastStore } from "../store/useToastStore";

export default function Inventory() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", { page, limit: 20, search, category }],
    queryFn: () =>
      api.get("/products", {
        params: { page, limit: 20, search, category },
      }),
  });

  const products = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || 1;

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      success("تم حذف المنتج بنجاح", "تمت العملية");
    },
    onError: (err) => {
      const message =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        "حدث خطأ أثناء حذف المنتج، يرجى المحاولة مرة أخرى";
      showError(message, "خطأ");
    },
  });

  const handleDelete = (product) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف "${product.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;
    deleteMutation.mutate(product._id);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  if (error) {
    return (
      <PageShell title="إدارة المخزون" subtitle="إدارة المنتجات والمخزون">
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Package className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-lg font-medium">فشل تحميل المنتجات</p>
          <p className="text-sm">يرجى المحاولة مرة أخرى</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="إدارة المخزون" subtitle="إدارة المنتجات والمخزون">
      <div className="max-w-7xl mx-auto">
        <ProductTable
          products={products}
          loading={isLoading}
          total={total}
          page={page}
          pageSize={20}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            if (newPage >= 1 && newPage <= totalPages) {
              setPage(newPage);
            }
          }}
          onSearch={setSearch}
          search={search}
          category={category}
          onCategoryChange={setCategory}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <ProductFormModal
          key={selectedProduct?._id || "new"}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          product={selectedProduct}
        />
      </div>
    </PageShell>
  );
}
