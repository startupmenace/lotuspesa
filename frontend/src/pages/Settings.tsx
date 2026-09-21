import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, Key, Phone, Server, Save, Loader2, Check } from 'lucide-react';
import { api } from '../lib/api';

interface Config {
  consumerKey: string; consumerSecret: string; shortcode: string; passkey: string;
  initiatorName: string; securityCredential: string; environment: string;
  stkCallbackUrl: string; c2bConfirmationUrl: string; c2bValidationUrl: string;
  b2cResultUrl: string; b2cTimeoutUrl: string;
}

const defaults: Config = { consumerKey:'',consumerSecret:'',shortcode:'',passkey:'',initiatorName:'',securityCredential:'',environment:'sandbox',stkCallbackUrl:'',c2bConfirmationUrl:'',c2bValidationUrl:'',b2cResultUrl:'',b2cTimeoutUrl:'' };

export default function Settings() {
  const [config, setConfig] = useState<Config>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getConfig().then(data => {
      setConfig({
        consumerKey: data.consumerKey || '', consumerSecret: data.consumerSecret || '',
        shortcode: data.shortcode || '', passkey: data.passkey || '',
        initiatorName: data.initiatorName || '', securityCredential: data.securityCredential || '',
        environment: data.environment || 'sandbox',
        stkCallbackUrl: data.stkCallbackUrl || '', c2bConfirmationUrl: data.c2bConfirmationUrl || '',
        c2bValidationUrl: data.c2bValidationUrl || '', b2cResultUrl: data.b2cResultUrl || '',
        b2cTimeoutUrl: data.b2cTimeoutUrl || '',
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.updateConfig(config);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setSaving(false); }
  };

  const u = (f: keyof Config, v: string) => setConfig(p => ({...p, [f]: v}));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="text-sm text-gray-500 mt-1">Configure M-Pesa API credentials</p></div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mpesa-green/10 rounded-lg flex items-center justify-center"><SettingsIcon size={20} className="text-mpesa-dark" /></div>
            <div><h2 className="font-semibold text-gray-900">M-Pesa Configuration</h2>
            <p className="text-sm text-gray-500">Daraja API credentials</p></div>
          </div>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-mpesa-green text-white rounded-lg font-medium hover:bg-mpesa-dark transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}</button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Globe size={20} className="text-gray-500" />
            <div className="flex-1"><label className="block text-sm font-medium text-gray-700">Environment</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="env" value="sandbox" checked={config.environment==='sandbox'} onChange={e=>u('environment',e.target.value)} className="text-mpesa-green" /><span className="text-sm">Sandbox</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="env" value="production" checked={config.environment==='production'} onChange={e=>u('environment',e.target.value)} className="text-mpesa-green" /><span className="text-sm">Production</span></label>
            </div></div></div>

          <div className="space-y-4"><div className="flex items-center gap-3 mb-2"><Key size={16} className="text-gray-500" /><span className="text-sm font-medium text-gray-700">API Credentials</span></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Consumer Key</label>
            <input type="text" value={config.consumerKey} onChange={e=>u('consumerKey',e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green" placeholder="Consumer Key" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Consumer Secret</label>
            <input type="password" value={config.consumerSecret} onChange={e=>u('consumerSecret',e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green" placeholder="Consumer Secret" /></div>
          </div>

          <div className="space-y-4"><div className="flex items-center gap-3 mb-2"><Phone size={16} className="text-gray-500" /><span className="text-sm font-medium text-gray-700">Business Details</span></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Shortcode</label>
              <input type="text" value={config.shortcode} onChange={e=>u('shortcode',e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green" placeholder="174379" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Passkey</label>
              <input type="password" value={config.passkey} onChange={e=>u('passkey',e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green" placeholder="Passkey" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Initiator Name</label>
              <input type="text" value={config.initiatorName} onChange={e=>u('initiatorName',e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green" placeholder="For B2C" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Security Credential</label>
              <input type="password" value={config.securityCredential} onChange={e=>u('securityCredential',e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green" placeholder="Credential" /></div>
            </div>
          </div>

          <div className="space-y-4"><div className="flex items-center gap-3 mb-2"><Server size={16} className="text-gray-500" /><span className="text-sm font-medium text-gray-700">Callback URLs</span></div>
            {[
              {f:'stkCallbackUrl' as const, l:'STK Push Callback'},
              {f:'c2bConfirmationUrl' as const, l:'C2B Confirmation URL'},
              {f:'c2bValidationUrl' as const, l:'C2B Validation URL'},
              {f:'b2cResultUrl' as const, l:'B2C Result URL'},
              {f:'b2cTimeoutUrl' as const, l:'B2C Timeout URL'},
            ].map(({f,l}) => (
              <div key={f}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input type="url" value={config[f]} onChange={e=>u(f,e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green" placeholder="https://" /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}