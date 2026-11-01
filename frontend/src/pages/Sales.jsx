import { useState } from "react";
import { Receipt } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import SalesTable from "../components/sales/SalesTable";
import SaleDetailsModal from "../components/sales/SaleDetailsModal";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Sales() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [branch, setBranch] = useState("");

  // Branch filter options (only meaningful for super_admin, harmless otherwise)
  const { data: branchesData } = useQuery({
    queryKey: ["branchesList"],
    queryFn: () => api.get("/branches"),
  });
  const branches = branchesData?.data || [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales", { page, limit: 20, search, status, branch }],
    queryFn: () =>
      api.get("/sales", {
        params: {
          page,
          limit: 20,
          search,
          status,
          ...(branch ? { branchId: branch } : {}),
        },
      }),
  });

  const sales = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || 1;

  const [selectedSale, setSelectedSale] = useState(null);

  const handleDetails = (sale) => {
    setSelectedSale(sale);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleBranchChange = (value) => {
    setBranch(value);
    setPage(1);
  };

  const handleCloseModal = () => {
    setSelectedSale(null);
  };

  if (error) {
    return (
      <PageShell title="سجل المبيعات" subtitle="عرض جميع معاملات المبيعات">
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Receipt className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-lg font-medium">فشل تحميل المبيعات</p>
          <p className="text-sm">يرجى المحاولة مرة أخرى</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="سجل المبيعات" subtitle="عرض وتتبع جميع معاملات المبيعات">
      <div className="max-w-7xl mx-auto">
        <SalesTable
          sales={sales}
          loading={isLoading}
          total={total}
          page={page}
          pageSize={20}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onSearch={setSearch}
          search={search}
          branches={branches}
          branch={branch}
          onBranchChange={handleBranchChange}
          status={status}
          onStatusChange={setStatus}
          onDetails={handleDetails}
        />

        <SaleDetailsModal
          isOpen={!!selectedSale}
          onClose={handleCloseModal}
          sale={selectedSale}
        />
      </div>
    </PageShell>
  );
}
