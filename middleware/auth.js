module.exports = {
    ensureAuth: function (req, res, next) {
        if (req.session.userId) {
            return next();
        } else {
            req.flash('error_msg', 'Please log in to view that resource');
            res.redirect('/auth/login');
        }
    },
    ensureGuest: function (req, res, next) {
        if (req.session.userId) {
            res.redirect('/dashboard');
        } else {
            return next();
        }
    }
};
