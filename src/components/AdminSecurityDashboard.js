import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

const EVENT_TYPES = [
  'FAILED_LOGIN',
  'ACCOUNT_LOCKED',
  'PASSWORD_RESET',
  'SUCCESSFUL_LOGIN',
  'PASSKEY_FAILURE',
  'PASSKEY_LOCK',
  'ACCOUNT_UNLOCKED',
];

const EVENT_BADGE = {
  FAILED_LOGIN: 'bg-amber-100 text-amber-700',
  ACCOUNT_LOCKED: 'bg-red-100 text-red-700',
  PASSWORD_RESET: 'bg-blue-100 text-blue-700',
  SUCCESSFUL_LOGIN: 'bg-green-100 text-green-700',
  PASSKEY_FAILURE: 'bg-amber-100 text-amber-700',
  PASSKEY_LOCK: 'bg-red-100 text-red-700',
  ACCOUNT_UNLOCKED: 'bg-indigo-100 text-indigo-700',
};

const fmtRemaining = (ms) => {
  if (!ms || ms <= 0) return '—';
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const AdminSecurityDashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin-security/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const params = {};
      if (filterEmail) params.email = filterEmail;
      if (filterEvent) params.eventType = filterEvent;
      const res = await apiClient.get('/admin-security/logs', { params });
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }, [filterEmail, filterEvent]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchAccounts(), fetchLogs()]);
      setLoading(false);
    })();
  }, [fetchAccounts, fetchLogs]);

  const handleUnlock = async (account) => {
    if (!window.confirm(`Unlock ${account.email}? This clears all failed attempts and lock escalation.`)) return;
    try {
      await apiClient.post(`/admin-security/unlock/${account._id}`);
      flash(`Unlocked ${account.email}.`);
      fetchAccounts();
      fetchLogs();
    } catch (err) {
      flash(err.response?.data?.message || 'Unlock failed.');
    }
  };

  if (loading) return <div className="p-6">Loading security dashboard...</div>;

  const lockedCount = accounts.filter((a) => a.isLocked).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Admin Security</h2>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">{accounts.length} admin{accounts.length === 1 ? '' : 's'}</span>
          <span className={`px-3 py-1 rounded-full ${lockedCount ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {lockedCount} locked
          </span>
        </div>
      </div>

      {message && <div className="p-3 rounded-md bg-blue-50 text-blue-800 text-sm">{message}</div>}

      {/* Admin accounts + lock status */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Admin Accounts</h3>
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Failed Attempts</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lock Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.failedAttempts}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.lockLevel}</td>
                  <td className="px-4 py-3 text-sm">
                    {a.isLocked ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                        Locked · {fmtRemaining(a.remainingMs)}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleUnlock(a)}
                      disabled={!a.isLocked && a.lockLevel === 0 && a.failedAttempts === 0}
                      className="text-sm text-indigo-600 hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      Unlock / Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security logs */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h3 className="text-lg font-semibold">Security Logs</h3>
          <div className="flex gap-2">
            <input
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              placeholder="Filter by email"
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
            <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="border border-gray-300 rounded-md p-2 text-sm">
              <option value="">All events</option>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={fetchLogs} className="px-3 py-2 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-700">Apply</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lvl</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 && (
                <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400 text-sm">No security events recorded.</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${EVENT_BADGE[log.eventType] || 'bg-gray-100 text-gray-600'}`}>
                      {log.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{log.email || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{log.lockLevel || 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={log.userAgent || ''}>{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurityDashboard;
