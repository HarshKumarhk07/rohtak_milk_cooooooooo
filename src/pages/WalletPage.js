import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import apiClient from "../services/apiClient";
import LoadingSpinner from "../components/LoadingSpinner";
import { FaWallet, FaArrowDown, FaArrowUp } from "react-icons/fa";

const REASON_LABELS = {
  ORDER_CANCELLATION_REFUND: "Refund — Order Cancelled",
  ORDER_PAYMENT: "Order Payment",
  ORDER_PAYMENT_PARTIAL: "Order Payment (Partial)",
};

const formatReason = (reason) => REASON_LABELS[reason] || reason;

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data } = await apiClient.get("/wallet");
        setWallet(data);
      } catch (err) {
        console.error("Failed to load wallet:", err);
        setError("Could not load your wallet. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="text-center text-red-500 mt-10">{error}</div>;

  const { balance = 0, totalCredits = 0, totalDebits = 0, transactions = [] } = wallet || {};

  return (
    <div className="bg-gray-100 min-h-screen container mx-auto px-4 py-6 md:py-12">
      <h1 className="text-2xl md:text-4xl font-extrabold mb-6 md:mb-8 text-center text-gray-800">
        My Wallet
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <FaWallet className="w-7 h-7 mb-2 opacity-90" />
          <p className="text-xs uppercase tracking-widest opacity-90">Current Balance</p>
          <p className="text-3xl font-black mt-1">₹{balance}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border border-green-100">
          <FaArrowDown className="w-6 h-6 mb-2 text-green-600" />
          <p className="text-xs uppercase tracking-widest text-gray-500">Total Credits</p>
          <p className="text-2xl font-extrabold text-green-700 mt-1">₹{totalCredits}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border border-red-100">
          <FaArrowUp className="w-6 h-6 mb-2 text-red-500" />
          <p className="text-xs uppercase tracking-widest text-gray-500">Total Debits</p>
          <p className="text-2xl font-extrabold text-red-600 mt-1">₹{totalDebits}</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Transaction History</h2>

        {transactions.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <FaWallet className="mx-auto w-12 h-12 text-gray-200 mb-3" />
            <p>No wallet transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((txn) => {
              const isCredit = txn.type === "CREDIT";
              return (
                <div key={txn._id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCredit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                      }`}
                    >
                      {isCredit ? <FaArrowDown /> : <FaArrowUp />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm md:text-base truncate">
                        {formatReason(txn.reason)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {moment(txn.createdAt).format("MMM Do YYYY, h:mm a")}
                        {txn.order?.orderNumber && (
                          <>
                            {" · "}
                            <Link to="/myorders" className="text-green-600 hover:underline">
                              #{txn.order.orderNumber}
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-extrabold ${isCredit ? "text-green-600" : "text-red-500"}`}>
                      {isCredit ? "+" : "−"}₹{txn.amount}
                    </p>
                    <p className="text-[11px] text-gray-400">Bal: ₹{txn.balanceAfter}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
