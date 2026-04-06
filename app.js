const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Body Parser Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Express Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Connect Flash Middleware
app.use(flash());

// Global Variables for Flash Messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.userId = req.session.userId || null;
    res.locals.userName = req.session.userName || null;
    next();
});

const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout extractStyles', true);
app.set('layout extractScripts', true);
app.set('layout', 'layouts/base');
app.set('views', path.join(__dirname, 'views'));

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.render('landing');
    }
});

app.use('/auth', require('./routes/auth'));
app.use('/applications', require('./routes/applications'));

// Dashboard route (shortcut)
const { ensureAuth } = require('./middleware/auth');
const Application = require('./models/Application');

app.get('/dashboard', ensureAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const total = await Application.countDocuments({ userId });
        const interviews = await Application.countDocuments({ userId, status: 'Interview' });
        const offers = await Application.countDocuments({ userId, status: 'Offer' });
        const rejected = await Application.countDocuments({ userId, status: 'Rejected' });
        const onCampus = await Application.countDocuments({ userId, category: 'On Campus' });
        const offCampus = await Application.countDocuments({ userId, category: 'Off Campus' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayReminders = await Application.find({
            userId,
            reminderDate: { $gte: today, $lt: tomorrow }
        }).limit(5);

        const overdueReminders = await Application.find({
            userId,
            reminderDate: { $lt: today }
        }).limit(5);

        const recentApps = await Application.find({ userId })
            .sort({ dateOfApplication: -1, createdAt: -1 })
            .limit(5);

        res.render('dashboard', {
            stats: { total, interviews, offers, rejected, onCampus, offCampus },
            todayReminders,
            overdueReminders,
            recentApps,
            activePage: 'dashboard'
        });
    } catch (err) {
        console.error(err);
        res.redirect('/auth/login');
    }
});

// Handle 404
app.use((req, res) => {
    res.status(404).render('404');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
