'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LICENSE_CATEGORIES } from '@/lib/constants';
import Link from 'next/link';

interface CategoryStats {
  category: string;
  modulesCount: number;
  quizzesCount: number;
}

export default function CategoriesPage() {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [modulesData, quizzesData] = await Promise.all([
        api.getModules(),
        api.getQuizzes(),
      ]);

      const categoryStats = LICENSE_CATEGORIES.map((cat) => ({
        category: cat.value,
        modulesCount: modulesData.modules.filter((m: any) => m.licenseCategory === cat.value).length,
        quizzesCount: quizzesData.quizzes.filter((q: any) => q.licenseCategory === cat.value).length,
      }));

      setStats(categoryStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading categories...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">License Categories</h1>
        <p className="text-gray-600 mt-2">Browse content by license category</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Modules</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quizzes</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {LICENSE_CATEGORIES.map((category) => {
              const stat = stats.find((s) => s.category === category.value);
              const hasContent = stat && (stat.modulesCount > 0 || stat.quizzesCount > 0);

              return (
                <tr key={category.value} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{category.value}</span>
                      </div>
                      <span className="font-medium text-gray-900">{category.value}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{category.label}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {stat && stat.modulesCount > 0 ? (
                      <Link
                        href={`/content/categories/${category.value}/modules`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        {stat.modulesCount}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {stat && stat.quizzesCount > 0 ? (
                      <Link
                        href={`/content/categories/${category.value}/quiz-banks`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        {stat.quizzesCount}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {hasContent ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Empty
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/content/categories/${category.value}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
