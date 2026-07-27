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
    // Clear cookie-session before switching
    req.session = null;
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'select_account consent',
        scope: ['https://www.googleapis.com/auth/gmail.readonly', 'profile', 'email']
    });
    res.redirect(url);
});

/**
 * Handle Google OAuth callback
 */
router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
            token_type: tokens.token_type
        };
        const redirectUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production'
          ? '/'
          : 'http://localhost:5173');
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error in auth callback:', error);
        const errorMsg = error?.response?.data?.error_description || error?.response?.data?.error || error?.message || 'Unknown OAuth error';
        res.status(500).send(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 600px; margin: 40px auto; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
                <h2 style="color: #ef4444; margin-top: 0;">Authentication failed</h2>
                <p style="font-size: 16px;"><strong>Google reported:</strong> <code style="background: #1e293b; padding: 4px 8px; border-radius: 4px; color: #f87171;">${errorMsg}</code></p>
                <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;">
                <p><strong>Most likely causes when testing a new Client ID:</strong></p>
                <ul style="line-height: 1.6; color: #94a3b8;">
                    <li><strong>Server not restarted:</strong> Did you restart your backend terminal (<code>Ctrl + C</code> and start again) after modifying your <code>.env</code> file? Node.js only reads <code>.env</code> when the server boots.</li>
                    <li><strong>Redirect URI mismatch:</strong> Check that <code>http://localhost:3000/auth/google/callback</code> is added under <em>Authorized redirect URIs</em> in Google Cloud Console.</li>
                    <li><strong>Secret mismatch:</strong> Check that both <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in <code>.env</code> match your new OAuth client.</li>
                </ul>
                <a href="http://localhost:5173" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Back to App</a>
            </div>
        `);
    }
});

/**
 * Logout user by destroying session
 */
router.get('/logout', (req, res) => {
    req.session = null;
    res.json({ success: true });
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
