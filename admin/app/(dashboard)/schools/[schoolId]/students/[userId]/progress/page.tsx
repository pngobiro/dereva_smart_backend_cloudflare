'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

interface StudentData {
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
  
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [schoolId, userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/schools/${schoolId}/students/${userId}/progress`);
      const result = await res.json();
      setData(result);
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

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">Failed to load student data</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/schools/${schoolId}/progress`} className="text-blue-600 hover:underline">
          ← Back to School Progress
        </Link>
      </div>

      {/* Student Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h1 className="text-3xl font-bold mb-4">{data.student.name}</h1>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500 text-sm">Phone Number</div>
            <div className="font-medium">{data.student.phoneNumber}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Target Category</div>
            <div className="font-medium">{data.student.targetCategory}</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Attempts</div>
          <div className="text-3xl font-bold">{data.summary.totalAttempts}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Average Score</div>
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

      {/* Progress History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Quiz History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
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
              {data.progress.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No quiz attempts yet
                  </td>
                </tr>
              ) : (
                data.progress.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
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
