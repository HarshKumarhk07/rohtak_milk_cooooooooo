import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

// Admin CRUD for "Subscribe & Save" commitment plans. Discounts here are the
// single source of truth — the checkout reads them live, nothing is hardcoded.
const EMPTY_FORM = { name: '', durationMonths: 1, discountPercentage: 0, displayOrder: 0, isActive: true };

const SubscriptionPlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const fetchPlans = async () => {
    try {
      const res = await apiClient.get('/subscription-plans/admin');
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to load plans:', err);
      flash('Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (plan) => {
    setEditingId(plan._id);
    setForm({
      name: plan.name,
      durationMonths: plan.durationMonths,
      discountPercentage: plan.discountPercentage,
      displayOrder: plan.displayOrder || 0,
      isActive: plan.isActive,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        durationMonths: Number(form.durationMonths),
        discountPercentage: Number(form.discountPercentage),
        displayOrder: Number(form.displayOrder),
        isActive: form.isActive,
      };
      if (editingId) {
        await apiClient.put(`/subscription-plans/${editingId}`, payload);
        flash('Plan updated.');
      } else {
        await apiClient.post('/subscription-plans', payload);
        flash('Plan created.');
      }
      resetForm();
      fetchPlans();
    } catch (err) {
      console.error('Save failed:', err);
      flash(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan) => {
    try {
      await apiClient.put(`/subscription-plans/${plan._id}`, { isActive: !plan.isActive });
      fetchPlans();
    } catch (err) {
      flash('Failed to update status.');
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/subscription-plans/${plan._id}`);
      flash('Plan deleted.');
      fetchPlans();
    } catch (err) {
      flash('Delete failed.');
    }
  };

  if (loading) return <div className="p-6">Loading subscription plans...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subscription Plans</h2>
      </div>

      {message && (
        <div className="p-3 rounded-md bg-blue-50 text-blue-800 text-sm">{message}</div>
      )}

      {/* Create / Edit form */}
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Plan Name</label>
          <input name="name" value={form.name} onChange={handleChange} required
            placeholder="e.g. Quarterly Plan"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Duration (months)</label>
          <input type="number" name="durationMonths" min="1" value={form.durationMonths} onChange={handleChange} required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
          <input type="number" name="discountPercentage" min="0" max="100" step="0.1" value={form.discountPercentage} onChange={handleChange} required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Display Order</label>
          <input type="number" name="displayOrder" value={form.displayOrder} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500" />
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <input type="checkbox" id="planActive" name="isActive" checked={form.isActive} onChange={handleChange} className="h-4 w-4" />
          <label htmlFor="planActive" className="text-sm text-gray-700">Active</label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving}
            className={`py-2 px-4 rounded-md text-white text-sm font-medium bg-green-600 hover:bg-green-700 ${saving ? 'opacity-70' : ''}`}>
            {editingId ? 'Update Plan' : 'Create Plan'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="py-2 px-4 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Plans table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Discount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400 text-sm">No plans yet. Create one above or run <code>npm run seed:plans</code>.</td></tr>
            )}
            {plans.map((plan) => (
              <tr key={plan._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{plan.displayOrder}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{plan.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{plan.durationMonths} month{plan.durationMonths === 1 ? '' : 's'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{plan.discountPercentage}%</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(plan)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right text-sm space-x-3">
                  <button onClick={() => startEdit(plan)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(plan)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionPlanManagement;
