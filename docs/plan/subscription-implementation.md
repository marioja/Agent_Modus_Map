# ADR-011 Subscription Implementation Summary

ADR-011 is now implemented as a local license verification architecture instead of placeholder client-only auth.

## What changed

1. **Backend licensing flow**
   - Added Google ID token verification for local activation.
   - Added subscription resolution through Paddle-backed lookup with local/test override support.
   - Added signed local license issuance, validation, refresh metadata, and authorization-state APIs.
   - Extended auth storage to support provider metadata for password and Google-backed users.

2. **Entitlement enforcement**
   - Added capability-based gating in the backend for paid features.
   - Protected interview, traces, live simulation, deploy, prospect access/export, and handoff document routes.
   - Limited template visibility for non-entitled users.

3. **Client integration**
   - Replaced the placeholder login flow with backend-driven sign-in and Google activation.
   - Added auth-state/session restoration from the backend and local license cache.
   - Added pricing/login prompts when users try to access locked features.

4. **Supporting work**
   - Added focused auth/licensing API coverage.
   - Restored the missing shared `seed-agents` data module used by seed and shared tests.

## Result

The app now treats licensing as a backend concern with signed local state, scattered API/UI enforcement points, and a migration-friendly authorization surface for a future remote backend.
