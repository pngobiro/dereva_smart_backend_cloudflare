'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Payment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string | null;
  mpesaReceiptNumber: string | null;
  phoneNumber: string;
  status: string;
  subscriptionType: string;
  subscriptionMonths: number | null;
  createdAt: number;
  completedAt: number | null;
}

interface WeeklyStats {
  week: string;
  amount: number;
  count: number;
}

interface MonthlyStats {
  month: string;
  amount: number;
  count: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'SUPER_ADMIN') {
        router.push('/');
        return;
      }
    }
    loadPayments();
  }, [router]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      // Use direct fetch with auth
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dereva-smart-backend.pngobiro.workers.dev';
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${apiUrl}/api/admin/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'completed' && payment.status.toUpperCase() === 'COMPLETED') ||
      (filter === 'pending' && payment.status.toUpperCase() === 'PENDING') ||
      (filter === 'failed' && payment.status.toUpperCase() === 'FAILED');

    const matchesSearch =
      searchTerm === '' ||
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.phoneNumber.includes(searchTerm) ||
      (payment.transactionId && payment.transactionId.includes(searchTerm)) ||
      (payment.mpesaReceiptNumber && payment.mpesaReceiptNumber.includes(searchTerm));

    return matchesFilter && matchesSearch;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const upperStatus = status.toUpperCase();
    const styles = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[upperStatus as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {upperStatus}
      </span>
    );
  };

  const totalRevenue = payments
    .filter((p) => p.status.toUpperCase() === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculate time-based stats
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const getFilteredPayments = () => {
    const completed = payments.filter((p) => p.status.toUpperCase() === 'COMPLETED');
    if (timeRange === 'week') {
      return completed.filter((p) => p.completedAt && p.completedAt >= oneWeekAgo);
    } else if (timeRange === 'month') {
      return completed.filter((p) => p.completedAt && p.completedAt >= oneMonthAgo);
    }
    return completed;
  };

  const timeFilteredPayments = getFilteredPayments();
  const timeFilteredRevenue = timeFilteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // Group by week
  const getWeeklyStats = (): WeeklyStats[] => {
    const weekMap = new Map<string, { amount: number; count: number }>();
    const completed = payments.filter((p) => p.status.toUpperCase() === 'COMPLETED' && p.completedAt);

    completed.forEach((payment) => {
      const date = new Date(payment.completedAt!);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weekMap.get(weekKey) || { amount: 0, count: 0 };
      weekMap.set(weekKey, {
        amount: existing.amount + payment.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(weekMap.entries())
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
      .slice(0, 8);
  };

  // Group by month
  const getMonthlyStats = (): MonthlyStats[] => {
    const monthMap = new Map<string, { amount: number; count: number }>();
    const completed = payments.filter((p) => p.status.toUpperCase() === 'COMPLETED' && p.completedAt);

    completed.forEach((payment) => {
      const date = new Date(payment.completedAt!);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = monthMap.get(monthKey) || { amount: 0, count: 0 };
      monthMap.set(monthKey, {
        amount: existing.amount + payment.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
      .slice(0, 12);
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading payments...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">💳 Payments</h1>
        <p className="text-gray-600 mt-2">View and manage payment transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Total Revenue (All Time)</div>
          <div className="text-2xl font-bold text-gray-900">
            KES {totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {payments.filter((p) => p.status.toUpperCase() === 'COMPLETED').length} transactions
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">
            {timeRange === 'week' ? 'Last 7 Days' : timeRange === 'month' ? 'Last 30 Days' : 'All Time'}
          </div>
          <div className="text-2xl font-bold text-green-600">
            KES {timeFilteredRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {timeFilteredPayments.length} transactions
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {payments.filter((p) => p.status.toUpperCase() === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-600">
            {payments.filter((p) => p.status.toUpperCase() === 'FAILED').length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Revenue</h3>
          <div className="space-y-3">
            {weeklyStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm text-gray-600">{stat.week}</div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">{stat.count} txns</div>
                  <div className="font-medium text-gray-900">
                    KES {stat.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="space-y-3">
            {monthlyStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm text-gray-600">{stat.month}</div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">{stat.count} txns</div>
                  <div className="font-medium text-gray-900">
                    KES {stat.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by name, phone, transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Failed
        </button>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/users/${payment.userId}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <div className="font-medium">{payment.userName}</div>
                      <div className="text-sm text-gray-500">{payment.phoneNumber}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{payment.paymentMethod}</div>
                  </td>
                  <td className="px-6 py-4">
                    {payment.mpesaReceiptNumber ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.mpesaReceiptNumber}
                        </div>
                        <div className="text-xs text-gray-500">{payment.transactionId}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {payment.transactionId || 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{payment.subscriptionType}</div>
                    {payment.subscriptionMonths && (
                      <div className="text-xs text-gray-500">
                        {payment.subscriptionMonths} months
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(payment.createdAt)}</div>
                    {payment.completedAt && (
                      <div className="text-xs text-gray-500">
                        Completed: {formatDate(payment.completedAt)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredPayments.length} of {payments.length} users
      </div>
    </div>
  );
}
