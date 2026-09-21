# M-Pesa Integration System

REST API + monitoring dashboard for M-Pesa integration using Safaricom's Daraja API.

## Tech Stack

- **Backend:** Node.js + Express + TypeScript + Prisma + SQLite
- **Frontend:** React + Vite + TailwindCSS
- **Deployment:** Wasmer Edge ready

## Quick Start

### 1. Backend Setup

```cmd
cd backend
npm install
npx prisma generate
npx prisma db push
copy .env.example .env
npm run dev
```

Server runs at `http://localhost:3000`

### 2. Frontend Setup (separate terminal)

```cmd
cd frontend
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173`

### 3. Get Safaricom Sandbox Credentials

1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Sign up / Log in
3. Create a new app in the sandbox portal
4. Copy your **Consumer Key**, **Consumer Secret**, **Shortcode**, and **Passkey**
5. Update `backend/.env` with your credentials

## Configuration

Edit `backend/.env`:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
API_KEY=dev-api-key-12345
```

Edit `frontend/.env`:

```env
VITE_API_KEY=dev-api-key-12345
```

## API Endpoints

### STK Push (Online Payment)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/mpesa/stk/push` | Send STK push to customer phone |
| `POST` | `/api/mpesa/stk/callback` | Safaricom callback (auto) |
| `GET` | `/api/mpesa/stk/query/:checkoutRequestId` | Check transaction status |

**STK Push Request:**
```json
{
  "amount": 1500,
  "phoneNumber": "254712345678",
  "accountReference": "DEVICE-001",
  "transactionDesc": "Device rental"
}
```

**Phone number format:** `254XXXXXXXXX` (12 digits, starts with 254)

### C2B Register URL (Offline Payment)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/mpesa/c2b/register` | Register confirmation/validation URLs |
| `POST` | `/api/mpesa/c2b/confirmation` | Receives payment confirmations |
| `POST` | `/api/mpesa/c2b/validation` | Validates incoming payments |

### B2C Refund (Device Return)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/mpesa/b2c/refund` | Issue 50% refund (dashboard) |
| `POST` | `/api/mpesa/b2c/refund/api` | Issue 50% refund (external API) |
| `POST` | `/api/mpesa/b2c/result` | B2C result callback |
| `POST` | `/api/mpesa/b2c/timeout` | B2C timeout callback |

**Refund Request:**
```json
{
  "transactionId": "uuid-of-original-transaction"
}
```

### Dashboard API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Transaction summary stats |
| `GET` | `/api/dashboard/transactions` | List with filters |
| `GET` | `/api/dashboard/transactions/:id` | Transaction detail |
| `GET` | `/api/dashboard/refunds` | List refunds |
| `GET` | `/api/dashboard/stream` | SSE live feed |

All dashboard endpoints require `x-api-key` header.

## Dashboard Features

- **Dashboard Page** - Stats cards, charts, live feed, quick STK push
- **Transactions Page** - Searchable/filterable table with detail modal
- **Refunds Page** - Refund history and management
- **Settings Page** - M-Pesa credentials configuration

## Callback URLs

For local development, use [ngrok](https://ngrok.com) to expose your server:

```cmd
ngrok http 3000
```

Then update `backend/.env` with the HTTPS ngrok URL:

```env
MPESA_STK_CALLBACK_URL=https://your-ngrok-url.app/api/mpesa/stk/callback
```

## Project Structure

```
backend/
  src/
    lib/mpesa/       # M-Pesa API client (auth, STK, C2B, B2C)
    routes/          # Express route handlers
    services/        # Business logic (transactions, refunds, notifications)
    middleware/       # Auth, rate limiting, error handling
  prisma/            # Database schema

frontend/
  src/
    components/      # Reusable UI components
    pages/           # Dashboard pages
    hooks/           # React hooks (SSE, transactions)
    lib/             # API client
```

## Going Live

1. Register on Safaricom Daraja portal for production
2. Create a production app and get it approved
3. Update `MPESA_ENVIRONMENT=production` in `.env`
4. Update credentials with production values
5. Ensure callback URLs use HTTPS
6. Deploy backend to Wasmer Edge or your server
7. Deploy frontend to Wasmer Edge static hosting
