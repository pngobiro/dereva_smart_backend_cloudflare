'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const superAdminItems = [
  { href: '/content', label: 'Content', icon: '📚' },
  { href: '/schools', label: 'Schools', icon: '🏫' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/payments', label: 'Payments', icon: '💳' },
  { href: '/commissions', label: 'Commissions', icon: '💰' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  const navItems = user?.role === 'SUPER_ADMIN' 
    ? [...superAdminItems, { href: '/profile', label: 'My Profile', icon: '👤' }] 
    : [
        { href: `/schools/${user?.schoolId}/progress`, label: 'Student Progress', icon: '📈' },
        { href: `/schools/${user?.schoolId}`, label: 'School Details', icon: '🏫' },
        { href: '/profile', label: 'My Profile', icon: '👤' },
      ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dereva Admin</h1>
        {user && (
          <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
            {user.role.replace('_', ' ')}
          </div>
        )}
      </div>
      
      <nav className="space-y-2 flex-grow">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-800">
        <div className="mb-4 px-4">
          <div className="text-sm font-medium truncate">{user?.name}</div>
          <div className="text-xs text-gray-500 truncate">{user?.email}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 transition"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
