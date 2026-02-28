'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface ProgressRecord {
  id: string;
  quizName: string;
  category: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  completedAt: number;
}

interface StudentProgressResponse {
  student: {
    id: string;
    name: string;
    phoneNumber: string;
    targetCategory: string;
  };
  summary: {
    totalAttempts: number;
    avgScore: number;
    passedCount: number;
    passRate: number;
  };
  progress: ProgressRecord[];
}

export default function StudentProgressPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;
  const userId = params.userId as string;
  
  const [data, setData] = useState<StudentProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [schoolId, userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await api.getStudentProgress(schoolId, userId);
      setData(result);
    } catch (error) {
      console.error('Failed to load student progress:', error);
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
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center">Student not found</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/schools/${schoolId}/progress`} className="text-blue-600 hover:underline">
          ← Back to All Students
        </Link>
        <h1 className="text-3xl font-bold mt-2">{data.student.name}'s Progress</h1>
        <div className="text-gray-500 mt-1">
          {data.student.phoneNumber} • Category: {data.student.targetCategory}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Attempts</div>
          <div className="text-3xl font-bold">{data.summary.totalAttempts}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Avg Score</div>
          <div className="text-3xl font-bold">{data.summary.avgScore}%</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Passed</div>
          <div className="text-3xl font-bold">{data.summary.passedCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Pass Rate</div>
          <div className="text-3xl font-bold">{data.summary.passRate}%</div>
        </div>
      </div>

      {/* Progress Records */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Quiz</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Questions</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.progress.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{record.quizName}</td>
                <td className="py-3 px-4">{record.category}</td>
                <td className="text-right py-3 px-4 font-semibold">{record.score}%</td>
                <td className="text-right py-3 px-4">
                  {record.correctAnswers}/{record.totalQuestions}
                </td>
                <td className="text-right py-3 px-4">{formatTime(record.timeTaken)}</td>
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
                <td className="py-3 px-4 text-sm text-gray-500">
                  {formatDate(record.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
