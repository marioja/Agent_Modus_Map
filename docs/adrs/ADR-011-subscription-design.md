# ADR: Local License Verification Architecture (React + Local Node Backend)

## Status
Accepted (with future option to migrate backend to remote server)

## Context
The application is a desktop-distributed product built using a React frontend and a Node.js backend, both running locally on the user’s machine. The product’s value (premium features, logic, algorithms) resides entirely on the client side. This means:

- The local environment is inherently untrusted.
- A determined attacker can modify both the React UI and the Node backend.
- Server-side verification cannot enforce local behavior.
- The goal is not perfect security, but to make unauthorized access **non-trivial**.

Paddle is used for subscription management and acts as the merchant of record, while Google OAuth is used for identity. Paddle handles billing, tax/VAT, and related payment compliance concerns, but since the backend is local, verification still cannot be fully trusted. However, the system can still raise the difficulty of casual tampering.

The long-term plan is to migrate the Node backend to a remote server, where verification and authorization will become authoritative.

## Decision
Implement a **local Node.js backend** that handles identity verification, subscription checks, and license issuance, even though it runs locally. The backend will:

1. **Verify Google OAuth tokens** using Google’s public keys.
2. **Check Paddle subscription status** using Paddle’s API.
3. **Generate and validate a signed license file** stored locally.
4. **Expose a local API** that the React app uses to query authorization state.
5. **Scatter and obfuscate authorization checks** to make patching harder.
6. **Periodically refresh the license** by re-checking Paddle.

The React frontend will:
- Never store subscription logic directly.
- Never call Paddle directly.
- Use Google Identity Services in the browser only to obtain a Google ID token.
- Delegate all token verification, subscription checks, and authorization decisions to the local Node backend.

This design does not prevent determined attackers from bypassing checks, but it significantly raises the effort required.

## Rationale
Even though the backend runs locally and can be modified, this architecture provides several benefits:

- **Signed license files** prevent trivial JSON editing (“free → pro”).
- **Obfuscation and scattered checks** increase the cost of patching.
- **Periodic Paddle refresh** ensures subscription changes propagate.
- **Merchant-of-record support** shifts tax/VAT collection and payment compliance to Paddle.
- **Separation of concerns** keeps React free of sensitive logic.
- **Future migration path**: the same API can later be hosted remotely without changing the React app.

This approach balances:
- Practicality (works offline, simple distribution)
- User experience (no constant online requirement)
- Security (not perfect, but not trivial to bypass)
- Future scalability (easy to move backend to the cloud)

## Detailed Design

### A. Activation Flow (First Login)
1. User logs in via Google OAuth in the React UI.
2. React loads Google Identity Services and initializes it with the configured `GOOGLE_CLIENT_ID`.
3. Google returns an ID token to the React UI for the selected account.
4. React sends the Google ID token to the local Node backend via `POST /api/auth/google/activate`.
5. Node verifies the token using Google’s public keys, validates the issuer, and checks that the token audience matches `GOOGLE_CLIENT_ID`.
6. Node upserts the Google-backed local user record.
7. Node queries Paddle to determine the user’s subscription tier.
8. Node generates a **signed license file** containing:
- user ID
- plan (free/pro/premium)
- expiration timestamp
- optional device fingerprint
9. Node signs the license using a private key stored locally (obfuscated).
10. License is saved to disk (e.g., `~/.myapp/license.jwt`).

### A1. Google OAuth Configuration
- Google sign-in is enabled only when `GOOGLE_CLIENT_ID` is present in the backend environment.
- The backend exposes this configuration through `GET /api/auth/config`, returning `googleEnabled` and `googleClientId` so the UI can decide whether to render the Google sign-in button.
- The browser uses the Google client ID only to initialize Google Identity Services; the token is still verified by the backend.
- The activation endpoint for Google-backed sign-in is `/api/auth/google/activate`.
- In development and tests, special `test-google:` or `dev-google:` tokens may be accepted, but production expects Google-signed RS256 ID tokens.

### B. Daily Usage Flow
1. On startup, Node loads the license file.
2. Node verifies the signature using a public key embedded in the app.
3. Node checks expiration and plan.
4. React queries Node for authorization via local API endpoints.
5. Node returns yes/no for each feature.
6. Authorization checks are scattered across Node modules and partially obfuscated.

### C. Periodic Online Refresh
1. Every X days or on app restart, Node re-checks Paddle.
2. If subscription changed:
   - Node issues a new signed license file.
3. If subscription is invalid or expired:
   - Node downgrades the license.
4. React updates UI accordingly.

### D. Anti-Tamper Measures
- Obfuscate Node backend code.
- Split private key into multiple fragments.
- Scatter authorization checks across modules.
- Use indirect capability flags instead of simple `if (plan === 'pro')`.
- Use IPC or separate processes to make patching harder.
- Break compatibility with patched versions on updates.

## Consequences

### Positive
- Significantly harder for casual users to bypass licensing.
- No trivial config-file edits.
- Works offline with cached license.
- Clean separation between UI and licensing logic.
- Easy migration to remote backend later.
- Paddle and Google remain the source of truth.

### Negative
- Determined attackers can still crack the app.
- Local private key storage is inherently insecure.
- Obfuscation increases build complexity.
- License refresh requires occasional internet access.
- Local Node backend adds distribution complexity.

## Future Considerations
- Move the Node backend to a remote server for real enforcement.
- Add telemetry (optional) to detect suspicious patterns.
- Add rate limiting and device binding once remote.
- Replace local private key with secure server-side signing.

## Decision Summary
Use a **local Node backend with signed licenses and obfuscated checks** to make unauthorized access inconvenient but not impossible, while preserving a clean migration path to a secure remote backend in the future.
