import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import Badge from "../ui/Badge";
import { Skeleton } from "../ui/Skeleton";

export default function ProductTable({
  products,
  loading,
  total,
  page,
  totalPages,
  onPageChange,
  onSearch,
  search,
  category,
  onCategoryChange,
  onEdit,
  onDelete,
}) {
  const stockStatus = (quantity, reorderLevel) => {
    if (quantity <= 0) {
      return { text: "نفذ", variant: "danger", color: "red" };
    }
    if (quantity <= reorderLevel) {
      return { text: `منخفض (${quantity})`, variant: "warning", color: "amber" };
    }
    return { text: `متوفر (${quantity})`, variant: "success", color: "green" };
  };

  const handleDelete = (product) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف "${product.name}"؟`);
    if (!confirmed) return;
    onDelete(product);
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="بحث عن منتج..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-72 pr-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">كل الفئات</option>
            <option value="electronics">إلكترونيات</option>
            <option value="clothing">ملابس</option>
            <option value="food">أغذية</option>
            <option value="furniture">أثاث</option>
            <option value="sports">رياضة</option>
            <option value="books">كتب</option>
            <option value="beauty">تجميل</option>
            <option value="toys">ألعاب</option>
            <option value="other">أخرى</option>
          </select>
        </div>
        <Button variant="primary" onClick={() => onEdit(null)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>رمز المنتج</TableHead>
              <TableHead>التصنيف</TableHead>
              <TableHead>سعر البيع</TableHead>
              <TableHead>المخزون</TableHead>
              <TableHead className="text-center">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Skeleton className="w-8 h-8 rounded" />
                      <Skeleton className="w-8 h-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Search className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="text-lg font-medium">لا توجد منتجات</p>
                    <p className="text-sm">اضغط على "إضافة منتج" للبدء</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const stock = product.inventory || {};
                const status = stockStatus(
                  stock.quantity ?? 0,
                  stock.reorderLevel ?? 10
                );
                return (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{product.name}</p>
                        {product.barcode && (
                          <p className="text-xs text-slate-500">
                            Barcode: {product.barcode}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category || "—"}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(product.price).toLocaleString("ar-EG")} ج.م
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.text}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
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
          عرض {products.length} من {total} منتج
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
