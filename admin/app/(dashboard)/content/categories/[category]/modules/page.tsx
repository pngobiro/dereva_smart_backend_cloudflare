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
  order: number;
  isPremium: boolean;
  lessonCount: number;
  estimatedDuration: number;
}

export default function CategoryModulesPage() {
  const params = useParams();
  const category = params.category as string;
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryInfo = LICENSE_CATEGORIES.find((c) => c.value === category);

  useEffect(() => {
    loadModules();
  }, [category]);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await api.getModules();
      const filtered = data.modules.filter((m: any) => m.licenseCategory === category);
      setModules(filtered);
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading modules...</div>;
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
          📚 Modules - {categoryInfo?.label || category}
        </h1>
        <p className="text-gray-600 mt-2">{modules.length} learning modules</p>
      </div>

      {modules.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No modules available for this category</p>
          <p className="text-gray-400 text-sm mt-2">Create modules from the Modules tab</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lessons</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {modules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{module.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{module.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{module.description}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {module.lessonCount > 0 ? (
                      <Link
                        href={`/content/categories/${category}/modules/${module.id}/lessons`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        {module.lessonCount}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{module.estimatedDuration} min</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{module.order}</span>
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
        </div>
      )}
    </div>
  );
}
