# CloudNest Frontend

A responsive React 19 interface for the CloudNest file storage platform.

## Features

- Sign-up and sign-in flows
- File and folder browsing
- Search
- Chunked uploads
- Downloads and deletion
- File sharing
- Shared-with-me library
- Responsive desktop-style storage interface

## Technology

- React 19
- Vite 8
- JavaScript ES modules
- Fetch API
- Nginx production server

## Run locally

```bash
npm install
npm run dev
```

Set `VITE_API_BASE` in `.env` when the API is not available through `/api`.

## Validate

```bash
npm run lint
npm run build
```
