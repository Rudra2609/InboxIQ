# 📬 InboxIQ — Smart Gmail Organizer

A full-stack web application that connects to your Gmail, **clusters emails by sender**, and **auto-categorizes** them into Primary, Social, Promotions, and Updates.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Gmail API](https://img.shields.io/badge/Gmail-API-EA4335?logo=gmail&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

---

## Features

- **Google OAuth 2.0** — Secure read-only access to your Gmail
- **Sender Clustering** — All emails from the same sender grouped together
- **Auto-Categorization** — Primary, Social, Promotions, Updates (uses Gmail's native labels + smart fallback heuristics)
- **Premium Dark UI** — Glassmorphism, ambient lighting, smooth animations
- **Search** — Filter clusters and emails in real-time
- **Email Detail** — Click any email to read the full content
- **Responsive** — Works on desktop, tablet, and mobile

---

## Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Google Cloud Project** — See setup below

---

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a new project** (or select an existing one)
3. **Enable the Gmail API:**
   - Navigate to _APIs & Services > Library_
   - Search for "Gmail API" and click **Enable**
4. **Configure OAuth Consent Screen:**
   - Navigate to _APIs & Services > OAuth consent screen_
   - Select **External** user type
   - Fill in app name ("InboxIQ"), support email, and developer contact
   - Add scopes: `gmail.readonly`, `userinfo.email`, `userinfo.profile`
   - Add your email as a **Test User**
5. **Create OAuth Credentials:**
   - Navigate to _APIs & Services > Credentials_
   - Click **Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/auth/google/callback`
   - Copy the **Client ID** and **Client Secret**

---

## Installation

```bash
# Clone or navigate to the project
cd "Mail organizer"

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
SESSION_SECRET=any_random_string_here
PORT=3000
NODE_ENV=development
```

---

## Running the App

```bash
# Start both backend and frontend concurrently
npm run dev
```

This launches:
- **Backend** (Express) → `http://localhost:3000`
- **Frontend** (Vite) → `http://localhost:5173`

Open **http://localhost:5173** in your browser.

---

## How It Works

1. **Login** — Click "Sign in with Google" to authenticate via OAuth 2.0
2. **Fetch** — The app fetches your latest 100 emails via Gmail API
3. **Cluster** — Emails are grouped by sender (normalized email address)
4. **Categorize** — Each email is assigned a category:
   - Uses Gmail's built-in `CATEGORY_*` labels first
   - Falls back to domain-based heuristics for uncategorized emails
5. **Display** — Switch between Cluster view and Category view

---

## Project Structure

```
├── server/                    # Node.js + Express backend
│   ├── index.js               # Server entry point
│   ├── middleware/auth.js     # Authentication middleware
│   ├── routes/auth.js         # Google OAuth routes
│   ├── routes/emails.js       # Email API routes
│   ├── services/gmail.js      # Gmail API wrapper
│   ├── services/categorizer.js# Auto-categorization engine
│   └── services/cluster.js    # Sender clustering engine
├── client/                    # Vite frontend
│   ├── index.html             # HTML entry
│   ├── style.css              # Design system (CSS tokens)
│   ├── main.js                # App entry point
│   ├── components/            # UI components
│   └── utils/                 # API client & helpers
├── .env.example               # Environment template
├── package.json               # Dependencies & scripts
└── vite.config.js             # Vite config with proxy
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| "Authentication failed" | Check your Client ID, Secret, and Redirect URI in `.env` |
| "Not authenticated" after login | Make sure the redirect URI in Google Console exactly matches `.env` |
| "Access denied" on Gmail API | Ensure Gmail API is enabled and your email is added as a Test User |
| Empty inbox | The app fetches the latest 100 emails. Try sending yourself a test email |

---

## Security

- **Read-only access** — The app only requests `gmail.readonly` scope
- **No data storage** — Emails are fetched on-demand, never stored on the server
- **Session-based auth** — OAuth tokens are stored in server-side sessions only
- **No third-party tracking** — Zero analytics or external scripts
