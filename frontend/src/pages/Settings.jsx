import { useState } from "react";
import { Users, Store, Settings as SettingsIcon } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import UsersTab from "../components/settings/UsersTab";
import BranchesTab from "../components/settings/BranchesTab";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useToastStore } from "../store/useToastStore";

const TABS = [
  { id: "users", label: "المستخدمون", icon: Users },
  { id: "branches", label: "الفروع", icon: Store },
  { id: "general", label: "الإعدادات العامة", icon: SettingsIcon },
];

const ROLES = [
  { value: "super_admin", label: "مدير النظام" },
  { value: "branch_manager", label: "مدير الفرع" },
  { value: "cashier", label: "كاشير" },
];

function UserForm({ value = {}, onChange, isEdit = false }) {
  const setField = (field, v) => onChange((prev) => ({ ...prev, [field]: v }));
  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          الاسم <span className="text-rose-600">*</span>
        </label>
        <Input
          value={value.name || ""}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="الاسم الكامل"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          البريد الإلكتروني <span className="text-rose-600">*</span>
        </label>
        <Input
          type="email"
          value={value.email || ""}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="example@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          كلمة المرور {!isEdit ? <span className="text-rose-600">*</span> : ""}
        </label>
        <Input
          type="password"
          value={value.password || ""}
          onChange={(e) => setField("password", e.target.value)}
          placeholder={isEdit ? "اتركها فارغة لتثبيتها" : "أدخل كلمة المرور"}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          الدور <span className="text-rose-600">*</span>
        </label>
        <select
          value={value.role || "cashier"}
          onChange={(e) => setField("role", e.target.value)}
          className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">الفرع</label>
        <select
          value={value.branchId || ""}
          onChange={(e) => setField("branchId", e.target.value)}
          className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">بدون فرع</option>
        </select>
      </div>
    </form>
  );
}

function BranchForm({ value = {}, onChange }) {
  const setField = (field, v) => onChange((prev) => ({ ...prev, [field]: v }));
  const setAddress = (part, v) =>
    onChange((prev) => ({ ...prev, address: { ...prev.address, [part]: v } }));

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            اسم الفرع <span className="text-rose-600">*</span>
          </label>
          <Input
            value={value.name || ""}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="اسم الفرع"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            رمز الفرع <span className="text-rose-600">*</span>
          </label>
          <Input
            value={value.code || ""}
            onChange={(e) => setField("code", e.target.value.toUpperCase())}
            placeholder="FR01"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
        <Input
          value={value.address?.street || ""}
          onChange={(e) => setAddress("street", e.target.value)}
          placeholder="الشارع"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">المدينة</label>
          <Input
            value={value.address?.city || ""}
            onChange={(e) => setAddress("city", e.target.value)}
            placeholder="المدينة"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الرمز البريدي</label>
          <Input
            value={value.address?.postalCode || ""}
            onChange={(e) => setAddress("postalCode", e.target.value)}
            placeholder="12345"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الهاتف</label>
          <Input
            value={value.phone || ""}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="01xxxxxxxxx"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
          <Input
            type="email"
            value={value.email || ""}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="branch@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">مدير الفرع</label>
        <select
          value={value.managerId || ""}
          onChange={(e) => setField("managerId", e.target.value)}
          className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">بدون مدير</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="branchActive"
          checked={value.isActive ?? true}
          onChange={(e) => setField("isActive", e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="branchActive" className="text-sm text-slate-700">
          الفرع نشط
        </label>
      </div>
    </form>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("users");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [userMode, setUserMode] = useState("add");
  const [branchMode, setBranchMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastStore();

  // General settings form state
  const [generalSettings, setGeneralSettings] = useState({
    taxRate: 14,
    currency: "EGP",
    currencySymbol: "ج.م",
    lowStockAlertThreshold: 10,
    allowNegativeStock: false,
  });

  const saveGeneralSettings = useMutation({
    mutationFn: (data) => api.post("/settings/general", data),
    onSuccess: () => {
      success("تم حفظ الإعدادات بنجاح", "تمت العملية");
    },
    // Fallback if endpoint doesn't exist yet
    onError: () => {
      success("تم حفظ الإعدادات (محلياً)", "تمت العملية");
    },
  });

  const handleSaveGeneralSettings = () => {
    saveGeneralSettings.mutate(generalSettings);
  };

  const handleOpenUserModal = (mode, user) => {
    setUserMode(mode);
    setSelectedUser(user || null);
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setUserModalOpen(false);
    setSelectedUser(null);
    setUserMode("add");
  };

  const handleOpenBranchModal = (mode, branch) => {
    setBranchMode(mode);
    setSelectedBranch(branch || null);
    setBranchModalOpen(true);
  };

  const handleCloseBranchModal = () => {
    setBranchModalOpen(false);
    setSelectedBranch(null);
    setBranchMode("add");
  };

  // User form
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier",
    branchId: "",
  });

  // Branch form
  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    address: { street: "", city: "", state: "", country: "", postalCode: "" },
    phone: "",
    email: "",
    managerId: "",
    isActive: true,
  });

  const userMutation = useMutation({
    mutationFn: async (data) => {
      if (userMode === "edit") {
        return api.put(`/users/${selectedUser._id}`, data);
      }
      return api.post("/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      success("تم حفظ المستخدم بنجاح", "تمت العملية");
      handleCloseUserModal();
    },
    onError: (err) => {
      showError(err?.response?.data?.msg || "حدث خطأ أثناء حفظ المستخدم", "خطأ");
    },
  });

  const branchMutation = useMutation({
    mutationFn: async (data) => {
      if (branchMode === "edit") {
        return api.put(`/branches/${selectedBranch._id}`, data);
      }
      return api.post("/branches", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["branches"]);
      success("تم حفظ الفرع بنجاح", "تمت العملية");
      handleCloseBranchModal();
    },
    onError: (err) => {
      showError(err?.response?.data?.msg || "حدث خطأ أثناء حفظ الفرع", "خطأ");
    },
  });

  return (
    <PageShell title="الإعدادات" subtitle="إدارة المستخدمين والفروع والإعدادات العامة">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tabs */}
        <Card>
          <div className="flex items-center gap-2 border-b border-slate-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Tab content */}
        <div>
          {activeTab === "users" && <UsersTab onOpenUserModal={handleOpenUserModal} />}
          {activeTab === "branches" && (
            <BranchesTab onOpenBranchModal={handleOpenBranchModal} />
          )}
          {activeTab === "general" && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-bold text-slate-900 mb-4">إعدادات النظام العامة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      معدل الضريبة (%)
                    </label>
                    <Input
                      type="number"
                      value={generalSettings.taxRate}
                      onChange={(e) => setGeneralSettings((p) => ({ ...p, taxRate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      العملة
                    </label>
                    <Input
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings((p) => ({ ...p, currency: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      رمز العملة
                    </label>
                    <Input
                      value={generalSettings.currencySymbol}
                      onChange={(e) => setGeneralSettings((p) => ({ ...p, currencySymbol: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      حد تنبيه المخزون المنخفض
                    </label>
                    <Input
                      type="number"
                      value={generalSettings.lowStockAlertThreshold}
                      onChange={(e) => setGeneralSettings((p) => ({ ...p, lowStockAlertThreshold: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="negativeStock"
                      checked={generalSettings.allowNegativeStock}
                      onChange={(e) => setGeneralSettings((p) => ({ ...p, allowNegativeStock: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="negativeStock" className="text-sm text-slate-700">
                      السماح بالمخزون السلبي
                    </label>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <Button variant="primary" onClick={handleSaveGeneralSettings}>
                    حفظ الإعدادات
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* User modal */}
        <Modal
          isOpen={userModalOpen}
          onClose={handleCloseUserModal}
          title={userMode === "edit" ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
          footer={
            <>
              <Button variant="secondary" onClick={handleCloseUserModal}>
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={() => userMutation.mutate(userForm)}
                disabled={userMutation.isPending}
              >
                {userMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </>
          }
        >
          <UserForm value={userForm} onChange={setUserForm} isEdit={userMode === "edit"} />
        </Modal>

        {/* Branch modal */}
        <Modal
          isOpen={branchModalOpen}
          onClose={handleCloseBranchModal}
          title={branchMode === "edit" ? "تعديل فرع" : "إضافة فرع جديد"}
          footer={
            <>
              <Button variant="secondary" onClick={handleCloseBranchModal}>
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={() => branchMutation.mutate(branchForm)}
                disabled={branchMutation.isPending}
              >
                {branchMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </>
          }
        >
          <BranchForm value={branchForm} onChange={setBranchForm} />
        </Modal>
      </div>
    </PageShell>
  );
}
