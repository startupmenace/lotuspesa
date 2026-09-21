import { useState } from 'react';
import { BookOpen, Copy, Check, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

interface Endpoint { method: string; path: string; description: string; body?: string; response?: string; }
interface EndpointGroup { title: string; description: string; endpoints: Endpoint[]; }

const endpointGroups: EndpointGroup[] = [
  {
    title: "STK Push (Online Payment)",
    description: "Send a payment prompt to customer phone.",
    endpoints: [
      { method: "POST", path: "/api/mpesa/stk/push", description: "Initiate STK push.",
        body: "{\n  \"amount\": 1500,\n  \"phoneNumber\": \"254712345678\",\n  \"accountReference\": \"DEVICE-001\",\n  \"transactionDesc\": \"Device rental\"\n}",
        response: "{\n  \"ResponseCode\": \"0\",\n  \"CustomerMessage\": \"Success\"\n}",
      },
      { method: "GET", path: "/api/mpesa/stk/query/:checkoutRequestId", description: "Query STK status.",
        response: "{\n  \"ResultCode\": \"0\",\n  \"ResultDesc\": \"Processed\"\n}",
      },
      { method: "POST", path: "/api/mpesa/stk/callback", description: "Safaricom calls this automatically.",
      },
    ],
  },
  {
    title: "C2B Register URL (Offline Payment)",
    description: "Register URLs to receive payment notifications.",
    endpoints: [
      { method: "POST", path: "/api/mpesa/c2b/register", description: "Register URLs with Safaricom.",
        response: "{\n  \"ResponseCode\": \"0\"\n}",
      },
      { method: "POST", path: "/api/mpesa/c2b/confirmation", description: "Safaricom calls after C2B payment.",
      },
      { method: "POST", path: "/api/mpesa/c2b/validation", description: "Optional payment validation.",
      },
    ],
  },
  {
    title: "B2C Refund (Device Return)",
    description: "50% refund when device returned within 1 hour.",
    endpoints: [
      { method: "POST", path: "/api/mpesa/b2c/refund", description: "Issue 50% refund.",
        body: "{\n  \"transactionId\": \"uuid\"\n}",
        response: "{\n  \"amount\": 750,\n  \"status\": \"processing\"\n}",
      },
      { method: "POST", path: "/api/mpesa/b2c/refund/api", description: "For external automation.",
      },
      { method: "POST", path: "/api/mpesa/b2c/result", description: "B2C result callback.",
      },
      { method: "POST", path: "/api/mpesa/b2c/timeout", description: "B2C timeout callback.",
      },
    ],
  },
  {
    title: "Dashboard",
    description: "Monitoring endpoints. Require x-api-key header.",
    endpoints: [
      { method: "GET", path: "/api/dashboard/stats", description: "Summary stats.",
        response: "{\n  \"totalTransactions\": 156,\n  \"successRate\": \"89.7\"\n}",
      },
      { method: "GET", path: "/api/dashboard/transactions?page=1&status=completed", description: "List with filters.",
      },
      { method: "GET", path: "/api/dashboard/transactions/:id", description: "Transaction detail.",
      },
      { method: "GET", path: "/api/dashboard/refunds", description: "List refunds.",
      },
      { method: "GET", path: "/api/dashboard/stream", description: "SSE live feed.",
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const h = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (<button onClick={h} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    {copied ? "Copied" : "Copy"}</button>);
}

function EndpointCard({ method, path, description, body, response }: Endpoint) {
  const [open, setOpen] = useState(false);
  const mc: Record<string, string> = { GET: "bg-green-100 text-green-700", POST: "bg-blue-100 text-blue-700" };
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
        <span className={"px-2 py-0.5 rounded text-xs font-bold " + (mc[method] || "bg-gray-100")}>{method}</span>
        <code className="text-sm font-mono text-gray-800 flex-1">{path}</code>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="px-4 pb-4 border-t pt-3 space-y-3">
        <p className="text-sm text-gray-600">{description}</p>
        {body && <div><div className="flex justify-between mb-1"><span className="text-xs text-gray-500 uppercase">Request Body</span><CopyButton text={body} /></div><pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto">{body}</pre></div>}
        {response && <div><div className="flex justify-between mb-1"><span className="text-xs text-gray-500 uppercase">Response</span><CopyButton text={response} /></div><pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto">{response}</pre></div>}
      </div>}
    </div>);
}

const RC = [
  { code: "0", meaning: "Success", description: "Transaction processed successfully." },
  { code: "1032", meaning: "Cancelled", description: "Customer cancelled the prompt." },
  { code: "1037", meaning: "Timeout", description: "Customer did not enter PIN." },
  { code: "1", meaning: "Insufficient", description: "Insufficient balance." },
  { code: "2001", meaning: "Wrong PIN", description: "Wrong M-Pesa PIN." },
  { code: "2026", meaning: "Blocked", description: "Account has debit block." },
];

export default function Docs() {
  const [t, setT] = useState("endpoints");
  return (<div className="space-y-6 max-w-4xl">
    <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BookOpen size={24} />API Documentation</h1>
    <p className="text-sm text-gray-500 mt-1">M-Pesa Daraja API integration reference</p></div>
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
      {["endpoints","errors","setup"].map(tab => (<button key={tab} onClick={() => setT(tab)} className={"px-4 py-2 rounded-md text-sm font-medium capitalize " + (t===tab?"bg-white shadow-sm":"text-gray-500")}>{tab==="endpoints"?"Endpoints":tab==="errors"?"Error Codes":"Setup Guide"}</button>))}
    </div>
    {t==="endpoints" && <div className="space-y-8">
      {endpointGroups.map(g => <div key={g.title}><h2 className="text-lg font-semibold mb-1">{g.title}</h2><p className="text-sm text-gray-500 mb-4">{g.description}</p><div className="space-y-2">{g.endpoints.map(ep => <EndpointCard key={ep.method+ep.path} {...ep} />)}</div></div>)}</div>}
    {t==="errors" && <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><table className="min-w-full divide-y"><thead className="bg-gray-50"><tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meaning</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th></tr></thead>
      <tbody className="divide-y">{RC.map(r => <tr key={r.code} className="hover:bg-gray-50"><td className="px-6 py-3 font-mono text-sm font-bold">{r.code}</td><td className="px-6 py-3 text-sm font-medium">{r.meaning}</td><td className="px-6 py-3 text-sm text-gray-500">{r.description}</td></tr>)}</tbody></table></div>}
    {t==="setup" && <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border"><h3 className="font-semibold mb-4">1. Get Safaricom Credentials</h3><ol className="space-y-3 text-sm text-gray-600">
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-green text-white rounded-full flex items-center justify-center text-xs font-bold">1</span><span>Go to developer.safaricom.co.ke</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-green text-white rounded-full flex items-center justify-center text-xs font-bold">2</span><span>Sign up for free</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-green text-white rounded-full flex items-center justify-center text-xs font-bold">3</span><span>Create app, select Sandbox</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-green text-white rounded-full flex items-center justify-center text-xs font-bold">4</span><span>Copy Consumer Key, Secret, Shortcode, Passkey</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-green text-white rounded-full flex items-center justify-center text-xs font-bold">5</span><span>Paste in Settings or backend/.env</span></li>
</ol></div>
      <div className="bg-white rounded-xl p-6 shadow-sm border"><h3 className="font-semibold mb-4">2. Test Phone Numbers</h3><div className="bg-gray-50 rounded-lg p-4 font-mono text-sm"><p className="text-xs text-gray-500 mb-2">Safaricom Test Numbers:</p><p>254708374149</p><p>254711890523</p><p>254712928340</p><p className="text-xs text-gray-500 mt-2">Default PIN: 1234 or 0000</p></div></div>
      <div className="bg-white rounded-xl p-6 shadow-sm border"><h3 className="font-semibold mb-4">3. Callback URLs (Local Dev)</h3><div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono"><p className="text-gray-500"># Start ngrok</p><p>ngrok http 3000</p><p className="text-gray-500 mt-2"># Update .env with HTTPS URL</p></div></div>
      <div className="bg-white rounded-xl p-6 shadow-sm border"><h3 className="font-semibold mb-4">4. Refund Flow</h3><ol className="space-y-3 text-sm text-gray-600">
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span><span>Go to Transactions, find original payment</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span><span>Click transaction to open details</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span><span>Click Issue 50% Refund button</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span><span>System sends B2C payment to customer</span></li>
</ol></div>
      <div className="bg-white rounded-xl p-6 shadow-sm border"><h3 className="font-semibold mb-4">5. Going Live</h3><ol className="space-y-3 text-sm text-gray-600">
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-dark text-white rounded-full flex items-center justify-center text-xs font-bold">1</span><span>Register for production on Daraja</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-dark text-white rounded-full flex items-center justify-center text-xs font-bold">2</span><span>Create production app, wait for approval</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-dark text-white rounded-full flex items-center justify-center text-xs font-bold">3</span><span>Switch MPESA_ENVIRONMENT=production</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-dark text-white rounded-full flex items-center justify-center text-xs font-bold">4</span><span>Update production credentials</span></li>
<li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 bg-mpesa-dark text-white rounded-full flex items-center justify-center text-xs font-bold">5</span><span>Ensure callback URLs use HTTPS</span></li>
</ol></div>
    </div>}
  </div>);
}