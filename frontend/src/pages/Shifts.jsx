import { useState } from "react";
import { Clock, Plus, KeyRound, TrendingUp, DollarSign } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import OpenShiftModal from "../components/shifts/OpenShiftModal";
import CloseShiftModal from "../components/shifts/CloseShiftModal";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";

export default function Shifts() {
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [activeShift, setActiveShift] = useState(null);
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  // super_admin branch scope: "" = all branches, otherwise a specific branchId
  const [branchFilter, setBranchFilter] = useState("");
  const branchQueryParams = branchFilter ? { branchId: branchFilter } : {};

  // branches for the super_admin selector
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => api.get("/branches"),
    enabled: isSuperAdmin,
  });
  const branches = branchesData?.data || [];

  const { data: activeShiftData, isLoading: activeLoading } = useQuery({
    queryKey: ["activeShift", branchFilter],
    queryFn: () => api.get("/shifts/active", { params: branchQueryParams }),
  });

  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ["shifts", "recent", branchFilter],
    queryFn: () => api.get("/shifts", { params: { limit: 10, ...branchQueryParams } }),
  });

  const recentShifts = shiftsData?.data || [];

  const active = activeShiftData?.data?.[0] || activeShift;

  const handleOpen = () => {
    setOpenModalVisible(true);
  };

  const handleCloseClick = (shift) => {
    setActiveShift(shift);
    setCloseModalVisible(true);
  };

  const handleCloseModal = () => {
    setCloseModalVisible(false);
    setActiveShift(null);
  };

  const formatBalance = (val) =>
    Number(val || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 });

  if (activeLoading) {
    return (
      <PageShell title="إدارة الورديات" subtitle="إدارة وورديات الكاشير والوردية النقدية">
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="إدارة الورديات" subtitle="إدارة وورديات الكاشير والوردية النقدية">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Branch selector - super_admin can view shifts per branch or all */}
        {isSuperAdmin && branches.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">الفرع</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">كل الفروع</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Active shift card */}
        {active ? (
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-blue-100">الوردية النشطة</span>
                </div>
                <p className="text-2xl font-bold">وردية مفتوحة الآن</p>
                <p className="text-blue-100 text-sm mt-1">
                  افتتحت في{" "}
                  {new Date(active.openedAt).toLocaleDateString("ar-EG", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm mb-1">رقم الوردية</p>
                <p className="text-xl font-mono font-bold">{active._id.slice(-8)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/10 rounded-xl p-4 -mx-6 -mb-6">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  رصيد الفتح
                </div>
                <p className="text-xl font-bold">{formatBalance(active.openingBalance)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  المبيعات الحالية
                </div>
                <p className="text-xl font-bold">
                  {active.currentSales ? formatBalance(active.currentSales) : formatBalance(0)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  الرصيد المتوقع
                </div>
                <p className="text-xl font-bold">
                  {active.expectedBalance ? formatBalance(active.expectedBalance) : "-"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <KeyRound className="w-4 h-4" />
                  الكاشير
                </div>
                <p className="text-sm font-medium truncate">
                  {active.cashierId?.name || "—"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="success"
                className="w-full md:w-auto"
                onClick={() => handleCloseClick(active)}
              >
                <KeyRound className="w-4 h-4 ml-2" />
                إغلاق الوردية
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">لا توجد وردية مفتوحة</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              لبدء تسجيل المبيعات والمعاملات النقدية، افتح وردية جديدة وحدد رصيد الصندوق الأولي
            </p>
            <Button variant="primary" size="lg" onClick={handleOpen}>
              <Plus className="w-5 h-5 ml-2" />
              فتح وردية جديدة
            </Button>
          </div>
        )}

        {/* Recent shifts table */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">آخر الورديات</h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {shiftsLoading ? (
              <div className="p-8">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full mt-4" />
              </div>
            ) : recentShifts.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">لا توجد ورديات سابقة</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الوردية</TableHead>
                    <TableHead>الكاشير</TableHead>
                    {isSuperAdmin && <TableHead>الفرع</TableHead>}
                    <TableHead>وقت الفتح</TableHead>
                    <TableHead>وقت الإغلاق</TableHead>
                    <TableHead>رصيد الفتح</TableHead>
                    <TableHead>الرصيد المتوقع</TableHead>
                    <TableHead>رصيد الإغلاق</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentShifts.map((shift) => (
                    <TableRow key={shift._id}>
                      <TableCell className="font-mono text-sm">{shift._id.slice(-8)}</TableCell>
                      <TableCell>{shift.cashierId?.name || "—"}</TableCell>
                      {isSuperAdmin && (
                        <TableCell>{shift.branchId?.name || "—"}</TableCell>
                      )}
                      <TableCell>
                        {new Date(shift.openedAt).toLocaleString("ar-EG", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {shift.closedAt
                          ? new Date(shift.closedAt).toLocaleString("ar-EG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>{formatBalance(shift.openingBalance)}</TableCell>
                      <TableCell>{shift.expectedBalance ? formatBalance(shift.expectedBalance) : "—"}</TableCell>
                      <TableCell>
                        {shift.closingBalance ? formatBalance(shift.closingBalance) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={shift.status === "open" ? "success" : "outline"}>
                          {shift.status === "open" ? "مفتوحة" : "مغلقة"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <OpenShiftModal isOpen={openModalVisible} onClose={() => setOpenModalVisible(false)} />
        <CloseShiftModal isOpen={closeModalVisible} onClose={handleCloseModal} shiftId={active?._id} />
      </div>
    </PageShell>
  );
}
