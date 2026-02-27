'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LICENSE_CATEGORIES, TOPIC_AREAS, DIFFICULTY_LEVELS } from '@/lib/constants';

interface Module {
  id: string;
  title: string;
  description: string;
  licenseCategory: string;
  topicArea: string;
  difficulty: string;
  jsonUrl: string;
  isPremium: boolean;
  order: number;
}

export default function ModulesTab() {
  const [modules, setModules] = useState<Module[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await api.getModules();
      console.log('Modules loaded:', data);
      setModules(data.modules || []);
    } catch (err) {
      console.error('Failed to load modules:', err);
      setMessage({ text: `Failed to load modules: ${err}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      id: formData.get('id'),
      title: formData.get('title'),
      description: formData.get('description'),
      licenseCategory: formData.get('licenseCategory'),
      topicArea: formData.get('topicArea'),
      difficulty: formData.get('difficulty'),
      jsonUrl: 'content/' + formData.get('jsonUrl'),
      isPremium: formData.get('isPremium') === 'on',
      order: parseInt(formData.get('order') as string),
    };

    try {
      const result = await api.createModule(data);

      if (result.success) {
        setMessage({ text: 'Module created successfully!', type: 'success' });
        form.reset();
        setShowForm(false);
        loadModules();
      } else {
        setMessage({ text: result.error || 'Failed to create module', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error creating module', type: 'error' });
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this module?')) return;

    try {
      const result = await api.deleteModule(id);
      if (result.success) {
        setMessage({ text: 'Module deleted', type: 'success' });
        loadModules();
      }
    } catch (err) {
      setMessage({ text: 'Delete failed', type: 'error' });
    }

    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Learning Modules</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ New Module'}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Module ID</label>
              <input
                type="text"
                name="id"
                required
                placeholder="module-b1-basics-001"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">License Category</label>
              <select name="licenseCategory" required className="w-full px-3 py-2 border rounded-lg">
                {LICENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Title</label>
            <input type="text" name="title" required className="w-full px-3 py-2 border rounded-lg" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea name="description" required className="w-full px-3 py-2 border rounded-lg" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Topic Area</label>
              <select name="topicArea" required className="w-full px-3 py-2 border rounded-lg">
                {TOPIC_AREAS.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select name="difficulty" required className="w-full px-3 py-2 border rounded-lg">
                {DIFFICULTY_LEVELS.MODULE.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">JSON URL</label>
              <input
                type="text"
                name="jsonUrl"
                required
                placeholder="B1/modules/module-01/module.json"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Display Order</label>
              <input
                type="number"
                name="order"
                required
                defaultValue="1"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isPremium" className="w-4 h-4" />
              <span className="text-sm font-medium">Premium Content</span>
            </label>
          </div>

          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Module
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading modules...</div>
      ) : modules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No modules found. Create your first module!</div>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => (
            <div key={module.id} className="bg-white p-6 rounded-lg shadow flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">{module.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  <span>{module.id}</span>
                  <span>{module.licenseCategory}</span>
                  <span>{module.difficulty}</span>
                  {module.isPremium && <span className="text-yellow-600">Premium</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(module.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
