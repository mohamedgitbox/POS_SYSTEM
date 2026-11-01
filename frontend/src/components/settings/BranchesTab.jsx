import { useState } from "react";
import { Pencil, Trash2, Store } from "lucide-react";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useToastStore } from "../../store/useToastStore";

export default function BranchesTab({
  onOpenBranchModal,
}) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["branches", search],
    queryFn: () =>
      api.get("/branches", {
        params: { search },
      }),
  });

  const branches = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["branches"]);
      success("تم حذف الفرع بنجاح", "تمت العملية");
    },
    onError: (err) => {
      const message =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        "حدث خطأ أثناء حذف الفرع، يرجى المحاولة مرة أخرى";
      showError(message, "خطأ");
    },
  });

  const handleDelete = (branch) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الفرع "${branch.name}"؟`
    );
    if (!confirmed) return;
    deleteMutation.mutate(branch._id);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p>فشل تحميل الفروع</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder="بحث عن فرع..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-8 h-8 rounded" />
                  <Skeleton className="w-8 h-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p>لا توجد فروع</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الفرع</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>المدير</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => {
                const addr = `${b.address?.city || ""} ${b.address?.country ? `, ${b.address.country}` : ""}`.trim();
                return (
                  <TableRow key={b._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{b.name}</p>
                          <p className="text-xs text-slate-500">{addr}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{b.code || "—"}</TableCell>
                    <TableCell>{b.phone || "—"}</TableCell>
                    <TableCell>
                      {b.managerId
                        ? `${b.managerId.name || ""} ${b.managerId?.email || ""}`.trim()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.isActive ? "success" : "danger"}>
                        {b.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenBranchModal("edit", b)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(b)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
