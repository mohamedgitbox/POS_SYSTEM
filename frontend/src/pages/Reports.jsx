import { useState, useMemo } from "react";
import { Calendar, DollarSign, Receipt, TrendingUp } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import Card from "../components/ui/Card";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const formatDate = (date) => new Date(date).toISOString().split("T")[0];
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const formatDateDisplay = (date) =>
  new Date(date).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const PAYMENT_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#6B7280"];

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <Card className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="bg-blue-50 p-3 rounded-xl">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </Card>
);

const LoadingState = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="h-32 p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-8 bg-slate-200 rounded w-2/3" />
          </div>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="h-80">
        <div className="animate-pulse h-full bg-slate-100 rounded-xl" />
      </Card>
      <Card className="h-80">
        <div className="animate-pulse h-full bg-slate-100 rounded-xl" />
      </Card>
    </div>
  </div>
);

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: formatDate(addDays(new Date(), -30)),
    to: formatDate(new Date()),
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["reportsDashboard", dateRange],
    queryFn: () =>
      api.get("/reports/dashboard", {
        params: { from: dateRange.from, to: dateRange.to },
      }),
  });

  const dashboard = dashboardData?.data || {};
  const totalRevenue = dashboard.totalRevenue || 0;
  const totalTransactions = dashboard.totalTransactions || 0;
  const averageTransactionValue =
    Number(dashboard.averageTransactionValue || 0).toFixed(2);

  const topProductsData = useMemo(() => {
    const items = dashboard.topSellingProducts || [];
    return items.map((p) => ({
      name: p.name,
      revenue: Number(p.revenue).toFixed(2),
      quantity: p.quantitySold,
    }));
  }, [dashboard.topSellingProducts]);

  const paymentData = useMemo(() => {
    const mix = dashboard.salesByPaymentMethod || [];
    return mix.map((m) => ({
      name:
        m._id === "cash"
          ? "نقدي"
          : m._id === "card"
          ? "بطاقة ائتمان"
          : m._id === "digital"
          ? "دفع رقمي"
          : m._id === "other"
          ? "أخرى"
          : m._id,
      revenue: Number(m.revenue).toFixed(2),
      count: m.count,
      value: Number(m.revenue),
    }));
  }, [dashboard.salesByPaymentMethod]);

  if (dashboardLoading) {
    return (
      <PageShell
        title="التقارير والتحليلات"
        subtitle="مراجعة الإيرادات والمعاملات والأداء"
      >
        <LoadingState />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="التقارير والتحليلات"
      subtitle="مراجعة الإيرادات والمعاملات والأداء"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Date range picker */}
        <Card>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                {formatDateDisplay(dateRange.from)} - {formatDateDisplay(dateRange.to)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">من</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                className="h-9 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">إلى</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                className="h-9 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="إجمالي الإيرادات"
            value={`${Number(totalRevenue).toLocaleString("ar-EG")} ج.م`}
            subtitle={`${totalTransactions} معاملة`}
            icon={DollarSign}
          />
          <StatCard
            title="عدد المعاملات"
            value={totalTransactions.toLocaleString("ar-EG")}
            subtitle="إجمالي الفواتير"
            icon={Receipt}
          />
          <StatCard
            title="متوسط قيمة الفاتورة"
            value={`${averageTransactionValue} ج.م`}
            subtitle="نسبة كل معاملة"
            icon={TrendingUp}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top products by revenue */}
          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              أفضل المنتجات مبيعاً (حسب الإيرادات)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={12}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(value) => `${Number(value).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)} ج.م`, "الإيراد"]}
                />
                <Legend />
                <Bar dataKey="revenue" name="الإيراد (ج.م)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Payment method mix */}
          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              توزيع طرق الدفع
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={(entry) => entry.name}
                  labelLine={false}
                >
                  {paymentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)} ج.م`, "الإيراد"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Low stock alert */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">تنبيهات المخزون</h3>
              <p className="text-sm text-slate-500">
                المنتجات التي وصلت إلى حد الطلب أو أقل
              </p>
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {dashboard.lowStockAlert || 0}
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
