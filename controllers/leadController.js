const Lead = require('../models/leadModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
exports.getAllLeads = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const result = await Lead.getPaginatedLeads(page, limit, search, status);

    res.json({
      success: true,
      data: result.leads,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: error.message
    });
  }
});

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLeadById = asyncHandler(async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead',
      error: error.message
    });
  }
});

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private
exports.createLead = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, address, status } = req.body;

    // Check if lead already exists with same email or phone
    const existingLead = await Lead.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: 'Lead with this email or phone already exists'
      });
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      address,
      status: status || 'new'
    });

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead',
      error: error.message
    });
  }
});

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = asyncHandler(async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const allowedUpdates = ['name', 'email', 'phone', 'address', 'status', 'updateStatus', 'resolveMessage'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If updating email or phone, check for duplicates
    if (updates.email || updates.phone) {
      const duplicateLead = await Lead.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(updates.email ? [{ email: updates.email }] : []),
          ...(updates.phone ? [{ phone: updates.phone }] : [])
        ]
      });

      if (duplicateLead) {
        return res.status(400).json({
          success: false,
          message: 'Lead with this email or phone already exists'
        });
      }
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedLead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      error: error.message
    });
  }
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = asyncHandler(async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await lead.deleteOne();

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead',
      error: error.message
    });
  }
});

// @desc    Get lead statistics
// @route   GET /api/leads/stats
// @access  Private
exports.getLeadStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const contactedLeads = await Lead.countDocuments({ status: 'contacted' });
    const qualifiedLeads = await Lead.countDocuments({ status: 'qualified' });
    const convertedLeads = await Lead.countDocuments({ status: 'converted' });
    const lostLeads = await Lead.countDocuments({ status: 'lost' });

    res.json({
      success: true,
      data: {
        total: totalLeads,
        new: newLeads,
        contacted: contactedLeads,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        lost: lostLeads,
        breakdown: stats
      }
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead statistics',
      error: error.message
    });
  }
});
