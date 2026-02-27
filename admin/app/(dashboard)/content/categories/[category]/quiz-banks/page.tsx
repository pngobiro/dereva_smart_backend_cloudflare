'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LICENSE_CATEGORIES } from '@/lib/constants';

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
  isPremium: boolean;
}

export default function CategoryQuizBanksPage() {
  const params = useParams();
  const category = params.category as string;
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryInfo = LICENSE_CATEGORIES.find((c) => c.value === category);

  useEffect(() => {
    loadQuizzes();
  }, [category]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await api.getQuizzes();
      const filtered = data.quizzes.filter((q: any) => q.licenseCategory === category);
      setQuizzes(filtered);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading quiz banks...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/content/categories/${category}`}
          className="text-blue-600 hover:underline text-sm mb-2 inline-block"
        >
          ← Back to {categoryInfo?.label || category}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          📝 Quiz Banks - {categoryInfo?.label || category}
        </h1>
        <p className="text-gray-600 mt-2">{quizzes.length} quiz banks</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No quiz banks available for this category</p>
          <p className="text-gray-400 text-sm mt-2">Create quizzes from the Quizzes tab</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Questions</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pass %</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{quiz.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{quiz.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{quiz.description}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {quiz.totalQuestions > 0 ? (
                      <Link
                        href={`/content/categories/${category}/quiz-banks/${quiz.id}/questions`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        {quiz.totalQuestions}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{quiz.timeLimit} min</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{quiz.passingScore}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        quiz.difficulty === 'EASY'
                          ? 'bg-green-100 text-green-800'
                          : quiz.difficulty === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {quiz.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {quiz.isPremium && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Premium
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
