import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

// Admin view of every customer subscription, including the delivery address so
// staff/delivery partners know exactly where to take the recurring order.
const STATUS_BADGE = {
  active: 'bg-green-100 text-green-700',
  pending_payment: 'bg-amber-100 text-amber-700',
  paused: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-indigo-100 text-indigo-700',
};

const FREQ_LABEL = {
  daily: 'Daily', alternate_day: 'Alternate Day', weekly: 'Weekly', monthly: 'Monthly', custom: 'Custom',
};

const SubscriptionManagement = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get('/subscriptions')
      .then((res) => setSubs(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('Failed to load subscriptions:', err))
      .finally(() => setLoading(false));
  }, []);

  const money = (n) => `₹${Number(n || 0).toFixed(2)}`;
  const date = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  // The address/phone stored on the subscription is a snapshot taken at
  // checkout. Older subscriptions (created before address capture) have none, so
  // fall back to the customer's saved profile so admins always see *somewhere*
  // to deliver.
  const resolveAddr = (s) => {
    const a = s.shippingAddress || {};
    const pa = s.user?.address || {};
    return {
      address: a.address || pa.address || '',
      city: a.city || pa.city || '',
      postalCode: a.postalCode || pa.postalCode || '',
    };
  };
  const resolvePhone = (s) => s.customerInfo?.phone || s.user?.phone || '';

  const filtered = subs.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const addr = resolveAddr(s);
      const hay = [
        s.customerInfo?.name, resolvePhone(s), s.user?.name, s.user?.email,
        addr.address, addr.postalCode,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (loading) return <div className="p-6">Loading subscriptions...</div>;

  const activeCount = subs.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Customer Subscriptions</h2>
        <div className="flex gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">{subs.length} total</span>
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">{activeCount} active</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, address, pincode…"
          className="border border-gray-300 rounded-md p-2 text-sm flex-1 min-w-[220px]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md p-2 text-sm">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending_payment">Pending payment</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-400 text-sm">No subscriptions found.</div>
        )}
        {filtered.map((s) => (
          <div key={s._id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              {/* Customer + delivery address */}
              <div className="min-w-[220px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{s.customerInfo?.name || s.user?.name || 'Customer'}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status] || 'bg-gray-100 text-gray-500'}`}>
                    {String(s.status).replace('_', ' ')}
                  </span>
                </div>
                {(() => {
                  const addr = resolveAddr(s);
                  const usingProfile = !s.shippingAddress?.address && !!s.user?.address?.address;
                  return (
                    <>
                      <div className="text-sm text-gray-600 mt-0.5">📞 {resolvePhone(s) || '—'}</div>
                      <div className="text-sm text-gray-600">✉️ {s.user?.email || '—'}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        📍 {addr.address || '—'}
                        {addr.city ? `, ${addr.city}` : ''}
                        {addr.postalCode ? ` - ${addr.postalCode}` : ''}
                        {usingProfile && <span className="ml-1 text-[10px] text-gray-400">(from profile)</span>}
                      </div>
                    </>
                  );
                })()}
                {s.customerLocation?.latitude && (
                  <a
                    href={`https://www.google.com/maps?q=${s.customerLocation.latitude},${s.customerLocation.longitude}`}
                    target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Open map pin →
                  </a>
                )}
              </div>

              {/* Schedule + items */}
              <div className="min-w-[200px] text-sm">
                <div className="font-semibold text-gray-800">{s.subscriptionPlan?.name || 'Plan'} · {FREQ_LABEL[s.planType] || s.planType}</div>
                <div className="text-gray-500">{s.deliverySlot} slot · starts {date(s.startDate)}</div>
                <div className="text-gray-500">Next: {date(s.nextDeliveryDate)} · Ends: {date(s.endDate)}</div>
                <ul className="mt-1 text-gray-600 list-disc list-inside">
                  {(s.items || []).map((it, i) => (
                    <li key={i}>{it.product?.name || 'Product'} ({it.variantId}) × {it.qty}</li>
                  ))}
                </ul>
              </div>

              {/* Price + payment */}
              <div className="text-right min-w-[120px]">
                <div className="text-lg font-extrabold text-gray-900">{money(s.pricing?.discountedPrice)}</div>
                {s.pricing?.discountPercentage > 0 && (
                  <div className="text-xs text-green-600 font-semibold">{s.pricing.discountPercentage}% off</div>
                )}
                <div className="text-[11px] text-gray-400 mt-1">
                  {s.payment?.method || '—'} · {s.payment?.status || 'pending'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
