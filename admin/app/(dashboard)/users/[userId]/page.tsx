'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

interface QuizAttempt {
  id: string;
  quizBankId: string;
  quizTitle: string;
  score: number;
  passed: boolean;
  completedAt: number;
}

interface Subscription {
  id: string;
  subscriptionType: string;
  startDate: number;
  endDate: number | null;
  isActive: boolean;
  createdAt: number;
  paymentId: string | null;
  amount: number | null;
  paymentStatus: string | null;
}

interface Progress {
  modulesCompleted: number;
  quizzesAttempted: number;
  averageScore: number;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [userData, attemptsData, subscriptionsData, progressData] = await Promise.all([
        api.getUser(userId),
        api.getUserAttempts(userId),
        api.getUserSubscriptions(userId),
        api.getUserProgress(userId),
      ]);

      setUser(userData);
      setAttempts(attemptsData.attempts || []);
      setSubscriptions(subscriptionsData.subscriptions || []);
      setProgress(progressData);
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading user details...</div>;
  }

  if (!user) {
    return <div className="text-center py-8 text-gray-500">User not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/users" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
          ← Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">👤 {user.name}</h1>
        <p className="text-gray-600 mt-2">{user.phoneNumber}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Subscription</div>
          <div className="text-2xl font-bold text-gray-900">
            {user.subscriptionStatus === 'PREMIUM' ? '👑 Premium' : 'Free'}
          </div>
          {user.subscriptionStatus === 'PREMIUM' && user.subscriptionExpiryDate && (
            <div className="text-sm text-gray-500 mt-2">
              Expires: {formatDate(user.subscriptionExpiryDate)}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Quizzes Attempted</div>
          <div className="text-2xl font-bold text-gray-900">{progress?.quizzesAttempted || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Average Score</div>
          <div className="text-2xl font-bold text-gray-900">
            {progress?.averageScore ? `${progress.averageScore}%` : 'N/A'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">User Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">User ID</div>
            <div className="text-gray-900">{user.id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Target Category</div>
            <div className="text-gray-900">{user.targetCategory}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-gray-900">{user.email || 'Not provided'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Role</div>
            <div className="text-gray-900">{user.userRole}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Phone Verified</div>
            <div className="text-gray-900">{user.isPhoneVerified ? '✓ Yes' : '✗ No'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Joined</div>
            <div className="text-gray-900">{formatDate(user.createdAt)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Last Active</div>
            <div className="text-gray-900">{formatDate(user.lastActiveAt)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Subscription History</h2>
        </div>
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No subscription history</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{sub.subscriptionType}</div>
                    <div className="text-xs text-gray-500">{sub.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(sub.startDate)}
                    </div>
                    {sub.endDate && (
                      <div className="text-sm text-gray-500">
                        to {formatDate(sub.endDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {sub.amount ? `KES ${sub.amount.toLocaleString()}` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {sub.paymentId ? (
                      <div>
                        <div className="text-sm text-gray-900">{sub.paymentId}</div>
                        {sub.paymentStatus && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              sub.paymentStatus === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : sub.paymentStatus === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {sub.paymentStatus}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No payment</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sub.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sub.isActive ? 'Active' : 'Expired'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Quiz Attempts</h2>
        </div>
        {attempts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No quiz attempts yet</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{attempt.quizTitle}</div>
                    <div className="text-sm text-gray-500">{attempt.quizBankId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">{attempt.score}%</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        attempt.passed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(attempt.completedAt)}</div>
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
