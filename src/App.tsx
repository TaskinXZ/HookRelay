import React, { useState, useEffect } from 'react';
import {
  WebhookEndpoint,
  WebhookEvent,
  getStoredEndpoints,
  saveEndpoints,
  getStoredEvents,
  saveEvents,
  WebhookProvider,
} from './services/webhookStore';
import {
  Zap,
  Activity,
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  Send,
  Plus,
  AlertTriangle,
  ArrowRight,
  Code,
  Terminal,
  ExternalLink,
  Trash2,
  Play,
  Layers,
} from 'lucide-react';

export default function App() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'dlq' | 'endpoints' | 'guide'>('inspector');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modals & form state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isNewEndpointOpen, setIsNewEndpointOpen] = useState(false);
  const [testProvider, setTestProvider] = useState<WebhookProvider>('stripe');
  const [testEventType, setTestEventType] = useState('payment_intent.succeeded');
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        id: 'pi_' + Math.random().toString(36).substring(2, 9),
        amount: 8900,
        currency: 'usd',
        customer: 'cus_demo123',
        status: 'succeeded',
      },
      null,
      2,
    ),
  );

  // New endpoint form
  const [newEpName, setNewEpName] = useState('');
  const [newEpTarget, setNewEpTarget] = useState('http://localhost:3000/api/webhooks');
  const [newEpProvider, setNewEpProvider] = useState<WebhookProvider>('stripe');

  // Load from store
  useEffect(() => {
    const loadedEndpoints = getStoredEndpoints();
    const loadedEvents = getStoredEvents();
    setEndpoints(loadedEndpoints);
    setEvents(loadedEvents);
    if (loadedEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(loadedEvents[0].id);
    }
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Replay single event
  const handleReplayEvent = (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const newAttempt = {
      id: 'att_' + Date.now(),
      timestamp: new Date().toISOString(),
      statusCode: 200,
      durationMs: Math.floor(Math.random() * 80) + 25,
      responseBody: JSON.stringify({ replayed: true, received_at: new Date().toISOString() }),
    };

    const updated = events.map((ev) => {
      if (ev.id === eventId) {
        return {
          ...ev,
          status: 'delivered' as const,
          attempts: [newAttempt, ...ev.attempts],
          retryCount: ev.retryCount + 1,
        };
      }
      return ev;
    });

    setEvents(updated);
    saveEvents(updated);
  };

  // Replay all DLQ events
  const handleReplayAllDLQ = () => {
    const updated = events.map((ev) => {
      if (ev.status === 'dead_letter' || ev.status === 'failed') {
        const newAttempt = {
          id: 'att_' + Date.now(),
          timestamp: new Date().toISOString(),
          statusCode: 200,
          durationMs: Math.floor(Math.random() * 60) + 30,
          responseBody: JSON.stringify({ replayed_bulk: true, timestamp: new Date().toISOString() }),
        };
        return {
          ...ev,
          status: 'delivered' as const,
          attempts: [newAttempt, ...ev.attempts],
        };
      }
      return ev;
    });
    setEvents(updated);
    saveEvents(updated);
  };

  // Trigger test webhook
  const handleSendTestWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEndpoint = endpoints.find((ep) => ep.provider === testProvider) || endpoints[0];

    const newEvent: WebhookEvent = {
      id: `evt_${testProvider}_${Math.floor(1000 + Math.random() * 9000)}`,
      endpointId: targetEndpoint.id,
      provider: testProvider,
      eventType: testEventType,
      status: 'delivered',
      destinationUrl: targetEndpoint.destinationUrl,
      headers: {
        'content-type': 'application/json',
        [`x-${testProvider}-signature`]: 'sha256=' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
        'user-agent': `HookRelay-Simulator/1.0 (+https://hookrelay.dev)`,
      },
      payload: testPayload,
      timestamp: new Date().toISOString(),
      signatureVerified: true,
      retryCount: 0,
      maxRetries: 3,
      attempts: [
        {
          id: 'att_' + Date.now(),
          timestamp: new Date().toISOString(),
          statusCode: 200,
          durationMs: Math.floor(Math.random() * 70) + 20,
          responseBody: '{"received": true, "status": "processed"}',
        },
      ],
    };

    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    setSelectedEventId(newEvent.id);
    setIsTestModalOpen(false);
    setActiveTab('inspector');
  };

  // Create new endpoint
  const handleCreateEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEpName.trim()) return;

    const newEp: WebhookEndpoint = {
      id: `ep_${Date.now()}`,
      name: newEpName,
      ingestPath: `wh_live_${Math.random().toString(36).substring(2, 8)}`,
      destinationUrl: newEpTarget,
      secret: `whsec_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 10)}`,
      provider: newEpProvider,
      isActive: true,
      createdAt: new Date().toISOString(),
      totalReceived: 0,
      totalFailed: 0,
    };

    const updated = [newEp, ...endpoints];
    setEndpoints(updated);
    saveEndpoints(updated);
    setIsNewEndpointOpen(false);
    setNewEpName('');
  };

  const dlqCount = events.filter((e) => e.status === 'dead_letter' || e.status === 'failed').length;
  const filteredEvents = events.filter((e) => {
    if (activeTab === 'dlq' && e.status !== 'dead_letter' && e.status !== 'failed') return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (providerFilter !== 'all' && e.provider !== providerFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                HookRelay
              </span>
              <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0-READY
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-mono">Live Ingestion In-Flight</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'inspector' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live Inspector
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-slate-300 font-mono">
              {events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dlq')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'dlq' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Dead-Letter Queue
            {dlqCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono font-bold animate-pulse">
                {dlqCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'endpoints' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Endpoints & Tunnels
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'guide' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Quickstart & SDK
          </button>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            Simulate Webhook
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'inspector' || activeTab === 'dlq' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar: Events List */}
            <div className="w-80 lg:w-96 border-r border-slate-800 bg-slate-900/30 flex flex-col">
              {/* Filter Bar */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Providers</option>
                  <option value="stripe">Stripe</option>
                  <option value="github">GitHub</option>
                  <option value="clerk">Clerk</option>
                  <option value="shopify">Shopify</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="delivered">Delivered (200 OK)</option>
                  <option value="dead_letter">Dead-Letter</option>
                  <option value="retrying">Retrying</option>
                </select>

                {activeTab === 'dlq' && dlqCount > 0 && (
                  <button
                    onClick={handleReplayAllDLQ}
                    className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    title="Retry all failed webhooks"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Replay All
                  </button>
                )}
              </div>

              {/* Event Cards */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No webhooks matched this filter. Click &ldquo;Simulate Webhook&rdquo; to send a test event.
                  </div>
                ) : (
                  filteredEvents.map((ev) => {
                    const isSelected = ev.id === selectedEventId;
                    const latestAttempt = ev.attempts[0];

                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`w-full text-left p-3.5 transition flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-slate-800/70 border-l-4 border-emerald-500'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5 uppercase font-semibold">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                ev.provider === 'stripe'
                                  ? 'bg-indigo-400'
                                  : ev.provider === 'github'
                                  ? 'bg-slate-100'
                                  : ev.provider === 'clerk'
                                  ? 'bg-blue-400'
                                  : 'bg-emerald-400'
                              }`}
                            />
                            {ev.provider}
                          </span>

                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              ev.status === 'delivered'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                                : ev.status === 'dead_letter'
                                ? 'bg-rose-950 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-950 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {latestAttempt ? `${latestAttempt.statusCode} ${latestAttempt.statusCode === 200 ? 'OK' : 'ERR'}` : ev.status}
                          </span>
                        </div>

                        <div className="font-mono text-xs font-semibold text-slate-200 truncate">
                          {ev.eventType}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                          <span>{ev.id}</span>
                          <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Main Pane: Webhook Inspector */}
            {selectedEvent ? (
              <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-6 space-y-6">
                {/* Event Header Banner */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold font-mono text-white">{selectedEvent.eventType}</h2>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          selectedEvent.status === 'delivered'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {selectedEvent.status.toUpperCase()}
                      </span>
                      {selectedEvent.signatureVerified && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <ShieldCheck className="w-4 h-4" />
                          HMAC Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
                      <span>ID: {selectedEvent.id}</span>
                      <span>•</span>
                      <span>Target: {selectedEvent.destinationUrl}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReplayEvent(selectedEvent.id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition active:scale-95 border border-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      Replay to Target
                    </button>

                    <button
                      onClick={() =>
                        copyToClipboard(
                          `curl -X POST "${selectedEvent.destinationUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '${selectedEvent.payload.replace(/'/g, "'\\''")}'`,
                          'curl',
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition border border-slate-700"
                    >
                      {copiedText === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy cURL
                    </button>
                  </div>
                </div>

                {/* Grid for Payload and Attempts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: JSON Payload Viewer */}
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
                        <Code className="w-4 h-4 text-emerald-400" />
                        Payload Body (JSON)
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedEvent.payload, 'payload')}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition"
                      >
                        {copiedText === 'payload' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="mt-3 p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto border border-slate-800/80 max-h-[460px]">
                      {selectedEvent.payload}
                    </pre>
                  </div>

                  {/* Right: Delivery Attempts & Headers */}
                  <div className="space-y-6">
                    {/* Delivery Log History */}
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                      <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          Delivery Attempts ({selectedEvent.attempts.length})
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Retries: {selectedEvent.retryCount}/{selectedEvent.maxRetries}
                        </span>
                      </div>

                      <div className="mt-3 space-y-3">
                        {selectedEvent.attempts.map((att, idx) => (
                          <div
                            key={att.id}
                            className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    att.statusCode === 200 ? 'bg-emerald-400' : 'bg-rose-500'
                                  }`}
                                />
                                Attempt #{selectedEvent.attempts.length - idx}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  att.statusCode === 200
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : 'bg-rose-950 text-rose-400'
                                }`}
                              >
                                {att.statusCode} {att.statusCode === 200 ? 'Delivered' : 'Failed'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400 text-[11px]">
                              <span>Latency: {att.durationMs}ms</span>
                              <span>{new Date(att.timestamp).toLocaleTimeString()}</span>
                            </div>
                            {att.error && <div className="text-rose-400 text-[11px] pt-1">{att.error}</div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Request Headers */}
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                      <div className="pb-3 border-b border-slate-800">
                        <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-emerald-400" />
                          HTTP Request Headers
                        </span>
                      </div>
                      <div className="mt-3 divide-y divide-slate-800/60 font-mono text-xs">
                        {Object.entries(selectedEvent.headers).map(([k, v]) => (
                          <div key={k} className="py-2 flex justify-between gap-4">
                            <span className="text-slate-400 font-semibold">{k}:</span>
                            <span className="text-slate-200 text-right truncate max-w-[280px]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : activeTab === 'endpoints' ? (
          /* Endpoints & Tunnels Tab */
          <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Ingestion Endpoints</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Public webhook URLs provided by HookRelay that forward to your local development environment or production server.
                </p>
              </div>
              <button
                onClick={() => setIsNewEndpointOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                New Endpoint
              </button>
            </div>

            <div className="space-y-4">
              {endpoints.map((ep) => (
                <div
                  key={ep.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white text-base">{ep.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {ep.provider}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-400">Ingest URL:</span>
                      <span className="text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        https://hookrelay.dev/in/{ep.ingestPath}
                      </span>
                      <button
                        onClick={() => copyToClipboard(`https://hookrelay.dev/in/${ep.ingestPath}`, ep.id)}
                        className="p-1 hover:text-white text-slate-400 transition"
                      >
                        {copiedText === ep.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                      <span>Destination:</span>
                      <span className="text-slate-200">{ep.destinationUrl}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
                    <div className="text-right font-mono">
                      <div className="text-xs text-slate-400">Total Ingested</div>
                      <div className="text-lg font-bold text-white">{ep.totalReceived}</div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-xs text-slate-400">Failed / Retried</div>
                      <div className="text-lg font-bold text-rose-400">{ep.totalFailed}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Guide / SDK Tab */
          <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">HookRelay Integration Guide</h2>
              <p className="text-sm text-slate-400 mt-1">
                How to connect HookRelay with Stripe, GitHub, or any custom API in 2 minutes.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  1. HookRelay CLI Tunnel (Local Dev)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Connect your local development server to your public HookRelay ingestion endpoint without configuring router port-forwarding or public tunnels:
                </p>
                <pre className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-slate-200 border border-slate-800">
                  npx hookrelay listen --endpoint wh_live_strp_89f0a2 --to http://localhost:3000/api/webhooks
                </pre>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  2. Node / Next.js Webhook Consumer
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Receive verified webhook events with cryptographic validation:
                </p>
                <pre className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-300 border border-slate-800 overflow-x-auto">
{`import { WebhookReceiver } from '@hookrelay/sdk';

const receiver = new WebhookReceiver({
  secret: process.env.HOOKRELAY_SECRET!
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  // Verify HMAC and process idempotently
  const event = receiver.verify(body, signature);
  console.log('Received verified payment:', event.data.object.id);

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Simulate Webhook Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Simulate Webhook Ingestion
              </h3>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTestWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Provider</label>
                <select
                  value={testProvider}
                  onChange={(e) => {
                    const p = e.target.value as WebhookProvider;
                    setTestProvider(p);
                    if (p === 'stripe') setTestEventType('payment_intent.succeeded');
                    if (p === 'github') setTestEventType('push');
                    if (p === 'clerk') setTestEventType('user.created');
                    if (p === 'shopify') setTestEventType('orders/create');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="stripe">Stripe</option>
                  <option value="github">GitHub</option>
                  <option value="clerk">Clerk</option>
                  <option value="shopify">Shopify</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Event Type</label>
                <input
                  type="text"
                  value={testEventType}
                  onChange={(e) => setTestEventType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">JSON Payload</label>
                <textarea
                  rows={6}
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Dispatch Test Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Endpoint Modal */}
      {isNewEndpointOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Create Ingestion Endpoint
              </h3>
              <button
                onClick={() => setIsNewEndpointOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEndpoint} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Endpoint Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shopify Store Webhooks"
                  value={newEpName}
                  onChange={(e) => setNewEpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Forwarding Destination URL</label>
                <input
                  type="text"
                  value={newEpTarget}
                  onChange={(e) => setNewEpTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Provider Preset</label>
                <select
                  value={newEpProvider}
                  onChange={(e) => setNewEpProvider(e.target.value as WebhookProvider)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="stripe">Stripe</option>
                  <option value="github">GitHub</option>
                  <option value="shopify">Shopify</option>
                  <option value="clerk">Clerk</option>
                  <option value="custom">Custom HTTP Endpoint</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewEndpointOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Create Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
