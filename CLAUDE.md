# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project

`@hillwoodpark/gcp-logger` — a lightweight Node.js logger that formats stdout/stderr messages compatibly with the Google Cloud Logging Agent / Ops Agent. Includes `redactHeaders` and `abbreviateStrings` helpers. Used across the Hillwood Park stack in App Engine / Cloud Run environments. Intentionally reserves CRITICAL / ALERT / EMERGENCY levels for the runtime and lower layers.

## Essential Commands

- `npm test` — Run the Vitest test suite.
- `npm run build` — Compile TypeScript to `dist/`.

## Specialist Agents

For work matching these areas, invoke the named agent via the Agent tool:

- **ddd-expert** — Domain modeling and ubiquitous-language guidance. The log-severity vocabulary (DEBUG / INFO / NOTICE / WARNING / ERROR; the deliberately omitted CRITICAL / ALERT / EMERGENCY) is a small **published language** consumed across the stack. Relevant when adding new severity levels, helpers, or convenience functions — naming and contract choices propagate to every consumer.
- **owasp-security-expert** — AppSec review. Logging sits at OWASP A09 (Security Logging and Monitoring Failures) and is also where sensitive-data leakage happens (PII, secrets, tokens in error payloads). Invoke for changes to `redactHeaders`, `abbreviateStrings`, error-message serialization, or anything that could affect what ends up in production logs.
