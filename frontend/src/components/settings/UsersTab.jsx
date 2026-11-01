import { useState } from "react";
import { Pencil, Trash2, UserCheck, UserX } from "lucide-react";
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
import { useAuthStore } from "../../store/useAuthStore";

const ROLES = [
  { value: "super_admin", label: "مدير النظام" },
  { value: "branch_manager", label: "مدير الفرع" },
  { value: "cashier", label: "كاشير" },
];

export default function UsersTab({ onOpenUserModal }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["users", { page, limit: 20, search, role: roleFilter, status: statusFilter }],
    queryFn: () =>
      api.get("/users", {
        params: { page, limit: 20, search, role: roleFilter, isActive: statusFilter },
      }),
  });

  const users = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      success("تم حذف المستخدم بنجاح", "تمت العملية");
    },
    onError: (err) => {
      const message =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        "حدث خطأ أثناء حذف المستخدم، يرجى المحاولة مرة أخرى";
      showError(message, "خطأ");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      api.put(`/users/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      success("تم تغيير حالة المستخدم بنجاح", "تمت العملية");
    },
    onError: () => {
      showError("حدث خطأ أثناء تحديث حالة المستخدم", "خطأ");
    },
  });

  const handleDelete = (u) => {
    if (u._id === user?._id) {
      showError("لا يمكنك حذف حسابك الخاص", "تنبيه");
      return;
    }
    const confirmed = window.confirm(`هل أنت متأكد من حذف "${u.name}"؟`);
    if (!confirmed) return;
    deleteMutation.mutate(u._id);
  };

  const handleToggle = (u) => {
    toggleMutation.mutate({ id: u._id, isActive: !u.isActive });
  };

  const roleBadge = (role) => {
    const config = {
      super_admin: { label: "مدير النظام", variant: "danger" },
      branch_manager: { label: "مدير الفرع", variant: "warning" },
      cashier: { label: "كاشير", variant: "outline" },
    };
    return config[role] || { label: role, variant: "outline" };
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p>فشل تحميل المستخدمين</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Input
            type="text"
            placeholder="بحث عن مستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">كل الأدوار</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">كل الحالات</option>
          <option value="true">نشط</option>
          <option value="false">معطل</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100">
                <Skeleton className="h-10 w-10 rounded-full" />
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
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p>لا توجد مستخدمين</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("ar-EG") : ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{u.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadge(u.role).variant}>
                      {roleBadge(u.role).label}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.branchId?.name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {u.isActive ? (
                        <Badge variant="success">نشط</Badge>
                      ) : (
                        <Badge variant="danger">معطل</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => handleToggle(u)}>
                      {u.isActive ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onOpenUserModal("edit", u)} className="ml-1">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(u)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 ml-1"
                      disabled={u._id === user?._id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add user trigger - handled by parent */}
    </div>
  );
}
