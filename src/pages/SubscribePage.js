import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

// "Subscribe & Save" checkout. The customer picks products, a delivery
// frequency, and a commitment plan (1/3/6/12 months). Pricing — including the
// discount — is computed server-side and shown live before they pay upfront.
const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "alternate_day", label: "Alternate Day" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const SubscribePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);

  // Selection state
  const [items, setItems] = useState([]); // [{ product, name, size, qty, price }]
  const [pick, setPick] = useState({ productId: "", size: "", qty: 1 });
  const [planType, setPlanType] = useState("daily");
  const [daysOfWeek, setDaysOfWeek] = useState([1, 3, 5]);
  const [deliverySlot, setDeliverySlot] = useState("morning");
  const [startDate, setStartDate] = useState(tomorrowISO());
  const [planId, setPlanId] = useState("");
  const [useWallet, setUseWallet] = useState(false);

  // Delivery details — where the recurring order is taken.
  const [delivery, setDelivery] = useState({ name: "", phone: "", address: "", city: "", postalCode: "" });

  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const pincode = localStorage.getItem("selectedPincode") || "124001";

  // Redirect unauthenticated users to login.
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Prefill name and the saved pincode for convenience.
  useEffect(() => {
    setDelivery((d) => ({
      ...d,
      name: d.name || user?.name || "",
      postalCode: d.postalCode || pincode || "",
    }));
  }, [user, pincode]);

  // Load products, plans, wallet.
  useEffect(() => {
    apiClient.get("/products", { params: { pincode } }).then((res) => {
      setProducts(Array.isArray(res.data) ? res.data : []);
    }).catch(() => setProducts([]));

    apiClient.get("/subscription-plans").then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setPlans(list);
      if (list.length && !planId) setPlanId(list[0]._id);
    }).catch(() => setPlans([]));

    apiClient.get("/wallet").then((res) => {
      setWalletBalance(res.data?.balance || 0);
    }).catch(() => setWalletBalance(0));

    // Prefill delivery details from the saved profile when available.
    apiClient.get("/users/me").then((res) => {
      const u = res.data || {};
      setDelivery((d) => ({
        name: d.name || u.name || "",
        phone: d.phone || u.phone || "",
        address: d.address || u.address?.address || "",
        city: d.city || u.address?.city || "",
        postalCode: d.postalCode || u.address?.postalCode || pincode || "",
      }));
    }).catch(() => { /* keep existing prefill */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);

  // Pre-select a product passed via ?product=<id>.
  useEffect(() => {
    const pid = searchParams.get("product");
    if (pid && products.length) {
      const p = products.find((x) => x._id === pid);
      if (p) setPick((s) => ({ ...s, productId: pid, size: p.variants?.[0]?.size || "" }));
    }
  }, [searchParams, products]);

  const selectedProduct = products.find((p) => p._id === pick.productId);

  const addItem = () => {
    if (!selectedProduct || !pick.size) return;
    const variant = selectedProduct.variants.find((v) => v.size === pick.size);
    if (!variant) return;
    setItems((prev) => {
      // Merge if the same product+size already added.
      const existing = prev.find((it) => it.product === selectedProduct._id && it.size === pick.size);
      if (existing) {
        return prev.map((it) => it === existing ? { ...it, qty: it.qty + Number(pick.qty) } : it);
      }
      return [...prev, {
        product: selectedProduct._id,
        name: selectedProduct.name,
        size: pick.size,
        qty: Number(pick.qty),
        price: variant.price,
      }];
    });
    setPick({ productId: "", size: "", qty: 1 });
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const toggleDay = (d) => {
    setDaysOfWeek((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  };

  // Live price preview whenever the inputs change.
  const refreshPreview = useCallback(async () => {
    setPreviewError("");
    if (!items.length || !planId) {
      setPreview(null);
      return;
    }
    try {
      const res = await apiClient.post("/subscriptions/preview", {
        items: items.map(({ product, size, qty }) => ({ product, size, qty })),
        planId,
        planType,
        daysOfWeek: planType === "weekly" ? daysOfWeek : undefined,
        deliverySlot,
        startDate,
      });
      setPreview(res.data);
    } catch (err) {
      setPreview(null);
      setPreviewError(err.response?.data?.message || "Could not calculate price.");
    }
  }, [items, planId, planType, daysOfWeek, deliverySlot, startDate]);

  useEffect(() => {
    refreshPreview();
  }, [refreshPreview]);

  const handleSubscribe = async () => {
    setFormError("");
    if (!items.length) return setFormError("Please add at least one product.");
    if (!planId) return setFormError("Please choose a commitment plan.");
    if (planType === "weekly" && daysOfWeek.length === 0) return setFormError("Pick at least one delivery day.");
    if (!delivery.name.trim() || !delivery.phone.trim()) return setFormError("Please enter your name and phone number.");
    if (!delivery.address.trim() || !/^\d{6}$/.test(delivery.postalCode.trim())) {
      return setFormError("Please enter a full delivery address with a valid 6-digit pincode.");
    }

    setSubmitting(true);
    try {
      const paymentMethod = useWallet ? "Hybrid" : "Razorpay";
      const deliveryPayload = {
        customerInfo: { name: delivery.name.trim(), phone: delivery.phone.trim() },
        shippingAddress: { address: delivery.address.trim(), city: delivery.city.trim(), postalCode: delivery.postalCode.trim() },
      };
      const res = await apiClient.post("/subscriptions", {
        items: items.map(({ product, size, qty }) => ({ product, size, qty })),
        planId,
        planType,
        daysOfWeek: planType === "weekly" ? daysOfWeek : undefined,
        deliverySlot,
        startDate,
        paymentMethod,
        ...deliveryPayload,
      });

      const { subscription, razorpayOrder, walletPaid } = res.data;

      if (walletPaid || !razorpayOrder) {
        setSubmitting(false);
        setSuccessOpen(true);
        return;
      }

      const options = {
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Rohtak Milk Company",
        description: `${preview?.plan?.name || "Subscription"} (${planType})`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          await apiClient.post(`/subscriptions/${subscription._id}/verify-payment`, response);
          setSubmitting(false);
          setSuccessOpen(true);
        },
        modal: { ondismiss: () => setSubmitting(false) },
        prefill: { email: user?.email, contact: delivery.phone, name: delivery.name },
        theme: { color: "#16a34a" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Subscription failed.");
      setSubmitting(false);
    }
  };

  const money = (n) => `₹${Number(n || 0).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Subscribe &amp; Save</h1>
        <p className="text-gray-500 mb-6">Commit for longer and save more. Fresh milk delivered on your schedule.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-lg mb-4">1. Choose Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Product</label>
                  <select value={pick.productId}
                    onChange={(e) => {
                      const p = products.find((x) => x._id === e.target.value);
                      setPick({ productId: e.target.value, size: p?.variants?.[0]?.size || "", qty: 1 });
                    }}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm">
                    <option value="">Select a product…</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Variant</label>
                  <select value={pick.size} onChange={(e) => setPick((s) => ({ ...s, size: e.target.value }))}
                    disabled={!selectedProduct}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm disabled:bg-gray-50">
                    <option value="">Size…</option>
                    {selectedProduct?.variants?.map((v) => (
                      <option key={v.size} value={v.size}>{v.size} — ₹{v.price}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input type="number" min="1" value={pick.qty}
                    onChange={(e) => setPick((s) => ({ ...s, qty: Math.max(1, Number(e.target.value)) }))}
                    className="w-16 border border-gray-200 rounded-lg p-2 text-sm" />
                  <button onClick={addItem} disabled={!pick.productId || !pick.size}
                    className="flex-1 bg-green-600 text-white rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-40">Add</button>
                </div>
              </div>

              {items.length > 0 && (
                <ul className="mt-4 divide-y divide-gray-100">
                  {items.map((it, idx) => (
                    <li key={idx} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-medium text-gray-800">{it.name} <span className="text-gray-400">({it.size}) × {it.qty}</span></span>
                      <span className="flex items-center gap-3">
                        <span className="text-gray-600">{money(it.price * it.qty)}</span>
                        <button onClick={() => removeItem(idx)} className="text-red-500 hover:underline text-xs">Remove</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Delivery details */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-lg mb-4">2. Delivery Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                  <input value={delivery.name} onChange={(e) => setDelivery((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Recipient name"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                  <input value={delivery.phone} onChange={(e) => setDelivery((d) => ({ ...d, phone: e.target.value.replace(/\D/g, "") }))}
                    maxLength={10} placeholder="10-digit mobile"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Delivery Address</label>
                  <textarea value={delivery.address} onChange={(e) => setDelivery((d) => ({ ...d, address: e.target.value }))}
                    rows={2} placeholder="House / flat, street, area, landmark"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">City</label>
                  <input value={delivery.city} onChange={(e) => setDelivery((d) => ({ ...d, city: e.target.value }))}
                    placeholder="City"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Pincode</label>
                  <input value={delivery.postalCode} onChange={(e) => setDelivery((d) => ({ ...d, postalCode: e.target.value.replace(/\D/g, "") }))}
                    maxLength={6} placeholder="6-digit pincode"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-lg mb-4">3. Delivery Schedule</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {FREQUENCIES.map((f) => (
                  <button key={f.value} onClick={() => setPlanType(f.value)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${planType === f.value ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:border-green-300"}`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {planType === "weekly" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Delivery Days</label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((d) => (
                      <button key={d.value} onClick={() => toggleDay(d.value)}
                        className={`w-12 py-1.5 rounded-lg text-xs font-semibold border ${daysOfWeek.includes(d.value) ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600"}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Time Slot</label>
                  <select value={deliverySlot} onChange={(e) => setDeliverySlot(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm">
                    <option value="morning">Morning (6–9 AM)</option>
                    <option value="evening">Evening (4–8 PM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                  <input type="date" value={startDate} min={tomorrowISO()}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                </div>
              </div>
            </div>

            {/* Commitment plan */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-lg mb-4">4. Commitment Plan</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {plans.map((plan) => (
                  <button key={plan._id} onClick={() => setPlanId(plan._id)}
                    className={`p-3 rounded-xl border text-left transition-all ${planId === plan._id ? "border-green-600 ring-2 ring-green-100 bg-green-50" : "border-gray-200 hover:border-green-300"}`}>
                    <div className="font-bold text-sm text-gray-900">{plan.name}</div>
                    <div className="text-xs text-gray-500">{plan.durationMonths} month{plan.durationMonths === 1 ? "" : "s"}</div>
                    <div className={`text-sm font-extrabold mt-1 ${plan.discountPercentage > 0 ? "text-green-600" : "text-gray-400"}`}>
                      {plan.discountPercentage > 0 ? `Save ${plan.discountPercentage}%` : "No discount"}
                    </div>
                  </button>
                ))}
                {plans.length === 0 && <p className="text-sm text-gray-400 col-span-full">No plans available yet.</p>}
              </div>
            </div>
          </div>

          {/* Right: price summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Summary</h2>

              {previewError && <div className="text-sm text-red-600 mb-3">{previewError}</div>}

              {preview ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Per delivery</span><span>{money(preview.pricing.perDeliveryAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Deliveries (est.)</span><span>{preview.pricing.totalDeliveries}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Original Price</span>
                    <span className={preview.pricing.discountPercentage > 0 ? "line-through text-gray-400" : ""}>
                      {money(preview.pricing.originalPrice)}
                    </span>
                  </div>
                  {preview.pricing.discountPercentage > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Discount ({preview.pricing.discountPercentage}%)</span>
                      <span>− {money(preview.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-extrabold text-gray-900 border-t pt-2 mt-2">
                    <span>Final Price</span><span>{money(preview.pricing.discountedPrice)}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 pt-1">
                    Charged upfront for the {preview.plan.durationMonths}-month commitment.
                  </p>

                  {walletBalance > 0 && (
                    <label className="flex items-center gap-2 mt-3 text-sm text-gray-700">
                      <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} className="h-4 w-4" />
                      Use wallet balance ({money(walletBalance)})
                    </label>
                  )}

                  {formError && (
                    <div className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg p-2">{formError}</div>
                  )}

                  <button onClick={handleSubscribe} disabled={submitting}
                    className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-60">
                    {submitting ? "Processing…" : "Subscribe & Pay"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Add products and choose a plan to see your price.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success modal (replaces the browser alert) */}
      {successOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Subscription Activated!</h3>
            <p className="text-sm text-gray-500 mb-6">
              Thank you for subscribing. Fresh milk will be delivered to your doorstep as scheduled.
            </p>
            <div className="flex gap-3">
              <button onClick={() => navigate("/my-subscriptions")}
                className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl hover:bg-green-700">
                View My Subscriptions
              </button>
            </div>
            <button onClick={() => navigate("/")} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribePage;
