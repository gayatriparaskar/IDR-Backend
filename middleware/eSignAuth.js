const crypto = require('crypto');
const ESign = require('../models/ESign');

// @desc    Middleware to verify e-sign auth token
const verifyESignAuth = async (req, res, next) => {
    try {
        const { authToken } = req.headers;
        
        if (!authToken) {
            return res.status(401).json({
                success: false,
                message: 'Auth token is required'
            });
        }

        const eSign = await ESign.findOne({ 
            authToken,
            status: { $ne: 'rejected' },
            expiresAt: { $gt: new Date() }
        });

        if (!eSign) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired auth token'
            });
        }

        // Check if account is locked
        if (eSign.isLocked) {
            return res.status(403).json({
                success: false,
                message: `Account locked: ${eSign.lockReason || 'Contact support'}`
            });
        }

        // Check max failed attempts
        const maxAttempts = parseInt(process.env.MAX_ACCESS_ATTEMPTS) || 5;
        if (eSign.failedAttempts >= maxAttempts) {
            eSign.isLocked = true;
            eSign.lockReason = 'Too many failed attempts';
            await eSign.save();
            
            return res.status(429).json({
                success: false,
                message: 'Account locked due to too many failed attempts'
            });
        }

        // Check if IP is whitelisted
        const clientIP = req.ip || req.connection.remoteAddress;
        if (eSign.whitelistedIPs.length > 0 && !eSign.whitelistedIPs.includes(clientIP)) {
            // Increment failed attempts
            eSign.failedAttempts += 1;
            await eSign.save();
            
            return res.status(403).json({
                success: false,
                message: 'IP address not whitelisted',
                attemptsRemaining: maxAttempts - eSign.failedAttempts
            });
        }

        // Reset failed attempts on successful access
        if (eSign.failedAttempts > 0) {
            eSign.failedAttempts = 0;
        }

        // Update access tracking
        eSign.lastAccessedAt = new Date();
        eSign.accessCount += 1;
        await eSign.save();

        req.eSign = eSign;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// @desc    Middleware to check if IP is whitelisted
const checkWhitelistedIP = (req, res, next) => {
    const whitelistedIPs = process.env.WHITELISTED_IPS ? 
        process.env.WHITELISTED_IPS.split(',') : 
        ['127.0.0.1', '::1', 'localhost']; // Default local IPs

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!whitelistedIPs.includes(clientIP)) {
        return res.status(403).json({
            success: false,
            message: 'IP address not whitelisted',
            clientIP
        });
    }

    next();
};

// @desc    Generate secure hash using environment secret
const generateSecureHash = (data, salt) => {
    const secret = process.env.PRIVATE_SALT_SECRET || 'default-salt-secret';
    return crypto.createHmac('sha256', secret)
        .update(data + salt)
        .digest('hex');
};

// @desc    Verify hash with environment secret
const verifySecureHash = (data, hash, salt) => {
    const computedHash = generateSecureHash(data, salt);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
};

// @desc    Generate verification code using environment config
const generateVerificationCode = () => {
    const length = parseInt(process.env.VERIFICATION_CODE_LENGTH) || 6;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max).toString();
};

// @desc    Encrypt sensitive data using environment key
const encryptData = (data) => {
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

// @desc    Decrypt sensitive data using environment key
const decryptData = (encryptedData) => {
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key';
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

// @desc    Generate auth token using environment secret
const generateAuthToken = () => {
    const secret = process.env.AUTH_TOKEN_SECRET || 'default-auth-secret';
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    return crypto.createHmac('sha256', secret)
        .update(timestamp + random)
        .digest('hex');
};

// @desc    Generate private salt using environment secret
const generatePrivateSalt = () => {
    const saltSecret = process.env.PRIVATE_SALT_SECRET || 'default-salt-secret';
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(8).toString('hex');
    return crypto.createHmac('sha256', saltSecret)
        .update(timestamp + random)
        .digest('hex').substring(0, 32);
};

module.exports = {
    verifyESignAuth,
    checkWhitelistedIP,
    generateSecureHash,
    verifySecureHash,
    generateVerificationCode,
    encryptData,
    decryptData,
    generateAuthToken,
    generatePrivateSalt
};
