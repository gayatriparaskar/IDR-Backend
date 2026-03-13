const asyncHandler = require('express-async-handler');
const Esign = require("../models/ESign");
const { sendToLeegality } = require("../services/leegalityService");
const path = require('path');

// @desc    Create new e-sign request
// @route   POST /api/e-sign
// @access  Public

exports.createESign = async (req, res) => {
  try {
    console.log("Creating e-sign request...");
    
    const { 
      name, 
      email, 
      phone,
      aadharNumber,
      panNumber,
      llpName,
      llpId
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !aadharNumber || !panNumber || !llpName || !llpId) {
      return res.status(400).json({ 
        error: "Missing required fields: name, email, phone, aadharNumber, panNumber, llpName, llpId" 
      });
    }

    // Check for existing e-sign with same Aadhar or PAN
    const existingESign = await Esign.findOne({
      $or: [
        { aadharNumber },
        { panNumber }
      ]
    });

    if (existingESign) {
      return res.status(400).json({ 
        error: "E-sign request already exists with this Aadhar or PAN number" 
      });
    }

    const filePath = path.join(__dirname, './Master-Agreement-Kanchan-Palace-2.pdf');
    console.log("Using PDF file:", filePath);

    const esign = await Esign.create({
      name,
      email,
      phone,
      aadharNumber,
      panNumber,
      llpName,
      llpId,
      documentPath: filePath,
      status: 'verified'
    });

    console.log("E-sign record created with ID:", esign._id);

    const leegalityResponse = await sendToLeegality(
      filePath,
      name,
      email,
      phone,
      esign._id
    );

    if (leegalityResponse.success) {
      esign.externalRequestId = leegalityResponse.data.data?.documentId;
      esign.externalStatus = leegalityResponse.data.status;
      esign.status = 'verified';
      
      await esign.save();

      res.json({
        success: true,
        documentId: leegalityResponse.data.data?.documentId,
        inviteLink: leegalityResponse.data.data?.invitees?.[0]?.signUrl,
        esignId: esign._id
      });
    } else {
      // If Leegality API fails, update status and return error
      esign.status = 'leegality_failed';
      await esign.save();
      
      res.status(500).json({
        success: false,
        error: "Failed to send to Leegality API",
        details: leegalityResponse.error
      });
    }

  } catch (error) {
    console.error("Create e-sign error:", error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// @desc    Handle Leegality webhook callback
// @route   POST /api/e-sign/webhook
// @access  Public

exports.esignWebhook = async (req, res) => {
  try {
    console.log("Webhook received:", req.body);
    
    const { documentId, status, signedFile } = req.body;

    const esign = await Esign.findOne({
      externalRequestId: documentId
    });

    if (!esign) return res.sendStatus(404);

    esign.externalStatus = status;

    if (status === "completed" || status === 1) {
      esign.status = "signed";
      esign.signedDocumentUrl = signedFile;
      esign.signedAt = new Date();
    } else if (status === "rejected") {
      esign.status = "rejected";
    }

    await esign.save();
    console.log("E-sign status updated:", esign.status);

    res.sendStatus(200);

  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
};

// @desc    Get e-sign status
// @route   GET /api/e-sign/:id
// @access  Public

exports.getESignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const esign = await Esign.findById(id);
    
    if (!esign) {
      return res.status(404).json({ error: "E-sign request not found" });
    }

    res.json({
      success: true,
      esign: {
        id: esign._id,
        name: esign.name,
        email: esign.email,
        status: esign.status,
        externalStatus: esign.externalStatus,
        externalRequestId: esign.externalRequestId,
        signedDocumentUrl: esign.signedDocumentUrl,
        createdAt: esign.createdAt,
        signedAt: esign.signedAt
      }
    });

  } catch (error) {
    console.error("Get status error:", error);
    res.status(500).json({ error: error.message });
  }
};
// @route   POST /api/e-sign/callback/:eSignId
// @access  Public
exports.handleESignCallback = asyncHandler(async (req, res) => {
    try {
        const { eSignId } = req.params;
        const { signed_pdf, status, request_id, error } = req.body;

        const eSign = await Esign.findById(eSignId);

        if (!eSign) {
            return res.status(404).json({
                success: false,
                message: 'E-sign request not found'
            });
        }

        // Update e-sign with callback data
        if (signed_pdf) {
            eSign.digitalSignature = signed_pdf;
            eSign.signedAt = new Date();
        }

        if (status) {
            eSign.externalStatus = status;
            
            // Map external status to internal status
            if (status === 'completed' || status === 'signed') {
                eSign.status = 'verified';
                eSign.isAadharVerified = true;
                eSign.isPanVerified = true;
            } else if (status === 'failed' || status === 'error') {
                eSign.status = 'rejected';
                eSign.remarks = error || 'External e-sign failed';
            }
        }

        if (request_id) {
            eSign.externalRequestId = request_id;
        }

        await eSign.save();

        // Log the callback
        console.log(`E-sign callback received for ${eSignId}:`, {
            status,
            request_id,
            hasSignedDocument: !!signed_pdf
        });

        // Send response to external service
        res.status(200).json({
            success: true,
            message: 'Callback processed successfully'
        });

    } catch (error) {
        console.error('E-sign callback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process callback'
        });
    }
});

// @desc    Get all e-sign requests
// @route   GET /api/e-sign
// @access  Private/Admin
exports.getAllESigns = asyncHandler(async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            status = '' 
        } = req.query;

        const result = await ESign.getPaginatedESigns(
            parseInt(page),
            parseInt(limit),
            search,
            status
        );

        res.status(200).json({
            success: true,
            data: result.eSigns,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get single e-sign request
// @route   GET /api/e-sign/:id
// @access  Private/Admin
exports.getESignById = asyncHandler(async (req, res) => {
    try {
        const eSign = await ESign.findById(req.params.id);

        if (!eSign) {
            return res.status(404).json({
                success: false,
                message: 'E-sign request not found'
            });
        }

        res.status(200).json({
            success: true,
            data: eSign
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update e-sign request
// @route   PUT /api/e-sign/:id
// @access  Private/Admin
exports.updateESign = asyncHandler(async (req, res) => {
    try {
        const { 
            name, 
            aadharNumber, 
            panNumber, 
            llpName, 
            llpId,
            status,
            remarks
        } = req.body;

        const eSign = await ESign.findById(req.params.id);

        if (!eSign) {
            return res.status(404).json({
                success: false,
                message: 'E-sign request not found'
            });
        }

        const updateData = {};
        
        if (name) updateData.name = name.trim();
        if (aadharNumber) updateData.aadharNumber = aadharNumber.trim();
        if (panNumber) updateData.panNumber = panNumber.toUpperCase().trim();
        if (llpName) updateData.llpName = llpName.trim();
        if (llpId) updateData.llpId = llpId.trim();
        if (status) updateData.status = status;
        if (remarks) updateData.remarks = remarks.trim();

        const updatedESign = await ESign.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'E-sign request updated successfully',
            data: updatedESign
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Verify e-sign request
// @route   PUT /api/e-sign/:id/verify
// @access  Private/Admin
exports.verifyESign = asyncHandler(async (req, res) => {
    try {
        const { 
            status, // 'verified' or 'rejected'
            remarks,
            digitalSignature
        } = req.body;

        const eSign = await ESign.findById(req.params.id);

        if (!eSign) {
            return res.status(404).json({
                success: false,
                message: 'E-sign request not found'
            });
        }

        const updateData = {
            status: status || 'verified',
            remarks: remarks || '',
            signedAt: new Date()
        };

        if (digitalSignature) {
            updateData.digitalSignature = digitalSignature;
        }

        const verifiedESign = await ESign.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: `E-sign request ${status} successfully`,
            data: verifiedESign
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete e-sign request
// @route   DELETE /api/e-sign/:id
// @access  Private/Admin
exports.deleteESign = asyncHandler(async (req, res) => {
    try {
        const eSign = await ESign.findById(req.params.id);

        if (!eSign) {
            return res.status(404).json({
                success: false,
                message: 'E-sign request not found'
            });
        }

        await eSign.deleteOne();

        res.status(200).json({
            success: true,
            message: 'E-sign request deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get e-sign statistics
// @route   GET /api/e-sign/stats
// @access  Private/Admin
exports.getESignStats = asyncHandler(async (req, res) => {
    try {
        const stats = await ESign.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await ESign.countDocuments();
        const today = await ESign.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });

        res.status(200).json({
            success: true,
            data: {
                total,
                today,
                byStatus: stats.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Access e-sign with auth token
// @route   GET /api/e-sign/access/:authToken
// @access  Public (with auth token)
exports.accessESign = asyncHandler(async (req, res) => {
    try {
        const { authToken } = req.params;
        const { verificationCode } = req.body;

        const eSign = await ESign.findOne({ 
            authToken,
            status: { $ne: 'rejected' },
            expiresAt: { $gt: new Date() }
        });

        if (!eSign) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired auth token'
            });
        }

        // Check IP whitelist
        const clientIP = req.ip || req.connection.remoteAddress;
        if (eSign.whitelistedIPs.length > 0 && !eSign.whitelistedIPs.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                message: 'IP address not whitelisted'
            });
        }

        // Verify verification code if provided
        if (verificationCode) {
            const { verifySecureHash } = require('../middleware/eSignAuth');
            const isValidCode = verifySecureHash(
                verificationCode.toString(), 
                eSign.verificationCode, 
                eSign.privateSalt
            );

            if (!isValidCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code'
                });
            }

            eSign.isEmailVerified = true;
            await eSign.save();
        }

        // Decrypt sensitive data for response
        const { decryptData } = require('../middleware/eSignAuth');
        const decryptedAadhar = decryptData(eSign.aadharNumber, process.env.ENCRYPTION_KEY || 'default-key');
        const decryptedPan = decryptData(eSign.panNumber, process.env.ENCRYPTION_KEY || 'default-key');

        // Update access tracking
        eSign.lastAccessedAt = new Date();
        eSign.accessCount += 1;
        await eSign.save();

        res.status(200).json({
            success: true,
            data: {
                _id: eSign._id,
                name: eSign.name,
                aadharNumber: decryptedAadhar,
                panNumber: decryptedPan,
                llpName: eSign.llpName,
                llpId: eSign.llpId,
                dateTime: eSign.dateTime,
                status: eSign.status,
                isEmailVerified: eSign.isEmailVerified,
                isAadharVerified: eSign.isAadharVerified,
                isPanVerified: eSign.isPanVerified,
                accessCount: eSign.accessCount,
                lastAccessedAt: eSign.lastAccessedAt,
                expiresAt: eSign.expiresAt
            }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update whitelisted IPs
// @route   PUT /api/e-sign/:id/whitelist-ip
// @access  Private/Admin
exports.updateWhitelistedIPs = asyncHandler(async (req, res) => {
    try {
        const { whitelistedIPs } = req.body;

        const eSign = await ESign.findById(req.params.id);

        if (!eSign) {
            return res.status(404).json({
                success: false,
                message: 'E-sign request not found'
            });
        }

        eSign.whitelistedIPs = Array.isArray(whitelistedIPs) ? whitelistedIPs : [];
        await eSign.save();

        res.status(200).json({
            success: true,
            message: 'Whitelisted IPs updated successfully',
            data: {
                whitelistedIPs: eSign.whitelistedIPs
            }
        });
    } catch (error) {
        next(error);
    }
});
