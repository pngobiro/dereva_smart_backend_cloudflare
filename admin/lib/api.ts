const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dereva-smart-backend.pngobiro.workers.dev';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Modules
  getModules: async () => {
    const res = await fetch(`${API_URL}/api/modules`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  
  createModule: async (data: any) => {
    const res = await fetch(`${API_URL}/api/admin/modules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  
  deleteModule: async (id: string) => {
    const res = await fetch(`${API_URL}/api/admin/modules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Quizzes
  getQuizzes: async () => {
    const res = await fetch(`${API_URL}/api/quizzes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  
  createQuiz: async (data: any) => {
    const res = await fetch(`${API_URL}/api/admin/quizzes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  
  deleteQuiz: async (id: string) => {
    const res = await fetch(`${API_URL}/api/admin/quizzes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Schools
  getSchools: async () => {
    const res = await fetch(`${API_URL}/api/schools`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  
  createSchool: async (data: any) => {
    const res = await fetch(`${API_URL}/api/admin/schools`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  
  deleteSchool: async (id: string) => {
    const res = await fetch(`${API_URL}/api/admin/schools/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Users
  getUsers: async () => {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Analytics
  getAnalytics: async () => {
    const res = await fetch(`${API_URL}/api/admin/analytics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // School Specific
  getSchoolProgress: async (schoolId: string, filters: any = {}) => {
    let url = `${API_URL}/api/admin/schools/${schoolId}/progress?limit=100`;
    if (filters.category) url += `&category=${filters.category}`;
    if (filters.userId) url += `&userId=${filters.userId}`;
    
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getSchoolStats: async (schoolId: string) => {
    const res = await fetch(`${API_URL}/api/admin/schools/${schoolId}/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getSchoolUsers: async (schoolId: string) => {
    const res = await fetch(`${API_URL}/api/admin/schools/${schoolId}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Upload
  uploadToR2: async (path: string, content: string) => {
    const res = await fetch(`${API_URL}/api/admin/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, content }),
    });
    return handleResponse(res);
  },
};
