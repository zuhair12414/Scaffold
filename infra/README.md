# infra

Infrastructure configuration. Contains:
- `docker-compose.yml` — local development stack (api, runner, postgres, redis)
- `.env.example` — required environment variables (copy to `.env` and fill in)

Start the local stack: `docker compose -f infra/docker-compose.yml up`.
