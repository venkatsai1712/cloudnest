# CloudNest

**A secure, full-stack cloud file storage and sharing platform**

CloudNest is a cloud storage application that enables users to securely upload, organize, download, and share files through a modern web interface. It demonstrates a production-oriented, containerized architecture with a React frontend, a Spring Boot REST API, PostgreSQL metadata storage, and MinIO object storage.

---

## Highlights

- Secure account registration and session-based authentication
- Password encryption with BCrypt
- Nested folder creation and folder navigation
- Large file uploads using multipart/chunk upload support
- Presigned URLs for efficient uploads and downloads
- File sharing with recipient email addresses and expiration
- Shared-with-me file management
- Searchable file listings and responsive storage interface
- REST API health and observability endpoints
- Docker Compose deployment for the complete application stack

## Features

### File management

- Upload files to the user's storage
- Create and browse nested folders
- Download or delete stored files
- View file size and upload information
- Search files from the dashboard

### Sharing

- Share a file with another registered user
- Set a download permission
- Configure share expiration
- Browse and download files shared with the current user
- Revoke an existing share

### Security

- Spring Security authorization for protected API routes
- BCrypt password hashing
- Session-based authentication with credentialed CORS requests
- Resource ownership checks at the service layer
- Separation of application metadata and binary object storage

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8, JavaScript, CSS, Fetch API |
| Backend | Java 21, Spring Boot 4, Spring Security, Spring Data JPA |
| Database | PostgreSQL 17 |
| Object storage | MinIO, S3-style presigned URLs |
| API | REST, JSON |
| Testing | JUnit 5, Mockito, H2 |
| DevOps | Docker, Docker Compose, Multi-stage builds, Nginx |

## Architecture

```text
Browser
  |
  | HTTP
  v
React + Nginx
  |
  | /api REST requests
  v
Spring Boot API
  |                 |
  | JPA             | MinIO SDK
  v                 v
PostgreSQL         MinIO object storage
```

The frontend is served by Nginx and proxies `/api` requests to the backend. PostgreSQL stores users, folder structures, file metadata, and sharing relationships. MinIO stores file objects independently from the application database.

For deployments where the frontend and API use different sites, serve both over HTTPS, set `APP_CORS_ALLOWED_ORIGINS` to the frontend's exact origin (scheme and hostname, without a path), and keep the session cookie settings `SESSION_COOKIE_SAME_SITE=none` and `SESSION_COOKIE_SECURE=true`. These settings let the browser send the login session on credentialed API requests.

## Project Structure

```text
CloudNest/
├── backend/
│   ├── src/main/java/venkatsai/cloudnest/
│   │   ├── controller/       # REST endpoints
│   │   ├── dto/              # Request and response models
│   │   ├── entity/           # JPA domain entities
│   │   ├── mapper/           # Entity-to-DTO mapping
│   │   ├── repository/       # Database repositories
│   │   ├── security/         # Authentication and CORS configuration
│   │   ├── service/          # Business and sharing logic
│   │   └── storage/          # MinIO storage implementation
│   └── src/test/             # JUnit and Mockito tests
├── frontend/
│   ├── public/               # Public static assets
│   └── src/
│       ├── api/              # REST client
│       ├── assets/           # Images and media
│       ├── App.jsx           # Main application interface
│       └── index.css         # Application styles
└── docker-compose.yml
```

## API Overview

| Area | Example endpoints |
|---|---|
| Authentication | `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/logout` |
| Files | `GET /api/files`, `POST /api/file/upload`, `GET /api/file/download/{id}`, `DELETE /api/file/{id}` |
| Chunk uploads | `POST /api/file/upload/chunks-initiate`, `POST /api/file/upload/chunks-url`, `POST /api/file/upload/chunks-complete` |
| Presigned URLs | `POST /api/file/upload-url`, `GET /api/file/download-url/{id}` |
| Folders | `POST /api/folder`, `GET /api/folders`, `GET /api/folder/contents`, `DELETE /api/folder/{id}` |
| Sharing | `POST /api/share/file`, `GET /api/share/files`, `GET /api/share/file/download-url/{shareId}` |
| Health | `GET /actuator/health` |

## Run with Docker

From the repository root, create an environment file inside `backend/`:

```text
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
MINIO_USERNAME=minioadmin
MINIO_PASSWORD=change-me
MINIO_BUCKET=uploads
```

Docker Compose reads environment variables from the directory where it is launched. Run from `backend/`:

```bash
cd backend
docker compose up --build
```

Open:

- Application: http://localhost:3000
- Backend API: http://localhost:8080
- MinIO Console: http://localhost:9001

## Run Locally

### Prerequisites

- Java 21
- Node.js 22 or newer
- PostgreSQL
- MinIO

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Configure PostgreSQL and MinIO through `src/main/resources/application.properties` or the corresponding environment variables.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs on port `5173` by default. Set `VITE_API_BASE` to the backend API URL when needed.

## Testing

Run backend tests:

```bash
cd backend
./mvnw test
```

Run frontend lint and production build checks:

```bash
cd frontend
npm run lint
npm run build
```

## Engineering Decisions

- **PostgreSQL** stores reliable relational metadata for users, folders, files, and sharing.
- **MinIO** provides S3-compatible object storage and keeps binary data outside the relational database.
- **Presigned URLs** reduce application-server bandwidth for file upload and download operations.
- **Chunked uploads** support more reliable delivery of larger files.
- **Spring Security** centralizes route authorization and authentication behavior.
- **Docker Compose** provides an isolated, reproducible local environment for the full stack.

## Future Improvements

- Persistent authentication tokens or OAuth integration
- Fine-grained file permissions
- Automated end-to-end testing
- Object storage lifecycle policies
- Folder and file share audit history
- Drag-and-drop uploads and live upload progress
- Cloud deployment and CI/CD pipelines

## Author

**Illav Venkatsai**

- GitHub: [@venkatsai1712](https://github.com/venkatsai1712)
