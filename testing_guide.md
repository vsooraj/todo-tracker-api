# Testing Guide

This guide explains how to run and test the Kairos login feature locally.

> If no Clerk publishable key is configured, the app uses development-only basic authentication: `demo@todotracker.local` / `Password123!`. Change `BASIC_AUTH_EMAIL` and `BASIC_AUTH_PASSWORD` in `.env` if needed. Use Clerk before production.

## Prerequisites

- Node.js 20 LTS or later
- npm 10 or later
- A free [Clerk](https://clerk.com) account and application

## 1. Create a Clerk application

1. Sign in to the [Clerk Dashboard](https://dashboard.clerk.com/).
2. Create an application.
3. Enable the sign-in methods needed for testing, such as email/password, Google, or GitHub.
4. In **API Keys**, copy the Publishable Key (`pk_test_...`) and Secret Key (`sk_test_...`).

Do not commit either key to source control. The secret key must never be used in the React client.

## 2. Configure environment files

From the repository root, create the API environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and add your real Clerk secret key:

```env
PORT=5012
CLIENT_ORIGIN=http://localhost:5174
CLERK_SECRET_KEY=sk_test_your_actual_key
```

Create the React environment file:

```powershell
Copy-Item client/.env.example client/.env
```

Edit `client/.env` and add the matching Clerk publishable key:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key
VITE_API_BASE_URL=http://localhost:5012
```

`VITE_` variables are visible to the browser. Only the publishable key belongs in `client/.env`; never place `CLERK_SECRET_KEY` there.

## 3. Start the application

Open two terminals in the repository root.

In the first terminal, start the API:

```powershell
$env:PORT=5012
npm run dev
```

In the second terminal, start the React client:

```powershell
npm run client:dev -- --host 0.0.0.0 --port 5174
```

Open [http://localhost:5174](http://localhost:5174) in a browser.

## 4. Test checklist

1. Confirm the login page displays instead of the configuration warning.
2. Select an enabled authentication method and complete sign-in.
3. Confirm the page displays **“You’re signed in.”** and the Clerk user menu.
4. Use the user menu to sign out and confirm the login page returns.
5. Verify the API health endpoint:

   ```powershell
   Invoke-RestMethod http://localhost:5012/health
   ```

   Expected result:

   ```json
   { "status": "ok", "authentication": "clerk" }
   ```

6. After signing in, obtain a Clerk session token from your browser application and call the protected endpoint:

   ```powershell
   $token = "your_clerk_session_token"
   Invoke-RestMethod http://localhost:5012/api/v1/auth/me -Headers @{ Authorization = "Bearer $token" }
   ```

   A successful response includes `userId`, `sessionId`, and any active Clerk organization context. Without a valid token, the endpoint should reject the request.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| “Add `VITE_CLERK_PUBLISHABLE_KEY`…” | Create `client/.env`, add a real `pk_test_...` key, then restart Vite. |
| Sign-in page reports an invalid key | Verify the publishable and secret keys came from the same Clerk application. |
| The UI does not load | Confirm Vite is running and open the URL printed by Vite. If using port `5174`, use `http://localhost:5174`. |
| API rejects browser requests | Ensure `CLIENT_ORIGIN` exactly matches the frontend origin and restart the API. |
| `/api/v1/auth/me` returns unauthorized | Sign in first and send a current Clerk session token in the `Authorization` header. |

## Stop the application

Press `Ctrl+C` in each terminal when testing is complete.
