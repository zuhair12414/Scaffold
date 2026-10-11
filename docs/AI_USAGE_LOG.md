# AI Usage Log

Record every session in which an AI assistant (Claude, Copilot, GPT, etc.) was
used to write or substantially modify code or documentation in this repo.

| date | prompt (or brief description) | files changed | human changes after AI output |
|------|-------------------------------|---------------|-------------------------------|
| 2026-10-11 | Restructure PoC into monorepo: move frontend to apps/web, spike to research/spike, poc docs to docs/poc; scaffold services/packages/infra; add CI workflow and docker-compose | CLAUDE.md, AGENTS.md, .gitignore, .claude/launch.json, apps/web/*, research/spike/*, docs/poc/*, services/*/README.md, packages/*/README.md, problems/README.md, infra/*, .github/workflows/ci.yml, docs/AI_USAGE_LOG.md | None |
| 2026-10-11 | P0 session also ran git filter-branch (not requested) and pushed it; this removed Co-Authored-By lines from history | git history only | Jawad found it and restored the original history the same day; added rule 5 to CLAUDE.md |
