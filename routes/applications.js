const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { ensureAuth } = require('../middleware/auth');
const { Parser } = require('json2csv');

// Dashboards Stats are also needed. Often dashboard is in a separate route but we can put it in app.js or here.
// Let's put the main apps list here.

// Get All Applications with Filter, Sort, Pagination
router.get('/', ensureAuth, async (req, res) => {
    try {
        const { company, status, category, resumeVersion, sort, page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;

        let query = { userId: req.session.userId };

        if (company) query.companyName = { $regex: company, $options: 'i' };
        if (status) query.status = status;
        if (category) query.category = category;
        if (resumeVersion) query.resumeVersion = resumeVersion;

        let sortQuery = { dateOfApplication: -1 };
        if (sort === 'oldest') sortQuery = { dateOfApplication: 1 };
        if (sort === 'company') sortQuery = { companyName: 1 };

        const applications = await Application.find(query)
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        const total = await Application.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Reminder Logic: Send flags to frontend
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const processedApps = applications.map(app => {
            let reminderClass = '';
            if (app.reminderDate) {
                const rDate = new Date(app.reminderDate);
                rDate.setHours(0, 0, 0, 0);
                if (rDate < today) reminderClass = 'overdue';
                else if (rDate.getTime() === today.getTime()) reminderClass = 'today';
            }
            return { ...app._doc, reminderClass };
        });

        res.render('applications/list', {
            applications: processedApps,
            currentPage: parseInt(page),
            totalPages,
            query: req.query,
            total,
            activePage: 'applications'
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// Show Add Form
router.get('/add', ensureAuth, (req, res) => {
    res.render('applications/add', { activePage: 'add-application' });
});

// Process Add Form
router.post('/add', ensureAuth, async (req, res) => {
    try {
        const newApp = new Application({
            ...req.body,
            userId: req.session.userId,
            referred: req.body.referred === 'on'
        });
        await newApp.save();
        req.flash('success_msg', 'Application added successfully');
        res.redirect('/applications');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error adding application');
        res.redirect('/applications/add');
    }
});

// Delete Application
router.post('/delete/:id', ensureAuth, async (req, res) => {
    try {
        const application = await Application.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        
        if (!application) {
            req.flash('error_msg', 'Application not found or unauthorized');
        } else {
            req.flash('success_msg', 'Application deleted');
        }
        res.redirect('/applications');
    } catch (err) {
        console.error('Delete error:', err);
        req.flash('error_msg', 'Error deleting application');
        res.redirect('/applications');
    }
});

// Export CSV
router.get('/export', ensureAuth, async (req, res) => {
    try {
        const applications = await Application.find({ userId: req.session.userId }).lean();
        if (applications.length === 0) {
            req.flash('error_msg', 'No applications to export');
            return res.redirect('/applications');
        }

        const fields = [
            'companyName', 'role', 'dateOfApplication', 'status', 'category', 
            'stipend', 'location', 'duration', 'linkToJob', 'notes',
            'resumeLink', 'resumeVersion', 'referred', 'referralName'
        ];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(applications);

        res.header('Content-Type', 'text/csv');
        res.attachment('applications.csv');
        return res.send(csv);
    } catch (err) {
        console.error(err);
        res.redirect('/applications');
    }
});



// Show Edit Form
router.get('/edit/:id', ensureAuth, async (req, res) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!application) return res.redirect('/applications');
        res.render('applications/edit', { application, activePage: 'applications' });
    } catch (err) {
        console.error(err);
        res.redirect('/applications');
    }
});

// Process Edit Form
router.post('/edit/:id', ensureAuth, async (req, res) => {
    try {
        const { referred } = req.body;
        const updateData = {
            ...req.body,
            referred: referred === 'on'
        };
        const application = await Application.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId }, 
            updateData,
            { new: true }
        );
        
        if (!application) {
            req.flash('error_msg', 'Application not found or unauthorized');
            return res.redirect('/applications');
        }

        req.flash('success_msg', 'Application updated successfully');
        res.redirect('/applications');
    } catch (err) {
        console.error('Edit error:', err);
        req.flash('error_msg', 'Error updating application');
        res.redirect(`/applications/edit/${req.params.id}`);
    }
});

// Show Single Application Details (Moved here to avoid conflict with /edit and /export)
router.get('/:id', ensureAuth, async (req, res) => {
    try {
        const application = await Application.findOne({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });

        if (!application) {
            req.flash('error_msg', 'Application not found');
            return res.redirect('/applications');
        }

        res.render('applications/show', { 
            application, 
            activePage: 'applications' 
        });
    } catch (err) {
        console.error(err);
        res.redirect('/applications');
    }
});



module.exports = router;
