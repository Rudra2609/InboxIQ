const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

/**
 * Generate Google OAuth URL and redirect
 */
router.get('/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/gmail.readonly', 'profile', 'email']
    });
    res.redirect(url);
});

/**
 * Force Google account picker for switching accounts
 */
router.get('/google/switch', (req, res) => {
    // Destroy current session before switching
    req.session.destroy(() => {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'select_account consent',
            scope: ['https://www.googleapis.com/auth/gmail.readonly', 'profile', 'email']
        });
        res.redirect(url);
    });
});

/**
 * Handle Google OAuth callback
 */
router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens;
        // In development, redirect to the Vite dev server
        const redirectUrl = process.env.NODE_ENV === 'production'
          ? '/'
          : 'http://localhost:5173';
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error in auth callback:', error);
        res.status(500).send('Authentication failed');
    }
});

/**
 * Logout user by destroying session
 */
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true });
    });
});

/**
 * Check authentication status and return basic user info if logged in
 */
router.get('/status', async (req, res) => {
    if (!req.session || !req.session.tokens) {
        return res.json({ authenticated: false });
    }
    try {
        oauth2Client.setCredentials(req.session.tokens);
        const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
        const { data } = await oauth2.userinfo.get();
        res.json({
            authenticated: true,
            user: {
                email: data.email,
                name: data.name
            }
        });
    } catch (error) {
        res.json({ authenticated: false });
    }
});

/**
 * Get detailed user profile
 */
router.get('/user', async (req, res) => {
    if (!req.session || !req.session.tokens) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        oauth2Client.setCredentials(req.session.tokens);
        const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
        const { data } = await oauth2.userinfo.get();
        res.json(data);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

module.exports = router;
