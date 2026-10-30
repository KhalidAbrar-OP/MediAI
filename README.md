# MediAI

MediAI is an AI-centric healthcare management platform built on the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Project Structure

```
├── frontend/          # React + Vite client
└── backend/           # Express + Node.js server
```

## Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

Configure your environment variables in `backend/.env`:
- `PORT`
- `DB_USER`
- `DB_PASS`
- `ACCESS_TOKEN_SECRET`
- `GEMINI_API_KEY`
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on [http://localhost:5173](http://localhost:5173).
The backend will run on [http://localhost:5000](http://localhost:5000).
