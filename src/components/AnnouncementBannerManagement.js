import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

// Admin CRUD for the rotating top announcement bar.
const EMPTY_FORM = { message: '', link: '', displayOrder: 0, isActive: true };

const AnnouncementBannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const fetchBanners = async () => {
    try {
      const res = await apiClient.get('/announcements/admin');
      setBanners(res.data);
    } catch (err) {
      console.error('Failed to load banners:', err);
      flash('Failed to load banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (banner) => {
    setEditingId(banner._id);
    setForm({
      message: banner.message,
      link: banner.link || '',
      displayOrder: banner.displayOrder || 0,
      isActive: banner.isActive,
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
        message: form.message,
        link: form.link,
        displayOrder: Number(form.displayOrder),
        isActive: form.isActive,
      };
      if (editingId) {
        await apiClient.put(`/announcements/${editingId}`, payload);
        flash('Banner updated.');
      } else {
        await apiClient.post('/announcements', payload);
        flash('Banner created.');
      }
      resetForm();
      fetchBanners();
    } catch (err) {
      console.error('Save failed:', err);
      flash(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner) => {
    try {
      await apiClient.put(`/announcements/${banner._id}`, { isActive: !banner.isActive });
      fetchBanners();
    } catch (err) {
      flash('Failed to update status.');
    }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await apiClient.delete(`/announcements/${banner._id}`);
      flash('Banner deleted.');
      fetchBanners();
    } catch (err) {
      flash('Delete failed.');
    }
  };

  if (loading) return <div className="p-6">Loading announcement banners...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Announcement Banners</h2>
      <p className="text-sm text-gray-500 -mt-3">These rotate in the green bar at the very top of the site.</p>

      {message && <div className="p-3 rounded-md bg-blue-50 text-blue-800 text-sm">{message}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700">Message</label>
          <input name="message" value={form.message} onChange={handleChange} required
            placeholder="e.g. Subscribe for 3 Months and Save 5%"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Link (optional)</label>
          <input name="link" value={form.link} onChange={handleChange}
            placeholder="/subscribe"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Order</label>
          <input type="number" name="displayOrder" value={form.displayOrder} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500" />
        </div>
        <div className="md:col-span-5 flex items-center gap-2">
          <input type="checkbox" id="bannerActive" name="isActive" checked={form.isActive} onChange={handleChange} className="h-4 w-4" />
          <label htmlFor="bannerActive" className="text-sm text-gray-700">Active</label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving}
            className={`py-2 px-4 rounded-md text-white text-sm font-medium bg-green-600 hover:bg-green-700 ${saving ? 'opacity-70' : ''}`}>
            {editingId ? 'Update' : 'Add Banner'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="py-2 px-4 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200">Cancel</button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Message</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Link</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banners.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-400 text-sm">No banners yet. Add one above or run <code>npm run seed:banners</code>.</td></tr>
            )}
            {banners.map((banner) => (
              <tr key={banner._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{banner.displayOrder}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{banner.message}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{banner.link || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(banner)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right text-sm space-x-3">
                  <button onClick={() => startEdit(banner)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(banner)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnnouncementBannerManagement;
