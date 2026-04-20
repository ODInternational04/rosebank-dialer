# Security Baseline (All Platforms)

This baseline is for protecting sensitive customer data (PII, phone, email, vault box details) across application code, Vercel, GitHub, and Supabase.

## 1. Application Security (Next.js API + Frontend)

1. Keep debug/test routes disabled in production.
2. Use strict authentication and authorization checks on every data endpoint.
3. Enforce strong passwords for all users:
   - Minimum 12 characters
   - Uppercase, lowercase, number, special character
4. Normalize and validate user input (email lowercasing, schema validation).
5. Never return secrets, hashes, or internal diagnostics to clients.
6. Use secure auth cookies where possible:
   - HttpOnly
   - Secure
   - SameSite=Strict
7. Use strict CORS (no wildcard for auth endpoints).
8. Keep CSP restrictive and remove unsafe-eval where possible.

## 2. API Security Controls

1. Block or remove non-production endpoints:
   - /api/debug/*
   - /api/test/*
2. Return 404 for blocked internal endpoints.
3. Add rate limiting for:
   - Login
   - Register
   - Password reset
   - Bulk operations
4. Implement audit logs for:
   - Login success/failure
   - User creation/role changes
   - Data exports
   - Bulk uploads and updates
5. Avoid exposing stack traces or SQL errors in API responses.

## 3. Supabase Security

1. Rotate secrets regularly:
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
2. Keep service role key server-side only.
3. Re-enable and maintain Row Level Security (RLS) for user-facing tables.
4. Use least privilege:
   - Service role for admin-only operations
   - RLS-protected role for user operations
5. Encrypt highly sensitive data at rest when feasible.
6. Restrict table/view access and remove unused database functions.
7. Enable database backups and periodic restore testing.

## 4. Vercel Security

1. Set environment variables per environment (Production/Preview/Development).
2. Restrict access to Project Settings and env vars.
3. Enable deployment protection for preview environments.
4. Use custom domains with enforced HTTPS.
5. Disable unnecessary public diagnostics endpoints.
6. Monitor deployment logs for suspicious access patterns.

## 5. GitHub Security

1. Enable branch protection on main:
   - Require PR reviews
   - Require status checks
2. Enable secret scanning and push protection.
3. Enable Dependabot alerts and automated updates.
4. Use least-privilege repository permissions.
5. Never commit credentials, hashes, or tokens.

## 6. Operational Security

1. Establish a quarterly secret rotation schedule.
2. Keep an incident response checklist:
   - Revoke keys
   - Force logout
   - Block suspicious IPs
   - Verify audit trail
3. Maintain data retention and deletion policy.
4. Run periodic vulnerability testing and access reviews.
5. Train admins/users on phishing and credential hygiene.

## 7. Security Verification Checklist (Release Gate)

Before each production release:

1. Verify /api/debug/* and /api/test/* are inaccessible.
2. Verify auth CORS is restricted to trusted origins.
3. Verify no endpoint returns password hashes or debug internals.
4. Verify strong password policy is enforced.
5. Verify all critical env vars are set securely in Vercel.
6. Verify dependency vulnerabilities are reviewed.
7. Verify audit logging is active for sensitive operations.

## 8. Emergency Hardening Steps (If Exposure Is Detected)

1. Immediately block exposed endpoint paths.
2. Rotate JWT secret and Supabase keys.
3. Reset admin credentials.
4. Invalidate all active sessions.
5. Review logs and notify affected stakeholders if required.

---

Owner: Security + Engineering
Review cadence: Every 30 days or after any security incident
