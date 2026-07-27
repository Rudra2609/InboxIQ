/**
 * Cluster emails by normalized sender email
 * @param {Array} emails
 * @returns {Array} Array of clusters sorted by date
 */
const clusterBySender = (emails) => {
    const clusterMap = new Map();

    emails.forEach(email => {
        if (!email.from || !email.from.email) return;
        
        const senderEmail = email.from.email.toLowerCase().trim();
        
        if (!clusterMap.has(senderEmail)) {
            clusterMap.set(senderEmail, {
                sender: { name: email.from.name, email: senderEmail },
                emails: [],
                emailCount: 0,
                latestDate: email.date,
                oldestDate: email.date,
                categories: {},
                unreadCount: 0
            });
        }
        
        const cluster = clusterMap.get(senderEmail);
        cluster.emails.push(email);
        cluster.emailCount++;
        
        const emailDate = new Date(email.date);
        const latestDate = new Date(cluster.latestDate);
        const oldestDate = new Date(cluster.oldestDate);
        
        if (emailDate > latestDate) cluster.latestDate = email.date;
        if (emailDate < oldestDate) cluster.oldestDate = email.date;
        
        if (email.labelIds && email.labelIds.includes('UNREAD')) {
            cluster.unreadCount++;
        }
        
        const cat = email.category || 'primary';
        cluster.categories[cat] = (cluster.categories[cat] || 0) + 1;
    });

    const clusters = Array.from(clusterMap.values()).map(cluster => {
        // Find most frequent category
        let maxCount = 0;
        let mainCategory = 'primary';
        for (const [cat, count] of Object.entries(cluster.categories)) {
            if (count > maxCount) {
                maxCount = count;
                mainCategory = cat;
            }
        }
        
        // Sort emails within cluster
        cluster.emails.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return {
            sender: cluster.sender,
            emails: cluster.emails,
            emailCount: cluster.emailCount,
            latestDate: cluster.latestDate,
            oldestDate: cluster.oldestDate,
            category: mainCategory,
            unreadCount: cluster.unreadCount
        };
    });

    // Sort clusters by latestDate descending
    clusters.sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate));

    return clusters;
};

module.exports = { clusterBySender };
