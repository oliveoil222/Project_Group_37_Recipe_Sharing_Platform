// check user authentication status
export function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }

    // redirect user if not logged in
    return res.redirect('//users/login');
}