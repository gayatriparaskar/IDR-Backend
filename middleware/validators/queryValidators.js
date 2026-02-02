const { check } = require('express-validator');

exports.createQueryValidation = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('phone', 'Please include a valid phone number').optional().isMobilePhone(),
    check('subject', 'Subject is required').not().isEmpty().trim().escape(),
    check('message', 'Message is required').not().isEmpty().trim().escape()
];

exports.updateStatusValidation = [
    check('status', 'Status is required')
        .isIn(['new', 'in_progress', 'resolved', 'spam'])
];

exports.respondToQueryValidation = [
    check('message', 'Response message is required').not().isEmpty().trim().escape()
];