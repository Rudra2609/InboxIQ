const SOCIAL_DOMAINS = ['facebook', 'twitter', 'linkedin', 'instagram', 'discord', 'slack', 'reddit', 'meetup', 'tiktok'];
const PROMO_PATTERNS = ['marketing@', 'promo@', 'newsletter@', 'noreply@'];
const UPDATE_PATTERNS = ['notifications@', 'alerts@', 'no-reply@', 'updates@', 'info@'];
const PROMO_KEYWORDS = ['offer', 'sale', 'discount', 'deal', '% off', 'free'];

/**
 * Assigns category to an array of emails
 * @param {Array} emails
 * @returns {Array} Emails with assigned category property
 */
const categorize = (emails) => {
    return emails.map(email => {
        let category = 'primary';
        
        const labels = email.labelIds || [];
        if (labels.includes('CATEGORY_SOCIAL')) category = 'social';
        else if (labels.includes('CATEGORY_PROMOTIONS')) category = 'promotions';
        else if (labels.includes('CATEGORY_UPDATES')) category = 'updates';
        else if (labels.includes('CATEGORY_FORUMS')) category = 'forums';
        else if (labels.includes('CATEGORY_PERSONAL')) category = 'primary';
        else {
            // Fallback strategy
            const senderEmail = email.from && email.from.email ? email.from.email.toLowerCase() : '';
            const subject = email.subject ? email.subject.toLowerCase() : '';
            
            const isSocial = SOCIAL_DOMAINS.some(domain => senderEmail.includes(domain));
            if (isSocial) {
                category = 'social';
            } else {
                const isPromoSender = PROMO_PATTERNS.some(p => senderEmail.startsWith(p));
                const hasPromoKeyword = PROMO_KEYWORDS.some(k => subject.includes(k));
                
                if (isPromoSender || (senderEmail.startsWith('noreply@') && hasPromoKeyword)) {
                    category = 'promotions';
                } else {
                    const isUpdate = UPDATE_PATTERNS.some(p => senderEmail.startsWith(p));
                    if (isUpdate) {
                        category = 'updates';
                    }
                }
            }
        }
        
        return { ...email, category };
    });
};

/**
 * Group emails by category
 * @param {Array} emails
 * @returns {Object} { primary: [], social: [], promotions: [], updates: [] }
 */
const groupByCategory = (emails) => {
    const categorized = categorize(emails);
    const groups = { primary: [], social: [], promotions: [], updates: [], forums: [] };
    
    categorized.forEach(email => {
        if (!groups[email.category]) {
            groups[email.category] = [];
        }
        groups[email.category].push(email);
    });
    
    return groups;
};

module.exports = { categorize, groupByCategory };
