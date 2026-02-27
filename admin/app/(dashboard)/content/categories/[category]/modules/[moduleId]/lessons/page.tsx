'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LICENSE_CATEGORIES } from '@/lib/constants';

interface Lesson {
  id: string;
  title: string;
  description: string;
  order_index: number;
  content_type: string;
  duration: number;
}

export default function ModuleLessonsPage() {
  const params = useParams();
  const category = params.category as string;
  const moduleId = params.moduleId as string;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleName, setModuleName] = useState('');
  const [loading, setLoading] = useState(true);

  const categoryInfo = LICENSE_CATEGORIES.find((c) => c.value === category);

  useEffect(() => {
    loadLessons();
  }, [category, moduleId]);

  const loadLessons = async () => {
    setLoading(true);
    try {
      // Fetch lessons from API
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/lessons/${moduleId}`);
      const data = await res.json();
      setLessons(data || []);
      
      // Get module name
      const moduleRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modules`);
      const moduleData = await moduleRes.json();
      const module = moduleData.modules.find((m: any) => m.id === moduleId);
      setModuleName(module?.title || moduleId);
    } catch (err) {
      console.error('Failed to load lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading lessons...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/content/categories/${category}/modules`}
          className="text-blue-600 hover:underline text-sm mb-2 inline-block"
        >
          ← Back to Modules
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          📖 Lessons - {moduleName}
        </h1>
        <p className="text-gray-600 mt-2">
          {categoryInfo?.label || category} • {lessons.length} lessons
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No lessons available for this module</p>
          <p className="text-gray-400 text-sm mt-2">Lessons are managed through the content system</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lesson</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">{lesson.order_index}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{lesson.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{lesson.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{lesson.description}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {lesson.content_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{lesson.duration} min</span>
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
