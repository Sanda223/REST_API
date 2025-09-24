Assignment 1 - REST API Project - Response to Criteria
================================================

Overview
------------------------------------------------

- **Name:** Sandaru Nakandage
- **Student number:** n11594128
- **Application name:** Image Processing API
- **Two line description:** This REST API allows authenticated users to submit image processing jobs (resize, blur, sharpen). Images are stored as unstructured files, while job metadata is stored in structured JSON.

Core criteria
------------------------------------------------

### Containerise the app

- **ECR Repository name:** n11594128-imgproc-api
- **Video timestamp:** 00:03 - 00:10
- **Relevant files:**
  - /Dockerfile
  - /.dockerignore

### Deploy the container

- **EC2 instance ID:** Shown in video by running the container on EC2 with docker compose  
- **Video timestamp:** 00:33 - 01:01

### User login

- **One line description:** Hard-coded users with JWT-based authentication; tokens are required for accessing API endpoints.
- **Video timestamp:** 01:11 - 01:23
- **Relevant files:**
  - /src/routes/auth.routes.ts
  - /src/middleware/auth.ts

### REST API

- **One line description:** REST API with GET/POST endpoints for login, job creation, job listing, and image retrieval, with appropriate status codes.
- **Video timestamp:** 01:23 - 02:23
- **Relevant files:**
  - /src/routes/jobs.routes.ts
  - /src/routes/images.routes.ts
  - /src/routes/auth.routes.ts

### Data types

- **One line description:** The app uses unstructured files (images) and structured metadata (jobs.json).
- **Video timestamp:** 02:24 - 03:05
- **Relevant files:**
  - /srv/imgproc/storage/originals/
  - /srv/imgproc/storage/outputs/
  - /srv/imgproc/storage/data/jobs.json

#### First kind

- **One line description:** Original and processed image files.
- **Type:** Unstructured
- **Rationale:** Binary images are best stored as files; they serve as direct inputs/outputs for CPU processing.
- **Video timestamp:** 02:58 - 03:05 & 02:13 - 02:18
- **Relevant files:**
  - /srv/imgproc/storage/originals/
  - /srv/imgproc/storage/outputs/

#### Second kind

- **One line description:** Job metadata (id, userId, operations, status, timestamps, outputPath).
- **Type:** Structured (no ACID requirements)
- **Rationale:** Needed to track and query processing jobs per user, with pagination and status fields.
- **Video timestamp:** 02:24 - 02:57
- **Relevant files:**
  - /src/data/jobs.store.ts
  - /srv/imgproc/storage/data/jobs.json

### CPU intensive task

- **One line description:** Sharp image pipeline performing chained 8K resize, blur, and sharpen operations.
- **Video timestamp:** 01:33 - 02:08
- **Relevant files:**
  - /src/services/process.ts

### CPU load testing

- **One line description:** Bash script pasted directly into the EC2 terminal launches 160+ concurrent 8K image jobs to sustain >80% CPU load for ~5 minutes.  
- **Video timestamp:** 03:36 - 04:02 & 04:04 - 04:51
- **Relevant files:**
  - /scripts/load_test.ts
  - (script pasted in terminal, not stored in repo) 

Additional criteria
------------------------------------------------

### Extensive REST API features

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**

### External API(s)

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**

### Additional types of data

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**

### Custom processing

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**

### Infrastructure as code

- **One line description:** Docker Compose used for container deployment with persistent storage volumes.
- **Video timestamp:** 00:39 - 01:01
- **Relevant files:**
  - /docker-compose.yml

### Web client

- **One line description:** Simple frontend (`index.html`, `main.js`) allows login, job submission, and fetching outputs from the API.
- **Video timestamp:** 03:05 - 03:27
- **Relevant files:**
  - /public/index.html
  - /public/main.js

### Upon request

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**