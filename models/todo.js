const mongoose = require("mongoose");



const todoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // ============================================
    // IMPORTANT
    //
    // Store calendar date as:
    // "2026-08-17"
    //
    // No UTC conversion
    // No 16T18:30
    // No 17T18:30
    // ============================================
  date: {
  type: String,
  required: true,
  validate: {
    validator: function (value) {
      return /^\d{4}-\d{2}-\d{2}$/.test(value);
    },
    message: "Date must be in YYYY-MM-DD format",
  },
},

    // Example: "16:20"
    scheduledTime: {
      type: String,
      required: true,

      validate: {
        validator: function (value) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
        },
        message: "scheduledTime must be HH:mm format",
      },
    },

    taskType: {
      type: String,
      enum: ["CHECKLIST", "MEASURABLE"],
      default: "CHECKLIST",
    },

    targetvalue: {
      type: Number,
      default: 0,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: null,
    },

    actualValue: {
      type: Number,
      default: 0,
    },

    unit: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    // These represent actual moments,
    // so keeping them as Date is correct.
    completedAt: {
      type: Date,
      default: null,
    },

    delayReason: {
      type: String,
      default: "",
      trim: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    notificationSent: {
      type: Boolean,
      default: false,
    },

    isDelayed: {
      type: Boolean,
      default: false,
    },

    delayReasonSubmittedAt: {
      type: Date,
      default: null,
    },

    completionPercentage: {
      type: Number,
      default: 0,
    },

    isAutoAddEveryday: {
      type: Boolean,
      default: false,
    },

    cancelReason: {
      type: String,
      default: "",
      trim: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

todoSchema.index({
  userId: 1,
  date: 1,
  isDeleted: 1,
});


module.exports = mongoose.model(
  "Todo",
  todoSchema
);