import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

const STATUS_BADGE = {
  active: "bg-green-100 text-green-700",
  pending_payment: "bg-amber-100 text-amber-700",
  paused: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
  completed: "bg-indigo-100 text-indigo-700",
};

const FREQ_LABEL = {
  daily: "Daily",
  alternate_day: "Alternate Day",
  weekly: "Weekly",
  monthly: "Monthly",
  custom: "Custom",
};

const MySubscriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    apiClient.get("/subscriptions/mine")
      .then((res) => setSubs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const money = (n) => `₹${Number(n || 0).toFixed(2)}`;
  const date = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading subscriptions…</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-gray-900">My Subscriptions</h1>
          <Link to="/subscribe" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">+ New Subscription</Link>
        </div>

        {subs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-gray-500 mb-4">You don't have any subscriptions yet.</p>
            <Link to="/subscribe" className="text-green-600 font-bold hover:underline">Start a Subscribe &amp; Save plan →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subs.map((s) => (
              <div key={s._id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{s.subscriptionPlan?.name || "Subscription"}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status] || "bg-gray-100 text-gray-500"}`}>
                        {s.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {FREQ_LABEL[s.planType] || s.planType} · {s.deliverySlot} · starts {date(s.startDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-gray-900">{money(s.pricing?.discountedPrice)}</div>
                    {s.pricing?.discountPercentage > 0 && (
                      <div className="text-xs text-green-600 font-semibold">{s.pricing.discountPercentage}% saved</div>
                    )}
                  </div>
                </div>

                <ul className="mt-3 text-sm text-gray-600 list-disc list-inside">
                  {(s.items || []).map((it, i) => (
                    <li key={i}>{it.product?.name || "Product"} ({it.variantId}) × {it.qty}</li>
                  ))}
                </ul>

                <div className="mt-3 text-xs text-gray-400">
                  <span>Next delivery: {date(s.nextDeliveryDate)} · Ends: {date(s.endDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubscriptionsPage;
