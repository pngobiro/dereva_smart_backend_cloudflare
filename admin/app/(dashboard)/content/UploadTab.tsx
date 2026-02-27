'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function UploadTab() {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        let content = reader.result as string;
        
        // For JSON files, keep as text
        // For images, keep as data URL (base64)
        
        try {
          const result = await api.uploadToR2(path, content);
          
          if (result.success) {
            setMessage({ text: 'File uploaded successfully!', type: 'success' });
            form.reset();
          } else {
            setMessage({ text: result.error || 'Upload failed', type: 'error' });
          }
        } catch (err) {
          setMessage({ text: 'Error uploading file', type: 'error' });
        }
        setUploading(false);
      };

      if (file.type.includes('json') || file.type.includes('text')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setMessage({ text: 'Error uploading file', type: 'error' });
      setUploading(false);
    }

    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Upload Content to R2</h2>

      {message && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">File Path in R2</label>
          <input
            type="text"
            name="path"
            required
            placeholder="content/B1/modules/module-01/module.json"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">Full path including content/ prefix</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">File</label>
          <input
            type="file"
            name="file"
            required
            accept=".json,.png,.jpg,.jpeg,.mp4"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">Supported: JSON, PNG, JPG, MP4</p>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload to R2'}
        </button>
      </form>
    </div>
  );
}
