# policy-service

Quarkus microservice that exposes the insurance policy catalog (TRAVEL & HEALTH types, categories and health add-ons).

Part of the GCUL / Reboot 2026 insurance platform.

## Features

- Clean layered architecture (controller → service → repository → entity)
- H2 in-memory database with automatic schema creation and seed data
- REST API (`GET /policies`, `GET /policies/{type}`)
- OpenAPI / Swagger UI
- Liveness & readiness health checks
- JUnit 5 + RestAssured tests
- Multi-stage Dockerfile ready for Google Cloud Run

## Prerequisites

- Java 21+
- Maven 3.9+ (or use the Maven Wrapper once generated)
- Docker (for container builds)

## Project layout

```
src/main/java/com/gcul/policy/
├── controller/     # REST resources
├── service/        # Business logic
├── repository/     # Panache repositories
├── entity/         # JPA entities
├── dto/            # API records (never expose entities)
├── mapper/         # Entity ↔ DTO mapping
├── exception/      # Domain exceptions + JAX-RS ExceptionMapper
└── config/         # (reserved)
src/main/resources/
├── application.properties
└── import.sql      # Seed data
```

## Build

```bash
cd policy-service
mvn clean package
```

## Run locally

```bash
# Dev mode (live reload)
mvn quarkus:dev

# Or run the packaged jar
java -jar target/quarkus-app/quarkus-run.jar
```

Service starts on **http://localhost:8082**

### Useful local URLs

| Resource              | URL                                      |
|-----------------------|------------------------------------------|
| All policies          | http://localhost:8082/policies           |
| Travel only           | http://localhost:8082/policies/TRAVEL    |
| Health only           | http://localhost:8082/policies/HEALTH    |
| Swagger UI            | http://localhost:8082/swagger-ui         |
| OpenAPI JSON          | http://localhost:8082/openapi            |
| Health (aggregate)    | http://localhost:8082/health             |
| Liveness              | http://localhost:8082/health/live        |
| Readiness             | http://localhost:8082/health/ready       |
| H2 Console            | http://localhost:8082/h2-console         |
| JDBC URL for console  | `jdbc:h2:mem:policydb` (user: `sa`, password empty) |

## Run tests

```bash
mvn test
```

## Docker

### Build image

```bash
docker build -t policy-service:1.0.0 .
```

### Run container

```bash
docker run --rm -p 8082:8082 \
  -e PORT=8082 \
  policy-service:1.0.0
```

## Deploy to Google Cloud Run

### 1. Prerequisites

- `gcloud` CLI authenticated
- Artifact Registry repository created (e.g. `gcul-repo` in region `asia-south1`)
- Project ID set: `gcloud config set project YOUR_PROJECT_ID`

### 2. Build & push image

```bash
# Set variables
export PROJECT_ID=$(gcloud config get-value project)
export REGION=asia-south1
export REPO=gcul-repo
export IMAGE=policy-service
export TAG=1.0.0

# Create Artifact Registry repo (once)
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION \
  --description="GCUL microservices"

# Configure Docker auth
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE}:${TAG} .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE}:${TAG}
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy policy-service \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE}:${TAG} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8082 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "QUARKUS_PROFILE=prod"
```

Cloud Run automatically injects the `PORT` environment variable; the service listens on it.

### 4. Verify

```bash
SERVICE_URL=$(gcloud run services describe policy-service --region $REGION --format='value(status.url)')
curl -s ${SERVICE_URL}/policies | jq .
curl -s ${SERVICE_URL}/health/ready
```

## API contract

### `GET /policies`

```json
[
  {
    "type": "TRAVEL",
    "categories": [
      { "id": 1, "name": "Trip Protection" },
      { "id": 2, "name": "Trip Cancellation" }
    ]
  },
  {
    "type": "HEALTH",
    "categories": [
      {
        "id": 3,
        "name": "Individual",
        "addons": ["Dental Cover", "Vision Cover", "Critical Illness", "Maternity", "Personal Accident"]
      },
      {
        "id": 4,
        "name": "Family",
        "addons": ["Dental Cover", "Vision Cover", "Critical Illness", "Maternity", "Personal Accident"]
      },
      {
        "id": 5,
        "name": "Senior Citizen",
        "addons": ["Dental Cover", "Vision Cover", "Critical Illness", "Maternity", "Personal Accident"]
      }
    ]
  }
]
```

### `GET /policies/{type}`

Same shape as a single element of the array above. Returns **404** when the type is unknown.

## Notes for the larger platform

This service intentionally implements **only** the policy catalog.

Future work (out of scope for this service):

- Policy issuance / quote generation
- Manual & parametric claims
- Blockchain (GCUL) integration for audit / settlement

Those capabilities live in the other microservices of the monorepo (`claims-service`, `blockchain-orchestrator-service`, etc.).
