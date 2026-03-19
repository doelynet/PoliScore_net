# Non-Functional Requirements (NFRs)

This document records the project's non-functional requirements and provides concise, actionable implementation notes and verification checkpoints.

## NFR1: Performance
- Requirements:
  - Pages shall load within 3 seconds under normal network conditions.
  - Support at least 500 concurrent users without degradation.
  - Database queries shall execute within 1 second for standard operations.
- Implementation notes:
  - Use server-side and client-side caching (Redis) for frequent reads.
  - Implement pagination and limit API payloads for list endpoints.
  - Optimize DB queries with indexes, avoid N+1 queries, and use query profiling.
  - Load-test endpoints (k6 or Artillery) to validate 500 concurrent users.
- Verification:
  - Create performance tests and CI gate: average response < 3s, p95 < 3s.

## NFR2: Scalability
- Requirements:
  - Architecture must allow horizontal scaling.
  - Database design must handle 100k users and 10k bills.
- Implementation notes:
  - Design stateless application servers behind a load balancer.
  - Use connection pooling and consider read replicas for DB scaling.
  - Partition or archive old data and use efficient indices for large tables.

## NFR3: Availability
- Requirements:
  - Maintain 99% uptime.
  - Schedule maintenance during low-usage periods with notifications.
- Implementation notes:
  - Use health checks, automated restarts, and monitoring alerts (Prometheus/Grafana or external service).
  - Implement maintenance mode page and email/notification pre-announcements.

## NFR4: Security
- Requirements:
  - Passwords hashed with bcrypt or Argon2.
  - TLS/SSL for all data transmission.
  - Protection against SQL injection, XSS, CSRF.
  - Sessions expire after 30 minutes inactivity.
- Implementation notes:
  - Ensure `models/user.js` uses bcrypt (or Argon2) with a suitable cost factor.
  - Enforce HTTPS, HSTS, and secure cookies; use CSRF tokens for state-changing forms.
  - Sanitize/encode user input, use parameterized DB queries/ORM.
  - Implement session timeout and refresh logic in auth middleware.

## NFR5: Usability
- Requirements:
  - UI intuitive; ≤ 10 minutes orientation for new users.
  - Responsive design for desktop & mobile.
  - WCAG 2.1 Level AA compliance.
- Implementation notes:
  - Use responsive layout, test with common screen sizes (320px–1920px).
  - Run accessibility audits (axe-core, Lighthouse) and fix violations.
  - Provide onboarding hints and concise user help text.

## NFR6: Reliability
- Requirements:
  - Automated daily DB backups.
  - Graceful error handling and meaningful messages.
- Implementation notes:
  - Schedule nightly backups and test restore procedures.
  - Centralize error handling (`middleware/errorHandler.js`) and return friendly UX messages while logging details server-side.

## NFR7: Compatibility
- Requirements:
  - Support modern browsers (Chrome, Firefox, Safari, Edge — latest two versions).
  - Responsive design across 320px–1920px+.
- Implementation notes:
  - Test on BrowserStack or similar; use progressive enhancement and polyfills where needed.

## NFR8: Maintainability
- Requirements:
  - Consistent coding standards and documentation.
  - Modular architecture for updates.
- Implementation notes:
  - Add linting (`eslint`) and formatting (`prettier`) rules and CI checks.
  - Keep controllers, services, and models separated (existing controllers/, models/ folders).

## NFR9: Data Integrity
- Requirements:
  - Ensure vote consistency and prevent duplicate votes.
  - Log all user actions affecting data for audits.
- Implementation notes:
  - Enforce unique constraints where applicable (e.g., votes table unique(user_id, bill_id)).
  - Add server-side checks before writes and use DB transactions for multi-step updates.
  - Implement audit logging (append-only logs or dedicated `AuditLog` table).

## NFR10: Compliance
- Requirements:
  - Comply with Kenya's Data Protection Act (2019).
  - Provide mechanisms for users to access, correct, delete personal data.
- Implementation notes:
  - Document personal data flows, retention, and consent.
  - Add endpoints and UI workflows for data access, correction, and deletion; log requests and responses.

## Next Steps / Actionable Items
- Create performance test scripts and add to CI.
- Add Redis caching where high-latency endpoints exist.
- Ensure `models/user.js` uses bcrypt/Argon2 and session timeout enforced in `middleware/auth.js`.
- Add daily backup cron + restoration test.
- Run accessibility and browser compatibility audits and fix issues.

---
Document created to track implementation progress. Link tasks to issues in the project tracker for owners and timelines.
