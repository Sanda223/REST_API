# A2 starting point limitations
- Only 2 hardcoded users (alice/bob).
- Authentication is custom JWT, not Cognito.
- No user uploads: API only processes a hardcoded `seed.png`.
- Jobs metadata stored in local JSON file (`jobs.json`).
- Images stored on local disk (`storage/originals` + `storage/outputs`).


# A2 Scope Decisions
- Persistence: S3 (images), DynamoDB (jobs)
- Auth: AWS Cognito (User Pool + MFA + Groups)
- Statelessness: All data in S3/DynamoDB
- DNS: Route53 CNAME a2-sandaru.cab432.com
- Additional: S3 pre-signed URLs, ElastiCache memcached, Parameter Store, Secrets Manager, Terraform IaC