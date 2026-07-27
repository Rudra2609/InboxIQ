require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render/Vercel HTTPS headers
app.set('trust proxy', 1);

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

const isProductionCloud = process.env.RENDER === 'true' || process.env.VERCEL === '1' || (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL?.includes('localhost'));

app.use(cookieSession({
    name: 'inboxiq_session',
    secret: process.env.SESSION_SECRET || 'fallback_secret_inboxiq_2026',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: isProductionCloud,
    sameSite: isProductionCloud ? 'none' : 'lax'
}));

app.use('/auth', authRoutes);
app.use('/api', emailRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
