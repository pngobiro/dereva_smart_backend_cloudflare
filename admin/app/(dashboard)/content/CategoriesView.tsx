'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LICENSE_CATEGORIES } from '@/lib/constants';

interface Module {
  id: string;
  title: string;
  licenseCategory: string;
  isPremium: boolean;
}

interface Quiz {
  id: string;
  title: string;
  licenseCategory: string;
  totalQuestions: number;
  isPremium: boolean;
}

export default function CategoriesView() {
  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['B1']));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulesData, quizzesData] = await Promise.all([
        api.getModules(),
        api.getQuizzes(),
      ]);
      setModules(modulesData.modules || []);
      setQuizzes(quizzesData.quizzes || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryModules = (category: string) => {
    return modules.filter((m) => m.licenseCategory === category);
  };

  const getCategoryQuizzes = (category: string) => {
    return quizzes.filter((q) => q.licenseCategory === category);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading content...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content by License Category</h2>
          <p className="text-gray-600 mt-1">Browse modules and quizzes organized by license type</p>
        </div>
        <button
          onClick={() => setExpandedCategories(new Set(LICENSE_CATEGORIES.map((c) => c.value)))}
          className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Expand All
        </button>
      </div>

      <div className="space-y-4">
        {LICENSE_CATEGORIES.map((category) => {
          const categoryModules = getCategoryModules(category.value);
          const categoryQuizzes = getCategoryQuizzes(category.value);
          const isExpanded = expandedCategories.has(category.value);
          const hasContent = categoryModules.length > 0 || categoryQuizzes.length > 0;

          return (
            <div key={category.value} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleCategory(category.value)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">{category.value}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg">{category.label}</h3>
                    <p className="text-sm text-gray-600">
                      {categoryModules.length} modules • {categoryQuizzes.length} quizzes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!hasContent && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Empty</span>
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t bg-gray-50 p-6">
                  {!hasContent ? (
                    <p className="text-center text-gray-500 py-4">
                      No content available for this category yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-6">
                      {/* Modules */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-700">📚 Modules</h4>
                          <span className="text-xs text-gray-500">{categoryModules.length} total</span>
                        </div>
                        {categoryModules.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No modules</p>
                        ) : (
                          <div className="space-y-2">
                            {categoryModules.map((module) => (
                              <div
                                key={module.id}
                                className="bg-white p-3 rounded border hover:border-blue-300 transition"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm">{module.title}</h5>
                                    <p className="text-xs text-gray-500 mt-1">{module.id}</p>
                                  </div>
                                  {module.isPremium && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                      Premium
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quizzes */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-700">📝 Quizzes</h4>
                          <span className="text-xs text-gray-500">{categoryQuizzes.length} total</span>
                        </div>
                        {categoryQuizzes.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No quizzes</p>
                        ) : (
                          <div className="space-y-2">
                            {categoryQuizzes.map((quiz) => (
                              <div
                                key={quiz.id}
                                className="bg-white p-3 rounded border hover:border-green-300 transition"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm">{quiz.title}</h5>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {quiz.id} • {quiz.totalQuestions} questions
                                    </p>
                                  </div>
                                  {quiz.isPremium && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                      Premium
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
