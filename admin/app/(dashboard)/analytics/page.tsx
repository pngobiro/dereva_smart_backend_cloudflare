'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  totalQuizzes: number;
  totalModules: number;
  totalSchools: number;
  quizAttempts: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getAnalytics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-blue-500' },
    { label: 'Premium Users', value: stats.premiumUsers, icon: '⭐', color: 'bg-yellow-500' },
    { label: 'Quizzes', value: stats.totalQuizzes, icon: '📝', color: 'bg-green-500' },
    { label: 'Modules', value: stats.totalModules, icon: '📚', color: 'bg-purple-500' },
    { label: 'Schools', value: stats.totalSchools, icon: '🏫', color: 'bg-red-500' },
    { label: 'Quiz Attempts', value: stats.quizAttempts, icon: '✅', color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of platform statistics</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{card.label}</p>
                <p className="text-3xl font-bold mt-2">{card.value.toLocaleString()}</p>
              </div>
              <div className={`${card.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
