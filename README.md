# ⚡ HookRelay

> **Developer Webhook Gateway, Live Payload Inspector & Dead-Letter Queue (DLQ) Hub**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

HookRelay solves the reliability nightmare of receiving and testing webhooks from Stripe, GitHub, Shopify, and Clerk. It provides persistent ingestion endpoints, cryptographic HMAC verification, local development tunneling, and automatic retry queues with a Dead-Letter Queue (DLQ) for zero lost events.

---

## 🚀 Key Features

* **Instant Ingestion Endpoints:** Generate permanent ingestion URLs (`wh_live_...`) to receive webhooks from any provider.
* **Live Payload Inspector:** Watch webhooks arrive with sub-second latency, inspect raw headers, format JSON payloads, and monitor response status codes.
* **Dead-Letter Queue (DLQ) & 1-Click Replay:** If your server goes down or returns `500 Internal Server Error`, HookRelay holds failed deliveries and lets you replay them with one click.
* **Cryptographic Verification:** Built-in HMAC SHA-256 signature verification for Stripe (`stripe-signature`), GitHub (`x-hub-signature-256`), and Clerk (`svix-signature`).
* **cURL & Tunnel Generator:** Easily forward events to local development (`http://localhost:3000`) or copy verbatim cURL commands for terminal debugging.

---

## 🛠️ Quickstart

```bash
# Clone the repository
git clone https://github.com/TaskinXZ/HookRelay.git
cd HookRelay

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📦 Build & Deploy

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

Deployable to Vercel or Netlify with zero configuration (`npm run build` outputs to `dist/`).
