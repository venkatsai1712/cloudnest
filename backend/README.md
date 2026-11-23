# CloudNest Backend

The backend is a Java 21 REST API built with Spring Boot 4. It manages authentication, users, folders, file metadata, sharing, and MinIO object storage.

## Responsibilities

- Spring Security authentication and route protection
- BCrypt password hashing
- PostgreSQL persistence through Spring Data JPA
- Chunked and presigned file uploads
- Presigned downloads
- File and folder authorization
- File sharing and expiration
- Health and metrics exposure through Actuator

## Technology

- Java 21
- Spring Boot 4.0.6
- Spring Security
- Spring Data JPA
- PostgreSQL
- MinIO
- JUnit 5
- Mockito
- Maven

## Run

```bash
./mvnw spring-boot:run
```

The API runs on `http://localhost:8080`.

## Test

```bash
./mvnw test
```

## Docker

The recommended full-stack setup is defined in the repository's [Docker Compose configuration](../docker-compose.yml).
