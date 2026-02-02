const TeamMember = require('../models/TeamMembers');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// @desc    Create a new team member
// @route   POST /api/team-members
// @access  Private/Admin
exports.createTeamMember = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // If there are validation errors, remove uploaded file if exists
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, phone, position, description, department, skills ,joinDate } = req.body;
        
        // Check if email already exists
        const existingMember = await TeamMember.findOne({ email });
        if (existingMember) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                error: 'A team member with this email already exists'
            });
        }

        // Handle file upload
        let imagePath = '';
        if (req.file) {
            imagePath = `/uploads/team/${req.file.filename}`;
        }

        // Create team member
        const teamMember = await TeamMember.create({
            name,
            email,
            phone,
            position,
            description,
            department,
            skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
            joinDate,
            image: imagePath
        });

        res.status(201).json({
            success: true,
            data: teamMember
        });

    } catch (error) {
        // Clean up uploaded file if an error occurs
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};

// @desc    Get all team members (with pagination)
// @route   GET /api/team-members
// @access  Public
exports.getTeamMembers = async (req, res, next) => {
    try {
       const data = await TeamMember.find();
       console.log(data,"team")
       res.status(200).json({
           success: true,
           data
       });

    } catch (error) {
        next(error);
    }
};

// @desc    Get single team member by ID
// @route   GET /api/team-members/:id
// @access  Public
exports.getTeamMember = async (req, res, next) => {
    try {
        const teamMember = await TeamMember.findById(req.params.id);

        if (!teamMember) {
            return res.status(404).json({
                success: false,
                error: 'Team member not found'
            });
        }

        res.status(200).json({
            success: true,
            data: teamMember
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update team member
// @route   PUT /api/team-members/:id
// @access  Private/Admin
exports.updateTeamMember = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, phone, position, description, department, skills } = req.body;
        
        let teamMember = await TeamMember.findById(req.params.id);

        if (!teamMember) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                success: false,
                error: 'Team member not found'
            });
        }

        // Check if email is being updated and if it already exists
        if (email && email !== teamMember.email) {
            const existingMember = await TeamMember.findOne({ email });
            if (existingMember) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    error: 'A team member with this email already exists'
                });
            }
        }

        // Handle file upload
        if (req.file) {
            // Delete old image if it exists and is not the default
            if (teamMember.image && !teamMember.image.includes('default-avatar')) {
                const oldImagePath = path.join(__dirname, '..', 'public', teamMember.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            teamMember.image = `/uploads/team/${req.file.filename}`;
        }

        // Update team member
        teamMember.name = name || teamMember.name;
        teamMember.email = email || teamMember.email;
        teamMember.phone = phone || teamMember.phone;
        teamMember.position = position || teamMember.position;
        teamMember.description = description !== undefined ? description : teamMember.description;
        teamMember.department = department || teamMember.department;
        teamMember.skills = skills ? skills.split(',').map(skill => skill.trim()) : teamMember.skills;

        await teamMember.save();

        res.status(200).json({
            success: true,
            data: teamMember
        });

    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};

// @desc    Delete team member
// @route   DELETE /api/team-members/:id
// @access  Private/Admin
exports.deleteTeamMember = async (req, res, next) => {
    try {
        const teamMember = await TeamMember.findById(req.params.id);

        if (!teamMember) {
            return res.status(404).json({
                success: false,
                error: 'Team member not found'
            });
        }

        // Delete image if it exists and is not the default
        if (teamMember.image && !teamMember.image.includes('default-avatar')) {
            const imagePath = path.join(__dirname, '..', 'public', teamMember.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await teamMember.remove();

        res.status(200).json({
            success: true,
            data: {}
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get unique departments
// @route   GET /api/team-members/departments
// @access  Public
exports.getDepartments = async (req, res, next) => {
    try {
        const departments = await TeamMember.distinct('department');
        
        res.status(200).json({
            success: true,
            data: departments.filter(Boolean) // Remove any null/undefined values
        });

    } catch (error) {
        next(error);
    }
};