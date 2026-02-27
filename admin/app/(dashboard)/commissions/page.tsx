'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Commission {
  id: string;
  schoolId: string;
  schoolName: string;
  paymentId: string;
  userId: string;
  userName: string;
  paymentAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  paidAt: number | null;
  createdAt: number;
}

interface SchoolCommissionSummary {
  schoolId: string;
  schoolName: string;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  studentCount: number;
  commissionRate: number;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<SchoolCommissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('pending');

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const [commissionsRes, summaryRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/commissions`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/commissions/summary`),
      ]);

      const commissionsData = await commissionsRes.json();
      const summaryData = await summaryRes.json();

      setCommissions(commissionsData.commissions || []);
      setSummary(summaryData.summary || []);
    } catch (err) {
      console.error('Failed to load commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (commissionId: string) => {
    if (!confirm('Mark this commission as paid?')) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/commissions/${commissionId}/pay`,
        { method: 'POST' }
      );

      if (res.ok) {
        loadCommissions();
      } else {
        alert('Failed to mark as paid');
      }
    } catch (err) {
      console.error('Failed to mark as paid:', err);
      alert('Failed to mark as paid');
    }
  };

  const filteredCommissions = commissions.filter((commission) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return commission.status === 'PENDING';
    if (filter === 'paid') return commission.status === 'PAID';
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPending = summary.reduce((sum, s) => sum + s.pendingCommission, 0);
  const totalPaid = summary.reduce((sum, s) => sum + s.paidCommission, 0);
  const totalCommission = summary.reduce((sum, s) => sum + s.totalCommission, 0);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading commissions...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">💰 School Commissions</h1>
        <p className="text-gray-600 mt-2">Track and manage school commission payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Total Commissions</div>
          <div className="text-2xl font-bold text-gray-900">
            KES {totalCommission.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Pending Payment</div>
          <div className="text-2xl font-bold text-yellow-600">
            KES {totalPending.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Paid</div>
          <div className="text-2xl font-bold text-green-600">
            KES {totalPaid.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Commission Summary by School</h3>
        </div>
        {summary.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No commission data available</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Paid
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.map((school) => (
                <tr key={school.schoolId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/schools/${school.schoolId}/branches`}
                      className="font-medium text-blue-600 hover:text-blue-900"
                    >
                      {school.schoolName}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {(school.commissionRate * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{school.studentCount}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      KES {school.totalCommission.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-yellow-600">
                      KES {school.pendingCommission.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-green-600">
                      KES {school.paidCommission.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Paid
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Commission Transactions</h3>
        </div>
        {filteredCommissions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No commissions found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCommissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {commission.schoolName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/users/${commission.userId}`}
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      {commission.userName}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      KES {commission.paymentAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {(commission.commissionRate * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      KES {commission.commissionAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        commission.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {commission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(commission.createdAt)}
                    </div>
                    {commission.paidAt && (
                      <div className="text-xs text-gray-500">
                        Paid: {formatDate(commission.paidAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {commission.status === 'PENDING' && (
                      <button
                        onClick={() => handleMarkAsPaid(commission.id)}
                        className="text-sm text-green-600 hover:text-green-900 font-medium"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
