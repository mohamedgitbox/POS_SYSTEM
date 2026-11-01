import { Search } from "lucide-react";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

export default function SalesTable({
  sales,
  loading,
  total,
  page,
  totalPages,
  onPageChange,
  onSearch,
  search,
  branches = [],
  branch,
  onBranchChange,
  status,
  onStatusChange,
  onDetails,
}) {
  const statusConfig = {
    completed: { label: "مكتمل", variant: "success" },
    pending: { label: "قيد الانتظار", variant: "warning" },
    cancelled: { label: "ملغي", variant: "danger" },
    returned: { label: "تم الإرجاع", variant: "outline" },
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث عن رقم الفاتورة..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-72 pr-10 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={branch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">كل الفروع</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">كل الحالات</option>
            <option value="completed">مكتمل</option>
            <option value="pending">قيد الانتظار</option>
            <option value="cancelled">ملغي</option>
            <option value="returned">تم الإرجاع</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الفاتورة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الكاشير</TableHead>
              <TableHead>الفرع</TableHead>
              <TableHead>الإجمالي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-center">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Skeleton className="w-24 h-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Search className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="text-lg font-medium">لا توجد مبيعات</p>
                    <p className="text-sm">لا توجد مبيعات تطابق معايير البحث</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => {
                const cfg = statusConfig[sale.status] || {
                  label: sale.status,
                  variant: "outline",
                };
                return (
                  <TableRow key={sale._id}>
                    <TableCell className="font-medium">
                      {sale.saleNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.createdAt).toLocaleDateString("ar-EG")}
                      <span className="text-slate-400 text-xs block">
                        {new Date(sale.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {sale.cashierId?.name || "—"}
                    </TableCell>
                    <TableCell>
                      {sale.branchId?.name || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(sale.total).toLocaleString("ar-EG")} ج.م
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDetails(sale)}
                      >
                        عرض التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          عرض {sales.length} من {total} عملية بيع
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            السابق
          </Button>
          <span className="text-sm text-slate-600 px-2">
            {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}
