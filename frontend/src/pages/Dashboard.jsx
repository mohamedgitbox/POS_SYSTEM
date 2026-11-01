import { Package, DollarSign, Receipt, TrendingUp, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import Card from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";

const formatDate = (date) => {
  const iso = new Date(date);
  iso.setHours(0, 0, 0, 0);
  return iso.toISOString();
};

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ج.م`;

const PAYMENT_LABELS = {
  cash: "نقدي",
  card: "بطاقة بنكية",
  digital: "دفع رقمي",
  other: "أخرى",
};

const PAYMENT_COLORS = {
  cash: "bg-emerald-500",
  card: "bg-blue-500",
  digital: "bg-violet-500",
  other: "bg-slate-400",
};

function StatCard({ title, value, icon: Icon, tone = "blue", loading, to }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  const content = (
    <Card className={`p-6 h-full ${to ? "hover:shadow-md transition-shadow" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${tones[tone]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", user?.branchId?._id || user?.branchId || null],
    queryFn: () =>
      api.get("/reports/dashboard", {
        params: {
          from: formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
          to: formatDate(new Date()),
        },
      }),
  });

  const dashboard = data?.data || {};

  const totalRevenue = dashboard.totalRevenue ?? 0;
  const totalTransactions = dashboard.totalTransactions ?? 0;
  const totalProductsSold = dashboard.totalProductsSold ?? 0;
  const lowStockAlert = dashboard.lowStockAlert ?? 0;

  const topProducts = dashboard.topSellingProducts || [];
  const paymentMix = dashboard.salesByPaymentMethod || [];
  const revenueByBranch = dashboard.revenueByBranch || [];

  const maxBranchRevenue = Math.max(
    ...revenueByBranch.map((b) => b.revenue || 0),
    1
  );

  if (error) {
    return (
      <PageShell title="لوحة التحكم" subtitle="نظرة عامة على أداء المتجر">
        <div className="max-w-7xl mx-auto">
          <Card className="p-10 flex flex-col items-center text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
            <p className="text-lg font-semibold text-slate-900 mb-1">
              فشل تحميل بيانات لوحة التحكم
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {error.message || "يرجى المحاولة مرة أخرى"}
            </p>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="لوحة التحكم" subtitle="نظرة عامة على أداء المتجر">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="إجمالي الإيرادات (30 يوم)"
            value={formatMoney(totalRevenue)}
            icon={DollarSign}
            tone="blue"
            loading={isLoading}
          />
          <StatCard
            title="عدد المعاملات"
            value={totalTransactions.toLocaleString("ar-EG")}
            icon={Receipt}
            tone="emerald"
            loading={isLoading}
          />
          <StatCard
            title="المنتجات المباعة"
            value={totalProductsSold.toLocaleString("ar-EG")}
            icon={TrendingUp}
            tone="violet"
            loading={isLoading}
          />
          <StatCard
            title="تنبيهات المخزون"
            value={`${lowStockAlert.toLocaleString("ar-EG")} منتج`}
            icon={Package}
            tone="amber"
            loading={isLoading}
            to="/inventory"
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/pos"
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 shadow-sm transition-colors"
          >
            <span className="bg-white/20 p-2 rounded-lg">
              <Receipt className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold">ابدأ البيع الآن</p>
              <p className="text-xs text-blue-100">انتقل إلى نقطة البيع</p>
            </div>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            to="/shifts"
            className="flex items-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-xl px-5 py-4 shadow-sm transition-colors"
          >
            <span className="bg-slate-100 p-2 rounded-lg text-slate-600">
              <DollarSign className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold">إدارة الورديات</p>
              <p className="text-xs text-slate-500">فتح وإغلاق الصندوق</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-xl px-5 py-4 shadow-sm transition-colors"
          >
            <span className="bg-slate-100 p-2 rounded-lg text-slate-600">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold">التقارير</p>
              <p className="text-xs text-slate-500">تحليلات مفصلة</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top selling products */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              أفضل المنتجات مبيعاً
            </h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                لا توجد مبيعات في الفترة الأخيرة
              </div>
            ) : (
              <div className="space-y-1">
                {topProducts.map((p, index) => (
                  <div
                    key={p._id || index}
                    className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                  >
                    <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-sm font-medium text-slate-800 truncate">
                      {p.name}
                    </p>
                    <span className="text-xs text-slate-500">
                      {p.quantitySold?.toLocaleString("ar-EG")} وحدة
                    </span>
                    <span className="text-sm font-semibold text-slate-900 w-24 text-left">
                      {formatMoney(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Payment mix + branch revenue */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              توزيع طرق الدفع
            </h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : paymentMix.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                لا توجد بيانات دفع في الفترة الأخيرة
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMix.map((m, index) => {
                  const share =
                    totalRevenue > 0 ? ((m.revenue / totalRevenue) * 100).toFixed(0) : 0;
                  return (
                    <div key={m._id || index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">
                          {PAYMENT_LABELS[m._id] || m._id}
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatMoney(m.revenue)} · {share}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            PAYMENT_COLORS[m._id] || "bg-slate-400"
                          }`}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {revenueByBranch.length > 1 && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">
                  الإيراد حسب الفرع
                </h3>
                <div className="space-y-3">
                  {revenueByBranch.map((b, index) => (
                    <div key={b._id || index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 font-medium">
                          {b.branchId?.name || "فرع"}
                        </span>
                        <span className="text-slate-500">
                          {formatMoney(b.revenue)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${((b.revenue || 0) / maxBranchRevenue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
