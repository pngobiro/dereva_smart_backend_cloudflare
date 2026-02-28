'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  targetCategory: string;
  subscriptionStatus: string;
  subscriptionExpiryDate: number | null;
  isPhoneVerified: boolean;
  userRole: string;
  drivingSchoolId: string | null;
  createdAt: number;
  lastActiveAt: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'premium' && (user.subscriptionStatus === 'PREMIUM' || user.subscriptionStatus === 'PREMIUM_MONTHLY')) ||
      (filter === 'free' && user.subscriptionStatus === 'FREE');

    const matchesSearch =
      searchTerm === '' ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSubscriptionBadge = (status: string) => {
    if (status === 'PREMIUM' || status === 'PREMIUM_MONTHLY') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Premium</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Free</span>;
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading users...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">👥 Users</h1>
        <p className="text-gray-600 mt-2">Manage registered users and their subscriptions</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setFilter('premium')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'premium' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Premium ({users.filter((u) => u.subscriptionStatus === 'PREMIUM' || u.subscriptionStatus === 'PREMIUM_MONTHLY').length})
          </button>
          <button
            onClick={() => setFilter('free')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'free' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Free ({users.filter((u) => u.subscriptionStatus === 'FREE').length})
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.id}</div>
                      </div>
                      {user.isPhoneVerified && (
                        <span className="text-green-600" title="Phone verified">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{user.phoneNumber}</div>
                    {user.email && <div className="text-sm text-gray-500">{user.email}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.targetCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>{getSubscriptionBadge(user.subscriptionStatus)}</div>
                    {(user.subscriptionStatus === 'PREMIUM' || user.subscriptionStatus === 'PREMIUM_MONTHLY') && user.subscriptionExpiryDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Expires: {formatDate(user.subscriptionExpiryDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{user.userRole}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                    <div className="text-xs text-gray-500">
                      Active: {formatDate(user.lastActiveAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/users/${user.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
