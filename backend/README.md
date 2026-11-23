# CloudNest

A simple file storage project made with Java Spring Boot, PostgreSQL and MinIO.

## Run with Docker

Create a `.env` file and set PostgreSQL and MinIO passwords:

```text
POSTGRES_PASSWORD=change-me
MINIO_USERNAME=minioadmin
MINIO_PASSWORD=change-me
```

Then run:

```bash
docker compose up --build
```

Open `http://localhost:3000`.
