'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ProgressRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  quizName: string;
  category: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  completedAt: number;
}

interface SchoolStats {
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  topPerformers: Array<{
    id: string;
    name: string;
    phoneNumber: string;
    avgScore: number;
    attempts: number;
    passedCount: number;
  }>;
  categoryStats: Array<{
    category: string;
    attempts: number;
    avgScore: number;
    passed: number;
    passRate: number;
  }>;
}

export default function SchoolProgressPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;
  
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [schoolId, categoryFilter, userFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load progress
      let progressUrl = `/api/admin/schools/${schoolId}/progress?limit=100`;
      if (categoryFilter) progressUrl += `&category=${categoryFilter}`;
      if (userFilter) progressUrl += `&userId=${userFilter}`;
      
      const progressRes = await fetch(progressUrl);
      const progressData = await progressRes.json();
      setProgress(progressData.progress || []);
      
      // Load stats
      const statsRes = await fetch(`/api/admin/schools/${schoolId}/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/schools/${schoolId}`} className="text-blue-600 hover:underline">
          ← Back to School
        </Link>
        <h1 className="text-3xl font-bold mt-2">Student Progress</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Total Students</div>
            <div className="text-3xl font-bold">{stats.totalStudents}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Total Attempts</div>
            <div className="text-3xl font-bold">{stats.totalAttempts}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Average Score</div>
            <div className="text-3xl font-bold">{stats.averageScore}%</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Pass Rate</div>
            <div className="text-3xl font-bold">{stats.passRate}%</div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {stats && stats.topPerformers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Top Performers (Last 30 Days)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Student</th>
                  <th className="text-left py-2">Phone</th>
                  <th className="text-right py-2">Avg Score</th>
                  <th className="text-right py-2">Attempts</th>
                  <th className="text-right py-2">Passed</th>
                </tr>
              </thead>
              <tbody>
                {stats.topPerformers.map((performer) => (
                  <tr key={performer.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">
                      <Link 
                        href={`/schools/${schoolId}/students/${performer.id}/progress`}
                        className="text-blue-600 hover:underline"
                      >
                        {performer.name}
                      </Link>
                    </td>
                    <td className="py-2">{performer.phoneNumber}</td>
                    <td className="text-right py-2">{performer.avgScore}%</td>
                    <td className="text-right py-2">{performer.attempts}</td>
                    <td className="text-right py-2">{performer.passedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Stats */}
      {stats && stats.categoryStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Performance by Category</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Attempts</th>
                  <th className="text-right py-2">Avg Score</th>
                  <th className="text-right py-2">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.categoryStats.map((cat) => (
                  <tr key={cat.category} className="border-b hover:bg-gray-50">
                    <td className="py-2">{cat.category}</td>
                    <td className="text-right py-2">{cat.attempts}</td>
                    <td className="text-right py-2">{cat.avgScore}%</td>
                    <td className="text-right py-2">{cat.passRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Student ID</label>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Filter by user ID"
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setCategoryFilter('');
                setUserFilter('');
              }}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Progress Records */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Recent Quiz Attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Quiz</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-right py-3 px-4">Score</th>
                <th className="text-right py-3 px-4">Questions</th>
                <th className="text-right py-3 px-4">Time</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {progress.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No progress records found
                  </td>
                </tr>
              ) : (
                progress.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <Link
                          href={`/schools/${schoolId}/students/${record.userId}/progress`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {record.userName}
                        </Link>
                        <div className="text-sm text-gray-500">{record.userPhone}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{record.quizName}</td>
                    <td className="py-3 px-4">{record.category}</td>
                    <td className="text-right py-3 px-4 font-semibold">
                      {record.score}%
                    </td>
                    <td className="text-right py-3 px-4">
                      {record.correctAnswers}/{record.totalQuestions}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatTime(record.timeTaken)}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          record.passed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {record.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatDate(record.completedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
