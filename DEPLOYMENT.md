# Production deployment

## Required external setup

1. Provision PostgreSQL and set `DATABASE_URL`.
2. In ZeptoMail, verify the sending domain, create an Agent, copy its Send Mail Token, and set `ZEPTOMAIL_TOKEN` and `ZEPTOMAIL_FROM_EMAIL`.
3. Create a Google OAuth web client and set `GOOGLE_CLIENT_ID`.
4. Set `JWT_SECRET` to a unique secret of at least 32 characters. Never reuse the local value.
5. Set `CORS_ORIGINS` to comma-separated production frontend origins.

## Release commands

```sh
npm ci
npm run build
npm run migrate
npm start
```

Run migrations as a release/pre-deploy job before starting new application instances. Do not run `migrate:down` against production without a verified backup.

The container listens on `PORT` (default `8000`). Configure `/health/live` as the liveness check and `/health/ready` as the readiness check.

## ZeptoMail

The sender address must use a domain verified in the selected ZeptoMail Agent. The application uses the official `POST /v1.1/email` API and does not require SMTP credentials. Complete SPF and DKIM records in DNS before production traffic.

## Operations

- Enable automated PostgreSQL backups and test restoration.
- Send JSON stdout/stderr logs to the hosting platform's log collector.
- Alert on readiness failures, HTTP 5xx rates, latency, and ZeptoMail failures.
- Rotate the ZeptoMail token, database credentials, and JWT secret through the platform secret manager.
