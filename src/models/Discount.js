const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    percentage: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
    type: {
      type: String,
      enum: ["course", "formation", "both"],
      default: "course"
    },
    targetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      }
    ],
    targetItems: [
      {
        _id: { type: String, required: true },
        title: { type: String, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);


module.exports = mongoose.model("Discount", discountSchema);
