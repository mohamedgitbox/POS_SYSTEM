import { useState } from "react";
import { Users } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerFormModal from "../components/customers/CustomerFormModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useToastStore } from "../store/useToastStore";

export default function Customers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", { search }],
    queryFn: () => api.get("/customers", { params: { search } }),
  });

  const customers = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      success("تم حذف العميل بنجاح", "تمت العملية");
    },
    onError: (err) => {
      const message =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        "حدث خطأ أثناء حذف العميل، يرجى المحاولة مرة أخرى";
      showError(message, "خطأ");
    },
  });

  const handleDelete = (customer) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف "${customer.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;
    deleteMutation.mutate(customer._id);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  if (error) {
    return (
      <PageShell title="إدارة العملاء" subtitle="قائمة العملاء المسجلين">
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Users className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-lg font-medium">فشل تحميل العملاء</p>
          <p className="text-sm">يرجى المحاولة مرة أخرى</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="إدارة العملاء" subtitle="قائمة العملاء المسجلين">
      <div className="max-w-7xl mx-auto">
        <CustomerTable
          customers={customers}
          loading={isLoading}
          onSearch={setSearch}
          search={search}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <CustomerFormModal
          key={selectedCustomer?._id || "new"}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          customer={selectedCustomer}
        />
      </div>
    </PageShell>
  );
}
