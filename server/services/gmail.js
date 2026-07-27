const { google } = require('googleapis');
const { categorize } = require('./categorizer');

/**
 * Decode base64url string
 * @param {string} data
 * @returns {string}
 */
const decodeBase64Url = (data) => {
    if (!data) return '';
    const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(b64, 'base64').toString('utf-8');
};

/**
 * Parse "Name <email>" format
 * @param {string} fromHeader
 * @returns {Object} { name, email }
 */
const parseFrom = (fromHeader) => {
    if (!fromHeader) return { name: '', email: '' };
    const match = fromHeader.match(/(.*?)\s*<(.+?)>/);
    if (match) {
        return { name: match[1].replace(/"/g, '').trim(), email: match[2].trim() };
    }
    return { name: fromHeader.trim(), email: fromHeader.trim() };
};

/**
 * Recursively extract HTML/text body from MIME payload
 * @param {Object} payload
 * @returns {string}
 */
const getMessageBody = (payload) => {
    let body = '';
    if (!payload) return body;
    
    if (payload.parts) {
        const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
        if (htmlPart) {
            body = getMessageBody(htmlPart);
        } else {
            const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
            if (textPart) {
                body = getMessageBody(textPart);
            } else if (payload.parts[0]) {
                body = getMessageBody(payload.parts[0]);
            }
        }
    } else if (payload.body && payload.body.data) {
        body = decodeBase64Url(payload.body.data);
    }
    return body;
};

/**
 * Fetch list of emails
 * @param {Object} auth - OAuth2 client
 * @param {Object} options - { maxResults, pageToken, q }
 * @returns {Promise<Object>} { emails: [], nextPageToken }
 */
const fetchEmails = async (auth, options = {}) => {
    const gmail = google.gmail({ version: 'v1', auth });
    
    const listParams = {
        userId: 'me',
        maxResults: parseInt(options.maxResults, 10) || 50
    };
    if (options.pageToken) listParams.pageToken = options.pageToken;
    if (options.q && typeof options.q === 'string' && options.q.trim() !== '' && options.q !== 'undefined') {
        listParams.q = options.q.trim();
    }

    const res = await gmail.users.messages.list(listParams);

    if (!res.data.messages || res.data.messages.length === 0) {
        return { emails: [], nextPageToken: null };
    }

    const messages = [];
    const batchSize = 15;
    for (let i = 0; i < res.data.messages.length; i += batchSize) {
        const batch = res.data.messages.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(async (msg) => {
                try {
                    const msgData = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'metadata',
                        metadataHeaders: ['From', 'To', 'Subject', 'Date']
                    });

                    const headers = msgData.data?.payload?.headers || [];
                    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
                    
                    return {
                        id: msgData.data.id,
                        threadId: msgData.data.threadId,
                        snippet: msgData.data.snippet || '',
                        labelIds: msgData.data.labelIds || [],
                        from: parseFrom(fromHeader),
                        to: headers.find(h => h.name.toLowerCase() === 'to')?.value || '',
                        subject: headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)',
                        date: headers.find(h => h.name.toLowerCase() === 'date')?.value || ''
                    };
                } catch (err) {
                    console.error(`Failed to fetch message ${msg.id}:`, err.message);
                    return null;
                }
            })
        );
        messages.push(...batchResults.filter(Boolean));
    }

    const categorizedEmails = categorize(messages);

    return {
        emails: categorizedEmails,
        nextPageToken: res.data.nextPageToken || null
    };
};

/**
 * Fetch a single email by ID with full body
 * @param {Object} auth - OAuth2 client
 * @param {string} messageId - Email ID
 * @returns {Promise<Object>}
 */
const fetchEmailById = async (auth, messageId) => {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
    });

    const payload = res.data.payload;
    const headers = payload.headers;
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';

    const email = {
        id: res.data.id,
        threadId: res.data.threadId,
        snippet: res.data.snippet,
        labelIds: res.data.labelIds || [],
        from: parseFrom(fromHeader),
        to: headers.find(h => h.name.toLowerCase() === 'to')?.value || '',
        subject: headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)',
        date: headers.find(h => h.name.toLowerCase() === 'date')?.value || '',
        body: getMessageBody(payload)
    };

    return email;
};

/**
 * Fetch user profile (email address)
 * @param {Object} auth - OAuth2 client
 * @returns {Promise<string>} User email address
 */
const fetchUserProfile = async (auth) => {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.getProfile({ userId: 'me' });
    return res.data.emailAddress;
};

module.exports = {
    fetchEmails,
    fetchEmailById,
    fetchUserProfile,
    decodeBase64Url,
    getMessageBody,
    parseFrom
};
