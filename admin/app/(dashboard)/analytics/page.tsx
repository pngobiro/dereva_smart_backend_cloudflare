'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface SchoolStats {
  schoolId: string;
  schoolName: string;
  studentCount: number;
  revenue: number;
  branches: number;
}

interface Analytics {
  totalUsers: number;
  premiumUsers: number;
  totalQuizzes: number;
  totalModules: number;
  totalSchools: number;
  quizAttempts: number;
  totalRevenue: number;
  schoolStats: SchoolStats[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
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
    loadAnalytics();
  }, [router]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading analytics...</div>;
  }

  if (!analytics || !Array.isArray(analytics.schoolStats)) {
    return <div className="text-center py-8 text-gray-500">Failed to load analytics or invalid data received</div>;
  }

  const topSchoolsByRevenue = [...analytics.schoolStats]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const topSchoolsByStudents = [...analytics.schoolStats]
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 10);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📊 Analytics</h1>
        <p className="text-gray-600 mt-2">Platform performance and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</div>
          <div className="text-xs text-gray-500 mt-1">
            {analytics.premiumUsers} premium
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600">
            KES {analytics.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Quiz Attempts</div>
          <div className="text-2xl font-bold text-blue-600">{analytics.quizAttempts}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Driving Schools</div>
          <div className="text-2xl font-bold text-purple-600">{analytics.totalSchools}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            🏆 Top Schools by Revenue
          </h3>
          {topSchoolsByRevenue.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            <div className="space-y-3">
              {topSchoolsByRevenue.map((school, index) => (
                <div key={school.schoolId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <Link
                        href={`/schools/${school.schoolId}/branches`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900"
                      >
                        {school.schoolName}
                      </Link>
                      <div className="text-xs text-gray-500">
                        {school.studentCount} students • {school.branches} branches
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      KES {school.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            👥 Top Schools by Students
          </h3>
          {topSchoolsByStudents.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            <div className="space-y-3">
              {topSchoolsByStudents.map((school, index) => (
                <div key={school.schoolId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <Link
                        href={`/schools/${school.schoolId}/branches`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900"
                      >
                        {school.schoolName}
                      </Link>
                      <div className="text-xs text-gray-500">
                        {school.branches} branches • KES {school.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {school.studentCount} students
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">All Schools Performance</h3>
        </div>
        {analytics.schoolStats.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No schools data available</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Branches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg per Student
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.schoolStats
                .sort((a, b) => b.revenue - a.revenue)
                .map((school) => (
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
                      <div className="text-sm text-gray-900">{school.studentCount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{school.branches}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        KES {school.revenue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {school.studentCount > 0
                          ? `KES ${Math.round(school.revenue / school.studentCount).toLocaleString()}`
                          : 'N/A'}
                      </div>
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
