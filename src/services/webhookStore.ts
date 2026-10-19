// Webhook types and state management for HookRelay

export type WebhookProvider = 'stripe' | 'github' | 'shopify' | 'clerk' | 'custom';
export type DeliveryStatus = 'delivered' | 'retrying' | 'failed' | 'dead_letter';

export interface DeliveryAttempt {
  id: string;
  timestamp: string;
  statusCode: number;
  durationMs: number;
  responseBody: string;
  error?: string;
}

export interface WebhookEvent {
  id: string;
  endpointId: string;
  provider: WebhookProvider;
  eventType: string;
  status: DeliveryStatus;
  destinationUrl: string;
  headers: Record<string, string>;
  payload: string;
  timestamp: string;
  attempts: DeliveryAttempt[];
  retryCount: number;
  maxRetries: number;
  signatureVerified: boolean;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  ingestPath: string;
  destinationUrl: string;
  secret: string;
  provider: WebhookProvider;
  isActive: boolean;
  createdAt: string;
  totalReceived: number;
  totalFailed: number;
}

const INITIAL_ENDPOINTS: WebhookEndpoint[] = [
  {
    id: 'ep_prod_stripe',
    name: 'Stripe Billing & Subscriptions',
    ingestPath: 'wh_live_strp_89f0a2',
    destinationUrl: 'http://localhost:3000/api/webhooks/stripe',
    secret: 'whsec_90f23a88c71b4028d7e4',
    provider: 'stripe',
    isActive: true,
    createdAt: '2026-10-18T10:00:00Z',
    totalReceived: 142,
    totalFailed: 3,
  },
  {
    id: 'ep_prod_github',
    name: 'GitHub CI/CD Automation',
    ingestPath: 'wh_live_gh_37b8c1',
    destinationUrl: 'http://localhost:4000/webhooks/github',
    secret: 'whsec_110aef73889bc4412e09',
    provider: 'github',
    isActive: true,
    createdAt: '2026-10-19T08:30:00Z',
    totalReceived: 88,
    totalFailed: 1,
  },
  {
    id: 'ep_prod_clerk',
    name: 'Clerk User Authentication',
    ingestPath: 'wh_live_clk_99e120',
    destinationUrl: 'https://api.myapp.com/v1/auth/sync',
    secret: 'whsec_7721be01f89945a0bce1',
    provider: 'clerk',
    isActive: true,
    createdAt: '2026-10-19T11:15:00Z',
    totalReceived: 310,
    totalFailed: 0,
  },
];

const INITIAL_EVENTS: WebhookEvent[] = [
  {
    id: 'evt_stripe_1092',
    endpointId: 'ep_prod_stripe',
    provider: 'stripe',
    eventType: 'payment_intent.succeeded',
    status: 'delivered',
    destinationUrl: 'http://localhost:3000/api/webhooks/stripe',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': 't=1729350410,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd',
      'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
      'x-hookrelay-id': 'rel_9921',
    },
    payload: JSON.stringify(
      {
        id: 'pi_3MtwBwLkdIwHu7ix28a3tqPa',
        object: 'payment_intent',
        amount: 4900,
        currency: 'usd',
        status: 'succeeded',
        customer: 'cus_N9f802Ka7z',
        receipt_email: 'zahinarman1234@gmail.com',
        metadata: {
          plan: 'pro_monthly',
          seats: 3,
        },
      },
      null,
      2,
    ),
    timestamp: '2026-10-19T16:40:10Z',
    signatureVerified: true,
    retryCount: 0,
    maxRetries: 5,
    attempts: [
      {
        id: 'att_1',
        timestamp: '2026-10-19T16:40:10.420Z',
        statusCode: 200,
        durationMs: 48,
        responseBody: '{"received": true, "processed_at": "2026-10-19T16:40:10.468Z"}',
      },
    ],
  },
  {
    id: 'evt_stripe_1091',
    endpointId: 'ep_prod_stripe',
    provider: 'stripe',
    eventType: 'customer.subscription.deleted',
    status: 'dead_letter',
    destinationUrl: 'http://localhost:3000/api/webhooks/stripe',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': 't=1729350100,v1=c0a7628a5ff699a700871bcdef008761234a9bce0144f899014abce50123ef',
      'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
    },
    payload: JSON.stringify(
      {
        id: 'sub_1O8bUdLkdIwHu7ix33k10a',
        object: 'subscription',
        status: 'canceled',
        customer: 'cus_M49102Lp01',
        cancel_at_period_end: false,
        canceled_at: 1729350100,
      },
      null,
      2,
    ),
    timestamp: '2026-10-19T16:35:00Z',
    signatureVerified: true,
    retryCount: 5,
    maxRetries: 5,
    attempts: [
      {
        id: 'att_1',
        timestamp: '2026-10-19T16:35:00Z',
        statusCode: 503,
        durationMs: 1200,
        responseBody: 'Service Unavailable',
        error: 'Target server connection refused at http://localhost:3000/api/webhooks/stripe',
      },
      {
        id: 'att_2',
        timestamp: '2026-10-19T16:36:00Z',
        statusCode: 503,
        durationMs: 1200,
        responseBody: 'Service Unavailable',
        error: 'Target server connection refused',
      },
      {
        id: 'att_3',
        timestamp: '2026-10-19T16:38:00Z',
        statusCode: 504,
        durationMs: 5000,
        responseBody: 'Gateway Timeout',
        error: 'Request timed out after 5000ms',
      },
      {
        id: 'att_4',
        timestamp: '2026-10-19T16:42:00Z',
        statusCode: 500,
        durationMs: 210,
        responseBody: '{"error": "Database locked or busy"}',
        error: 'HTTP 500 Internal Server Error',
      },
      {
        id: 'att_5',
        timestamp: '2026-10-19T16:50:00Z',
        statusCode: 500,
        durationMs: 195,
        responseBody: '{"error": "Database locked or busy"}',
        error: 'Max retries exhausted. Moved to Dead-Letter Queue (DLQ).',
      },
    ],
  },
  {
    id: 'evt_gh_8820',
    endpointId: 'ep_prod_github',
    provider: 'github',
    eventType: 'push',
    status: 'delivered',
    destinationUrl: 'http://localhost:4000/webhooks/github',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'push',
      'x-hub-signature-256': 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c469e4637cb87cf9f',
      'x-github-delivery': '72d3162e-cc78-11e3-814f-1ec87088b345',
    },
    payload: JSON.stringify(
      {
        ref: 'refs/heads/main',
        repository: {
          name: 'KickOff',
          full_name: 'TaskinXZ/KickOff',
          owner: { name: 'TaskinXZ' },
        },
        pusher: { name: 'TaskinXZ', email: 'jahinarman1234@gmail.com' },
        head_commit: {
          id: '645f29cc3176500b4b5762ba887cf2a7f0ffdf2c',
          message: 'feat: add career transfer window simulation',
          timestamp: '2026-10-19T16:20:00Z',
        },
      },
      null,
      2,
    ),
    timestamp: '2026-10-19T16:20:01Z',
    signatureVerified: true,
    retryCount: 0,
    maxRetries: 3,
    attempts: [
      {
        id: 'att_gh_1',
        timestamp: '2026-10-19T16:20:01.100Z',
        statusCode: 200,
        durationMs: 82,
        responseBody: '{"status": "queued_for_build", "job_id": "job_9918"}',
      },
    ],
  },
  {
    id: 'evt_clerk_310',
    endpointId: 'ep_prod_clerk',
    provider: 'clerk',
    eventType: 'user.created',
    status: 'delivered',
    destinationUrl: 'https://api.myapp.com/v1/auth/sync',
    headers: {
      'content-type': 'application/json',
      'svix-id': 'msg_2rR7y176p0K04q7617',
      'svix-timestamp': '1729351000',
      'svix-signature': 'v1,g0hM9SsE+OTPJTGtSMW6VTHtDA2TLaBgqYqlA2vVB80=',
    },
    payload: JSON.stringify(
      {
        data: {
          id: 'user_2rR7y009Ka9',
          first_name: 'Zahin',
          last_name: 'Arman',
          email_addresses: [
            {
              id: 'idn_2rR7y001',
              email_address: 'jahinarman1234@gmail.com',
            },
          ],
          created_at: 1729351000000,
        },
        object: 'event',
        type: 'user.created',
      },
      null,
      2,
    ),
    timestamp: '2026-10-19T16:15:00Z',
    signatureVerified: true,
    retryCount: 0,
    maxRetries: 3,
    attempts: [
      {
        id: 'att_clk_1',
        timestamp: '2026-10-19T16:15:00.300Z',
        statusCode: 200,
        durationMs: 34,
        responseBody: '{"user_synced": true}',
      },
    ],
  },
];

const STORAGE_KEYS = {
  ENDPOINTS: 'hookrelay_endpoints_v1',
  EVENTS: 'hookrelay_events_v1',
};

export const getStoredEndpoints = (): WebhookEndpoint[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ENDPOINTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.ENDPOINTS, JSON.stringify(INITIAL_ENDPOINTS));
    return INITIAL_ENDPOINTS;
  }
  return JSON.parse(data);
};

export const saveEndpoints = (endpoints: WebhookEndpoint[]) => {
  localStorage.setItem(STORAGE_KEYS.ENDPOINTS, JSON.stringify(endpoints));
};

export const getStoredEvents = (): WebhookEvent[] => {
  const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    return INITIAL_EVENTS;
  }
  return JSON.parse(data);
};

export const saveEvents = (events: WebhookEvent[]) => {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
};
