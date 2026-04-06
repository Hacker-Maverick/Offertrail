const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    dateOfApplication: {
        type: Date,
        required: true
    },
    reminderDate: {
        type: Date
    },
    stipend: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Applied', 'OA', 'Interview', 'Shortlisted', 'Rejected', 'Offer', 'Ghosted'],
        default: 'Applied'
    },
    location: {
        type: String,
        trim: true
    },
    duration: {
        type: String,
        trim: true
    },
    notes: {
        type: String
    },
    linkToJob: {
        type: String,
        trim: true
    },
    nextAction: {
        type: String,
        trim: true
    },
    resumeLink: {
        type: String,
        trim: true
    },
    resumeVersion: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['On Campus', 'Off Campus'],
        required: true
    },
    referred: {
        type: Boolean,
        default: false
    },
    referralName: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to set updatedAt
applicationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Application', applicationSchema);
