import { useState, useEffect } from "react";
import { Users, Store, Settings as SettingsIcon } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import UsersTab from "../components/settings/UsersTab";
import BranchesTab from "../components/settings/BranchesTab";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useToastStore } from "../store/useToastStore";
import { useSettingsStore, sanitizeSettings } from "../store/useSettingsStore";
import { useCartStore } from "../store/useCartStore";

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

function UserForm({ value = {}, onChange, isEdit = false, branches = [] }) {
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
          {branches.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
      </div>
    </form>
  );
}

function BranchForm({ value = {}, onChange, users = [] }) {
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
          {users
            .filter((u) => u.role === "branch_manager" || u.role === "super_admin")
            .map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
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
  const { success, error: showError, info } = useToastStore();

  // Branch options for the user form (and shift/open selection elsewhere)
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => api.get("/branches"),
  });
  const branches = branchesData?.data || [];

  // manager options for the branch form (admins can list users)
  const { data: usersData } = useQuery({
    queryKey: ["users", "options"],
    queryFn: () => api.get("/users"),
  });
  const userOptions = usersData?.data || [];

  // General settings: hydrate from the backend, keep a persisted local copy,
  // and POST/PUT to /api/settings/general with clear feedback on failure.
  const generalSettings = useSettingsStore();
  const { setSettings } = generalSettings;

  useQuery({
    queryKey: ["settings", "general"],
    queryFn: async () => {
      const res = await api.get("/settings/general");
      const server = res?.data?.data?.settings;
      if (server) setSettings(server);
      return res;
    },
  });

  // keep cart totals in sync whenever the tax rate changes
  useEffect(() => {
    useCartStore.getState().recomputeTotals();
  }, [generalSettings.taxRate, setSettings]);

  const saveGeneralSettings = useMutation({
    mutationFn: (data) => api.put("/settings/general", data),
    onSuccess: (res) => {
      const server = res?.data?.data?.settings;
      if (server) setSettings(server);
      // refresh the cached settings copy so POS tax stays consistent
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      useCartStore.getState().recomputeTotals();
      success("تم حفظ الإعدادات على الخادم بنجاح", "تمت العملية");
    },
    onError: () => {
      // persist locally only; be transparent about where the settings live
      setSettings(generalSettings);
      /**
       * Local fallback: when the backend is unavailable or the account lacks
       * admin permission, settings stay on this device (localStorage) and the
       * UI still reflects/preferences them consistently.
       */
      info("تعذر الحفظ على الخادم - تم حفظ الإعدادات محلياً على هذا الجهاز فقط", "تنبيه");
    },
  });

  const handleSaveGeneralSettings = () => {
    saveGeneralSettings.mutate(sanitizeSettings(generalSettings));
  };

  const handleOpenUserModal = (mode, user) => {
    setUserMode(mode);
    setSelectedUser(user || null);
    setUserForm(
      mode === "edit" && user
        ? {
            name: user.name || "",
            email: user.email || "",
            password: "",
            role: user.role || "cashier",
            branchId:
              (user.branchId && (user.branchId._id || user.branchId)) || "",
          }
        : { name: "", email: "", password: "", role: "cashier", branchId: "" }
    );
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
        // updates go through the protected user management endpoint
        return api.put(`/users/${selectedUser._id}`, {
          ...data,
          branchId: data.branchId || null,
        });
      }
      // creation goes through the admin-only register endpoint which hashes
      // the password and enforces role/branch defaults
      return api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        branchId: data.branchId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      success("تم حفظ المستخدم بنجاح", "تمت العملية");
      handleCloseUserModal();
    },
    onError: (err) => {
      showError(
        err?.message || "حدث خطأ أثناء حفظ المستخدم",
        "خطأ"
      );
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
                      onChange={(e) => setSettings({ taxRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      العملة
                    </label>
                    <Input
                      value={generalSettings.currency}
                      onChange={(e) => setSettings({ currency: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      رمز العملة
                    </label>
                    <Input
                      value={generalSettings.currencySymbol}
                      onChange={(e) => setSettings({ currencySymbol: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      حد تنبيه المخزون المنخفض
                    </label>
                    <Input
                      type="number"
                      value={generalSettings.lowStockAlertThreshold}
                      onChange={(e) => setSettings({ lowStockAlertThreshold: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="negativeStock"
                      checked={generalSettings.allowNegativeStock}
                      onChange={(e) => setSettings({ allowNegativeStock: e.target.checked })}
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
          <UserForm
            value={userForm}
            onChange={setUserForm}
            isEdit={userMode === "edit"}
            branches={branches}
          />
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
          <BranchForm value={branchForm} onChange={setBranchForm} users={userOptions} />
        </Modal>
      </div>
    </PageShell>
  );
}
