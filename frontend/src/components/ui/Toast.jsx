import { motion, AnimatePresence } from "motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useToastStore } from "../../store/useToastStore";

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -50, x: "-50%" }}
          transition={{ type: "spring", damping: 20 }}
          className={cn(
            "fixed top-4 left-1/2 z-50 min-w-[320px] max-w-md rounded-lg px-4 py-3 shadow-lg flex items-start gap-3",
            toast.type === "success" &&
              "bg-emerald-50 border border-emerald-200 text-emerald-900",
            toast.type === "error" &&
              "bg-rose-50 border border-rose-200 text-rose-900",
            toast.type === "warning" &&
              "bg-amber-50 border border-amber-200 text-amber-900",
            toast.type === "info" &&
              "bg-blue-50 border border-blue-200 text-blue-900"
          )}
        >
          {toast.type === "success" && (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          {toast.type === "warning" && (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          {toast.type === "info" && (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            {toast.title && (
              <p className="font-medium text-sm mb-1">{toast.title}</p>
            )}
            <p className="text-sm">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
