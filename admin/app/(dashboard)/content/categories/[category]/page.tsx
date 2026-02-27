'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LICENSE_CATEGORIES } from '@/lib/constants';

interface Module {
  id: string;
  title: string;
  description: string;
  isPremium: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  isPremium: boolean;
}

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;
  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryInfo = LICENSE_CATEGORIES.find((c) => c.value === category);

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulesData, quizzesData] = await Promise.all([
        api.getModules(),
        api.getQuizzes(),
      ]);

      setModules(modulesData.modules.filter((m: any) => m.licenseCategory === category));
      setQuizzes(quizzesData.quizzes.filter((q: any) => q.licenseCategory === category));
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/content/categories" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
          ← Back to Categories
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{category}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{categoryInfo?.label || category}</h1>
            <p className="text-gray-600 mt-1">
              {modules.length} modules • {quizzes.length} quizzes
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Modules Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">📚 Learning Modules</h2>
            <Link
              href={`/content/categories/${category}/modules`}
              className="text-sm text-blue-600 hover:underline"
            >
              View all {modules.length} modules →
            </Link>
          </div>

          {modules.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">No modules available</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {modules.slice(0, 5).map((module) => (
                    <tr key={module.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{module.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{module.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{module.description}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {module.isPremium && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Premium
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {modules.length > 5 && (
                <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-600">
                  +{modules.length - 5} more modules
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quizzes Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">📝 Quiz Banks</h2>
            <Link
              href={`/content/categories/${category}/quiz-banks`}
              className="text-sm text-blue-600 hover:underline"
            >
              View all {quizzes.length} quizzes →
            </Link>
          </div>

          {quizzes.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">No quizzes available</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Questions</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quizzes.slice(0, 5).map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{quiz.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{quiz.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{quiz.description}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-900">{quiz.totalQuestions}</span>
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
              {quizzes.length > 5 && (
                <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-600">
                  +{quizzes.length - 5} more quizzes
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
