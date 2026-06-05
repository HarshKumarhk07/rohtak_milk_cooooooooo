import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

// Customer profile: edit name, phone and a saved default delivery address.
const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: { address: "", city: "", postalCode: "" },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    apiClient.get("/users/me")
      .then((res) => {
        const u = res.data || {};
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          address: {
            address: u.address?.address || "",
            city: u.address?.city || "",
            postalCode: u.address?.postalCode || "",
          },
        });
      })
      .catch(() => setError("Could not load your profile."))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const setAddr = (key, value) => setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (form.address.postalCode && !/^\d{6}$/.test(form.address.postalCode)) {
      return setError("Pincode must be 6 digits.");
    }
    setSaving(true);
    try {
      await apiClient.put("/users/me", {
        name: form.name,
        phone: form.phone,
        address: form.address,
      });
      setMessage("Profile saved successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading profile…</div>;

  const input = "w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-6">My Profile</h1>

        {message && <div className="mb-4 p-3 rounded-md bg-green-50 text-green-800 text-sm">{message}</div>}
        {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}

        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {/* Account */}
          <div>
            <h2 className="font-bold text-lg mb-3">Account Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={input} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                <input value={form.email} disabled className={`${input} bg-gray-50 text-gray-500`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                <input value={form.phone} maxLength={10}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                  placeholder="10-digit mobile" className={input} />
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="border-t border-gray-100 pt-6">
            <h2 className="font-bold text-lg mb-1">Delivery Address</h2>
            <p className="text-xs text-gray-400 mb-3">Used to prefill your subscription & order checkout.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Address</label>
                <textarea value={form.address.address} onChange={(e) => setAddr("address", e.target.value)}
                  rows={2} placeholder="House / flat, street, area, landmark" className={input} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">City</label>
                <input value={form.address.city} onChange={(e) => setAddr("city", e.target.value)} placeholder="City" className={input} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Pincode</label>
                <input value={form.address.postalCode} maxLength={6}
                  onChange={(e) => setAddr("postalCode", e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit pincode" className={input} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="bg-green-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-green-700 disabled:opacity-60">
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
