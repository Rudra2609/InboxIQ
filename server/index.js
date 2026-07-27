require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
}));

app.use('/auth', authRoutes);
app.use('/api', emailRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
