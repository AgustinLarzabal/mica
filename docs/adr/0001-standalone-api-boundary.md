# ADR 0001: Keep the public API separate from client runtimes

- Status: Accepted
- Date: 2026-09-15

## Context

Mica's web application needs a stable HTTP boundary that can also serve future
mobile clients. Tying that boundary to the web runtime would couple API
availability and deployment to one client. Giving browser or mobile code direct
database access would expose credentials and bypass server-side application
rules.

## Decision

Run the public API as a separately runnable and deployable Node application in
the monorepo. Define its HTTP contracts independently from client code and
persistence schemas.

Database credentials and database packages are restricted to trusted server
processes. Browser and mobile clients communicate with persistence only through
the public API.

## Consequences

The API and web application can evolve and deploy independently, and future
clients can consume the same language-independent contract. Operations must run
and observe another service. Shared persistence code may be introduced for
trusted server work, but it must not become a client dependency.
