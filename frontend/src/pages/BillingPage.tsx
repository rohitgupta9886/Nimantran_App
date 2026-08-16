import React, { useEffect, useState } from 'react';
import { Sparkles, Check, ArrowRight, CreditCard, History } from 'lucide-react';
import { apiFetch } from '../services/api';

export const BillingPage: React.FC = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/credits'),
      apiFetch<any[]>('/credits/transactions'),
    ])
      .then(([wRes, tRes]) => {
        setWallet(wRes.data);
        setTxs(tRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBuyCredits = async (packageCode: string) => {
    try {
      const res = await apiFetch<any>('/credits/purchase', {
        method: 'POST',
        body: JSON.stringify({ package_code: packageCode }),
      });
      setWallet(res.data);
      alert('AI Credits purchased successfully!');
    } catch (err: any) {
      alert(err.message || 'Purchase failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Wallet Balance Hero */}
      <div className="glass-panel p-8 rounded-3xl gold-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase">
            <Sparkles className="w-4 h-4" /> AI Credit Balance
          </div>
          <div className="font-serif text-5xl font-bold gold-gradient-text">{wallet?.balance ?? 2450} Credits</div>
          <p className="text-slate-400 text-xs">
            Normal platform features do not consume AI credits. AI Wording, Story, Quotes & Reels consume credits.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="#packages"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-sm shadow-md"
          >
            Buy Credit Package
          </a>
        </div>
      </div>

      {/* Credit Package Cards */}
      <div id="packages" className="space-y-6">
        <h2 className="font-serif text-3xl font-bold gold-gradient-text text-center">Top-up AI Credit Packages</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { code: '500_CREDITS', amount: '500 AI Credits', price: '₹99', desc: 'Ideal for single wedding invitation wording & story' },
            { code: '2000_CREDITS', amount: '2,000 AI Credits', price: '₹299', desc: 'Popular for full event storytelling, quotes & guest AI cleanup' },
            { code: '5000_CREDITS', amount: '5,000 AI Credits', price: '₹599', desc: 'Best value for multi-event wedding planners' },
          ].map((pkg) => (
            <div key={pkg.code} className="glass-panel p-8 rounded-3xl gold-border space-y-6 text-center hover:border-amber-400 transition-colors">
              <div className="text-amber-400 font-serif text-2xl font-bold">{pkg.amount}</div>
              <div className="font-serif text-4xl font-extrabold text-white">{pkg.price}</div>
              <p className="text-xs text-slate-400">{pkg.desc}</p>
              <button
                onClick={() => handleBuyCredits(pkg.code)}
                className="w-full py-3 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-500/40 hover:bg-amber-500/30"
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="glass-panel p-8 rounded-3xl gold-border space-y-6">
        <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-amber-400" /> Immutable Double-Entry Credit Ledger
        </h3>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#140005] border-b border-amber-500/20 text-amber-300 font-serif">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Type</th>
              <th className="p-4">Description</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Balance After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-500/10 text-slate-300">
            {txs.map((t) => (
              <tr key={t.id}>
                <td className="p-4 font-mono text-slate-400">{new Date(t.created_at).toLocaleString('en-IN')}</td>
                <td className="p-4 font-bold text-amber-400">{t.transaction_type}</td>
                <td className="p-4">{t.description}</td>
                <td className={`p-4 font-mono font-bold ${t.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.amount > 0 ? `+${t.amount}` : t.amount}
                </td>
                <td className="p-4 font-mono font-bold text-white">{t.balance_after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
