# ⚡ HookRelay

[![Live on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://hookrelay-blond.vercel.app)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://hookrelay-blond.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://hookrelay-blond.vercel.app)

> **Live Demo:** [https://hookrelay-blond.vercel.app](https://hookrelay-blond.vercel.app)  
> **Developer Webhook Gateway, Live Payload Inspector & Dead-Letter Queue (DLQ) Hub on Vercel**

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
