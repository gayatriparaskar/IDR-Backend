const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number starting with 6-9']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
    default: 'new'
  },
  updateStatus: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost']
  },
  resolveMessage: {
    type: String,
    trim: true,
    maxlength: [1000, 'Resolve message cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Add text index for search functionality
leadSchema.index({ name: 'text', email: 'text', phone: 'text' });

// Static method to get paginated leads
leadSchema.statics.getPaginatedLeads = async function(page = 1, limit = 10, search = '', status = '') {
  const query = {};
  
  if (search) {
    query.$text = { $search: search };
  }
  
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    leads,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages
    }
  };
};

module.exports = mongoose.model('Lead', leadSchema);
