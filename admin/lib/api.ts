const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Modules
  getModules: async () => {
    console.log('Fetching modules from:', `${API_URL}/api/modules`);
    const res = await fetch(`${API_URL}/api/modules`);
    return handleResponse(res);
  },
  
  createModule: async (data: any) => {
    const res = await fetch(`${API_URL}/api/admin/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  
  deleteModule: async (id: string) => {
    const res = await fetch(`${API_URL}/api/admin/modules/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Quizzes
  getQuizzes: async () => {
    console.log('Fetching quizzes from:', `${API_URL}/api/quizzes`);
    const res = await fetch(`${API_URL}/api/quizzes`);
    return handleResponse(res);
  },
  
  createQuiz: async (data: any) => {
    const res = await fetch(`${API_URL}/api/admin/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  
  deleteQuiz: async (id: string) => {
    const res = await fetch(`${API_URL}/api/admin/quizzes/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Schools
  getSchools: async () => {
    console.log('Fetching schools from:', `${API_URL}/api/schools`);
    const res = await fetch(`${API_URL}/api/schools`);
    return handleResponse(res);
  },
  
  createSchool: async (data: any) => {
    const res = await fetch(`${API_URL}/api/admin/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  
  deleteSchool: async (id: string) => {
    const res = await fetch(`${API_URL}/api/admin/schools/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Users
  getUsers: async () => {
    console.log('Fetching users from:', `${API_URL}/api/admin/users`);
    const res = await fetch(`${API_URL}/api/admin/users`);
    return handleResponse(res);
  },

  // Analytics
  getAnalytics: async () => {
    console.log('Fetching analytics from:', `${API_URL}/api/admin/analytics`);
    const res = await fetch(`${API_URL}/api/admin/analytics`);
    return handleResponse(res);
  },

  // Upload
  uploadToR2: async (path: string, content: string) => {
    const res = await fetch(`${API_URL}/api/admin/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    });
    return handleResponse(res);
  },
};
