# Frontend

Cyberpunk 2077 inspired Next.js frontend for the local FastAPI + llama.cpp backend in this repository.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Point the frontend at the FastAPI backend:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

The frontend proxies chat requests through `/api/chat` to avoid browser-side CORS issues.
