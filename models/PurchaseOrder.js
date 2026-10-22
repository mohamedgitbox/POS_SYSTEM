const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required"],
  },
  orderedQty: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  unitCost: {
    type: Number,
    required: [true, "Unit cost is required"],
    min: [0, "Unit cost cannot be negative"],
  },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    supplierName: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [purchaseItemSchema],
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "RECEIVED", "CANCELLED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);

// إضافة تحقق يمنع items الفارغة.

// حساب totalCost داخل الـ Backend، وعدم الوثوق في القيمة القادمة من العميل.

// التفكير في Supplier Model بدل تخزين اسم المورد فقط، إذا كنت تحتاج بيانات المورد وسجله التاريخي.

// إضافة دعم الاستلام الجزئي إذا كان النشاط يحتاجه، باستخدام حقول مثل receivedQty.

// حماية عملية الاستلام باستخدام Transaction ومنع استلام الطلب أكثر من مرة.

// استخدام طريقة دقيقة لحساب المبالغ المالية، مع مراعاة دقة العملة.

// تحديد قواعد واضحة لتعديل أو إلغاء أمر الشراء بعد الاستلام.
