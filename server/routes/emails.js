const express = require('express');
const { google } = require('googleapis');
const { requireAuth } = require('../middleware/auth');
const { fetchEmails, fetchEmailById } = require('../services/gmail');
const { groupByCategory } = require('../services/categorizer');
const { clusterBySender } = require('../services/cluster');
const router = express.Router();

/**
 * Middleware to setup auth client
 */
router.use(requireAuth, (req, res, next) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(req.session.tokens);
    req.authClient = oauth2Client;
    next();
});

/**
 * GET /api/emails - fetch emails
 */
router.get('/emails', async (req, res) => {
    try {
        const { maxResults, pageToken, category, q } = req.query;
        let query = q || '';
        if (category) {
            query += ` category:${category}`;
        }
        const result = await fetchEmails(req.authClient, {
            maxResults: parseInt(maxResults, 10) || 50,
            pageToken,
            q: query
        });
        res.json(result);
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

/**
 * GET /api/emails/clusters - fetch emails clustered by sender
 */
router.get('/emails/clusters', async (req, res) => {
    try {
        const { maxResults, pageToken, q } = req.query;
        const result = await fetchEmails(req.authClient, {
            maxResults: parseInt(maxResults, 10) || 100,
            pageToken,
            q
        });
        const clusters = clusterBySender(result.emails);
        res.json({ clusters, nextPageToken: result.nextPageToken });
    } catch (error) {
        console.error('Error fetching clusters:', error);
        res.status(500).json({ error: 'Failed to fetch clusters' });
    }
});

/**
 * GET /api/emails/categories - fetch emails grouped by category
 */
router.get('/emails/categories', async (req, res) => {
    try {
        const { maxResults, pageToken, q } = req.query;
        const result = await fetchEmails(req.authClient, {
            maxResults: parseInt(maxResults, 10) || 100,
            pageToken,
            q
        });
        const categories = groupByCategory(result.emails);
        res.json({ categories, nextPageToken: result.nextPageToken });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

/**
 * GET /api/emails/:id - fetch single email
 */
router.get('/emails/:id', async (req, res) => {
    try {
        const email = await fetchEmailById(req.authClient, req.params.id);
        res.json(email);
    } catch (error) {
        console.error('Error fetching email:', error);
        res.status(500).json({ error: 'Failed to fetch email' });
    }
});

/**
 * GET /api/stats - return stats
 */
router.get('/stats', async (req, res) => {
    try {
        const result = await fetchEmails(req.authClient, { maxResults: 100 });
        const categories = groupByCategory(result.emails);
        
        let unread = 0;
        result.emails.forEach(email => {
            if (email.labelIds && email.labelIds.includes('UNREAD')) unread++;
        });

        res.json({
            total: result.emails.length,
            unread,
            byCategory: {
                primary: categories.primary ? categories.primary.length : 0,
                social: categories.social ? categories.social.length : 0,
                promotions: categories.promotions ? categories.promotions.length : 0,
                updates: categories.updates ? categories.updates.length : 0
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
