# Security & UX Improvements - Work Plan
**Date**: April 21, 2026  
**Prepared by**: Magenta Naidoo 
**For**: Alison Kannigan
**Project**: Rosebank Dialer then furthering to all the dialer systems
---

## Executive Summary

This document outlines planned security hardening, production readiness improvements, and user experience enhancements for the Rosebank Dialer system. These changes will significantly strengthen our security posture and improve the login experience for all users.

**Estimated Timeline**: 1-2 business days  
**Priority**: High - Security Critical

---

## 🎯 Objectives

1. **Harden production security** by blocking debug/test endpoints
2. **Strengthen authentication security** with improved lockout mechanisms
3. **Enhance user experience** with better visual feedback during login
4. **Fix critical bugs** affecting user creation and API reliability
5. **Establish security baseline** documentation for ongoing compliance

---

## 🔐 Planned Security Enhancements

### 1. Create Production Security Baseline Documentation
**What**: Develop comprehensive security guidelines document (`SECURITY_BASELINE_ALL_PLATFORMS.md`)

**Coverage**:
- Application security controls and best practices
- API security measures and rate limiting
- Supabase database security protocols
- Vercel deployment security configuration
- GitHub repository security settings
- Operational security procedures and incident response
- Pre-release security checklist
- Emergency hardening procedures

**Benefit**: Establishes clear security standards and ensures consistent security practices across all platforms.

---

### 2. Block Debug/Test Endpoints in Production
**What**: Prevent access to all internal debugging and testing endpoints when running in production environment.

**Endpoints to Protect** (17 total):
- `/api/debug/*` routes (7 endpoints):
  - create-user, customer-feedback, data, fix-admin, stats, test-reports, users
  
- `/api/test/*` routes (10 endpoints):
  - call-data, customer-feedback, database-setup, db, email-config, email-notification, feedback-insert, hash, login

**Implementation**: Return `404 Not Found` for these routes in production

**Benefit**: Prevents unauthorized access to sensitive internal tools and data exposure.

---

### 3. Strengthen Login Security

#### A. Enhanced Account Lockout System
**Current State**: 5 failed attempts → 15-minute lockout  
**Planned Changes**:
- Reduce to **3 failed attempts**
- Reduce lockout to **10 minutes**
- Add real-time attempt tracking
- Implement visual lockout countdown timer
- Persist lockout state across page refresh

**Benefit**: Reduces brute-force attack window while providing clear feedback to legitimate users.

#### B. Admin Security Notifications
**What**: Automatically notify all active admin users via email when an account gets locked due to failed login attempts.

**Notification Contents**:
- Target email address
- Source IP address
- Number of failed attempts
- Lockout expiration timestamp
- Direct link to user management dashboard

**Benefit**: Provides immediate visibility into potential security incidents.

#### C. Rate Limiting Optimization
**Planned Changes**:
- Increase app-level rate limit to 30 requests per 5 minutes
- Move credential-specific lockout to application layer
- Add `RATE_LIMIT_EXCEEDED` error code for better client handling

**Benefit**: Balances security with legitimate user experience during network issues.

---

### 4. CORS Security Hardening
**What**: Implement strict Cross-Origin Resource Sharing policies for authentication endpoints.

**Changes**:
- Remove wildcard (`*`) CORS on auth routes
- Implement environment-based origin validation
- Use `NEXT_PUBLIC_APP_URL` for production origin
- Default production origin: `https://rosebank-dialer.vercel.app`
- Add `Vary: Origin` header for proper caching

**Benefit**: Prevents unauthorized domains from accessing authentication APIs.

---

### 5. Enforce Strong Password Policy
**Current Policy**: Minimum 6 characters  
**New Policy**:
- Minimum **12 characters**
- Must include uppercase letter
- Must include lowercase letter
- Must include number
- Must include special character

**Applied to**:
- New user registration
- Admin-created user accounts
- Password reset functionality

**Benefit**: Significantly reduces password cracking risk and aligns with industry best practices.

---

### 6. Implement Email Normalization
**What**: Automatically convert all email addresses to lowercase throughout the system.

**Applied to**:
- User registration
- Login authentication
- Email lookups and searches
- Database storage

**Benefit**: Prevents duplicate accounts due to case variations (e.g., User@email.com vs user@email.com).

---

### 7. Harden SMTP Security
**What**: Enforce TLS certificate validation in production environment.

**Change**: Set `rejectUnauthorized: true` for production SMTP connections  
**Note**: Self-signed certificates will only be accepted in development

**Benefit**: Ensures secure email transmission and prevents man-in-the-middle attacks.

---

## 🎨 Planned User Experience Improvements

### Login Page Enhancements

#### 1. Visual Attempt Counter
**What**: Display remaining login attempts after each failed login.

**Implementation**:
- Amber warning banner showing attempts remaining (3, 2, 1)
- Updates in real-time after each attempt
- Disappears after successful login

**User Value**: Reduces user confusion and support tickets about locked accounts.

---

#### 2. Lockout Countdown Timer
**What**: Show real-time countdown when account is locked.

**Implementation**:
- Format: `MM:SS` (e.g., "9:45", "2:30")
- Red danger banner with countdown
- Updates every second
- Automatically clears when timer expires

**User Value**: Users know exactly when they can try again without repeated failed attempts.

---

#### 3. Persistent Login State
**What**: Remember login state across page refreshes using browser localStorage.

**Stored Information**:
- Email address (for convenience)
- Remaining attempts count
- Lockout expiration time

**User Value**: Prevents loss of security context if user accidentally refreshes page.

---

#### 4. Disabled Input During Lockout
**What**: Disable email and password fields while account is locked.

**Implementation**:
- Grayed-out input fields
- Submit button shows lockout timer
- Clear visual indication of locked state

**User Value**: Prevents frustration from attempting to submit while locked out.

---

#### 5. Enhanced Error Messages
**What**: Provide specific error codes and actionable information.

**New Error Types**:
- `ACCOUNT_LOCKED`: Too many failed attempts with retry timer
- `RATE_LIMIT_EXCEEDED`: Rate limit hit with retry information
- `INVALID_CREDENTIALS`: Wrong email/password with attempts remaining

**User Value**: Users understand exactly what went wrong and what to do next.

---

## 🏗️ Infrastructure Improvements

### 1. Environment Variable Validation
**What**: Add strict runtime validation for critical environment variables.

**Changes**:
- Production: Throw errors immediately if required vars are missing
- Development: Show warnings but allow continued operation
- Validate JWT_SECRET is at least 32 characters
- Validate Supabase URL format

**Benefit**: Prevents production deployments with missing configuration.

---

### 2. Fix Supabase Client Initialization
**What**: Resolve build-time and runtime initialization issues.

**Changes**:
- Improve build-time vs runtime environment detection
- Use proper placeholder values during build phase
- Create clients dynamically per-request in API routes
- Add better error handling and validation

**Benefit**: Eliminates build failures and stale connection issues.

---

### 3. Configure Production Origin
**What**: Make production origin configurable via environment variable.

**Implementation**:
- Use `NEXT_PUBLIC_APP_URL` environment variable
- Default to `https://rosebank-dialer.vercel.app`
- Apply to CORS configuration and email links

**Benefit**: Simplifies deployment to different environments and domains.

---

## 🐛 Critical Bug Fixes

### 1. False "Failed to Create User" Error
**Issue**: User creation succeeds in database but API returns error due to SELECT failure.

**Planned Fix**:
- Add fallback verification query after insert errors
- Check if user actually exists with matching email
- Return success (201) if user was created
- Provide better error details if actual failure

**Impact**: Eliminates confusing error messages when users are successfully created.

---

### 2. Missing Supabase Client Initialization
**Issue**: Several API routes reference undefined `supabase` client.

**Routes to Fix** (5):
- `/api/call-logs/[id]/route.ts` (DELETE handler)
- `/api/clients/search/route.ts` (GET handler)
- `/api/notifications/[id]/route.ts` (DELETE handler)
- `/api/notifications/route.ts` (PUT and DELETE handlers)
- `/api/statistics/route.ts` (POST handler)

**Impact**: Prevents runtime errors and API failures in these endpoints.

---

### 3. Enhanced AuthContext Error Handling
**Issue**: Login errors don't provide enough detail for proper UX handling.

**Planned Improvements**:
- Return structured `LoginResult` object instead of boolean
- Include error codes, retry timing, and attempts remaining
- Properly handle all authentication states
- Enable better error display in UI

**Impact**: Enables the enhanced UX features described above.

---

## 📝 API Changes

### Updated Login Endpoint Response

#### New Response Structure
```json
{
  "error": "string",
  "code": "INVALID_CREDENTIALS | ACCOUNT_LOCKED | RATE_LIMIT_EXCEEDED",
  "attemptsRemaining": 0-3,
  "retryAfter": 120
}
```

#### Status Codes
- `200`: Successful authentication
- `401`: Invalid credentials (includes attemptsRemaining)
- `429`: Account locked or rate limited (includes retryAfter in seconds)
- `404`: Attempted access to disabled debug/test endpoint

---

## 📋 Implementation Plan

### Files to be Created
1. `SECURITY_BASELINE_ALL_PLATFORMS.md` - New security documentation

### Files to be Modified
**Core Configuration**:
- `next.config.js` - Production origin configuration
- `src/lib/config.ts` - Environment validation
- `src/lib/supabase.ts` - Client initialization improvements
- `src/middleware.ts` - Debug endpoint blocking and rate limits

**Authentication**:
- `src/app/api/auth/login/route.ts` - Enhanced security and notifications
- `src/contexts/AuthContext.tsx` - Improved error handling
- `src/app/login/page.tsx` - UX enhancements
- `src/lib/auth.ts` - Password validation (if needed)

**Email & Security**:
- `src/lib/emailService.ts` - TLS hardening

**User Management**:
- `src/app/api/users/route.ts` - Password policy and email normalization

**Bug Fixes** (5 files):
- `src/app/api/call-logs/[id]/route.ts`
- `src/app/api/clients/search/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/statistics/route.ts`

**Debug/Test Endpoints** (17 files):
- `src/app/api/debug/**/*.ts` (7 files)
- `src/app/api/test/**/*.ts` (10 files)

**Total**: 30+ files

---

## ⚠️ Breaking Changes & Migration Notes

### 1. Password Requirements Change
**Impact**: Existing users with passwords < 12 characters or lacking complexity

**Mitigation Plan**:
- Existing passwords remain valid until next change
- Optional: Add migration script to flag weak passwords
- Optional: Prompt users to update on next login
- Communicate change to all users via email

### 2. Stricter Login Lockout
**Impact**: Users will be locked out after 3 attempts instead of 5

**Mitigation Plan**:
- Ensure lockout timer is clearly visible
- Prepare support team for potential increase in lockout-related inquiries
- Consider adding "Forgot Password" link on lockout screen

### 3. Debug Endpoints Disabled
**Impact**: Development/debugging tools won't work in production

**Mitigation Plan**:
- Document alternative debugging methods for production
- Ensure proper logging and monitoring tools are in place
- Update deployment runbooks

---

## 🔍 Testing Strategy

### Security Testing
- [ ] Verify all debug/test endpoints return 404 in production build
- [ ] Test login lockout triggers after 3 failed attempts
- [ ] Verify lockout timer counts down correctly
- [ ] Confirm admin notification emails are sent on lockout
- [ ] Test password strength validation rejects weak passwords
- [ ] Verify email normalization (test User@test.com vs user@test.com)
- [ ] Confirm CORS blocks unauthorized origins

### User Experience Testing
- [ ] Verify attempt counter displays after failed login
- [ ] Test lockout timer persists across page refresh
- [ ] Confirm input fields are disabled during lockout
- [ ] Test localStorage state persistence
- [ ] Verify all error messages display correctly
- [ ] Test successful login clears security state

### API Testing
- [ ] Verify user creation no longer returns false errors
- [ ] Test all 5 fixed API routes initialize Supabase correctly
- [ ] Confirm rate limiting works as expected
- [ ] Test CORS headers in production environment
- [ ] Verify environment variable validation

### Integration Testing
- [ ] Test complete login flow with correct credentials
- [ ] Test complete login flow with 3 failed attempts
- [ ] Test account unlock after timer expires
- [ ] Test admin notification email delivery
- [ ] Test user creation with new password requirements

---

## 📊 Success Metrics

### Security
- ✅ Zero debug/test endpoints accessible in production
- ✅ 100% authentication requests use strict CORS
- ✅ All new passwords meet 12-character complexity requirement
- ✅ Admin notifications sent within 30 seconds of lockout
- ✅ Email addresses normalized consistently

### User Experience
- ✅ Users see remaining attempts before lockout
- ✅ Lockout timer visible and accurate to within 1 second
- ✅ Security state persists across refresh 100% of time
- ✅ Clear error messages for all failure scenarios
- ✅ Reduced support tickets related to login confusion

### Reliability
- ✅ User creation success rate improves to 99.9%+
- ✅ Zero crashes from missing Supabase clients
- ✅ Zero production deployments with missing env vars
- ✅ API uptime maintains 99.9%+

---

## 🚀 Deployment Plan

### Phase 1: Development & Testing (Day 1 - Morning)
1. Implement security baseline documentation
2. Block debug/test endpoints
3. Implement enhanced login security
4. Fix critical bugs

### Phase 2: Testing & Validation (Day 1 - Afternoon)
1. Execute complete test plan
2. Validate all security controls
3. Test UX enhancements
4. Code review and approval

### Phase 3: Staging Deployment (Day 2 - Morning)
1. Deploy to staging environment
2. Run smoke tests
3. Perform security audit
4. Get stakeholder approval

### Phase 4: Production Deployment (Day 2 - Afternoon)
1. Deploy to production during low-traffic window
2. Monitor error rates and performance
3. Verify security controls active
4. Monitor admin notifications

### Phase 5: Post-Deployment (Day 2 - End of Day)
1. Send user communication about password requirements
2. Update internal documentation
3. Brief support team on changes
4. Schedule 24-hour post-deployment review

---

## 📞 Support & Questions

**Technical Lead**: [Your Name]  
**Timeline**: April 21-22, 2026  
**Approval Required**: Yes - Security changes require management sign-off

For questions or concerns about this work plan, please contact the development team.

---

## 📎 Appendices

### A. Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET (min 32 characters)
NEXT_PUBLIC_APP_URL
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASS
```

### B. Estimated Effort
- Development: 8-10 hours
- Testing: 4-6 hours  
- Documentation: 2-3 hours
- Deployment: 2-3 hours
- **Total**: 16-22 hours (2 business days)

### C. Risk Assessment
- **Technical Risk**: Low - Changes are well-scoped and tested
- **Security Risk**: Low - Improvements strengthen existing security
- **User Impact**: Medium - Breaking changes require user communication
- **Rollback Plan**: Standard - Can revert via git in < 30 minutes

---

**Document Status**: Ready for Review  
**Approval Required**: Manager/Director Sign-off  
**Next Steps**: Schedule kickoff meeting to review and approve plan