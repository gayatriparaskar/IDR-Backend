const mongoose = require("mongoose");

const querySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: [false, "Subject is required"],
      trim: true,
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    currentStatus: {
      type: String,
      enum: ["new", "in_progress", "resolved", "spam"],
      default: "new",
    },
    updatedStatus: {
      type: String,
      enum: ["new", "in_progress", "resolved", "spam"],
    },
    resolveMessage: {
      type: String,
    },
    response: {
      message: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // If you have a User model for admin
      },
    },
    queryFrom: { type: String, enum: ["IDR", "Aadhar Asset"], required: true },
  },
  {
    timestamps: true,
  },
);

// Add text index for search
querySchema.index({
  name: "text",
  email: "text",
  subject: "text",
  message: "text",
});

// Static method to get paginated queries
querySchema.statics.getPaginatedQueries = async function (
  page = 1,
  limit = 10,
  search = "",
  status = "",
) {
  const query = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [queries, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    queries,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
    },
  };
};

module.exports = mongoose.model("Query", querySchema);
