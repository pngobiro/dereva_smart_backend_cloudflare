'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
    } else {
      const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
      if (user.role === 'SUPER_ADMIN') {
        router.push('/content');
      } else {
        router.push(`/schools/${user.schoolId}/progress`);
      }
    }
  }, [router]);

  return null;
}
