'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface School {
  id: string;
  name: string;
  registrationNumber: string;
  phone: string;
  email: string;
  address: string;
  county: string;
  town: string;
  isVerified: boolean;
  createdAt: number;
}

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  targetCategory: string;
  subscriptionStatus: string;
  lastActiveAt: number;
}

export default function SchoolDetailsPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;
  const router = useRouter();
  
  const [school, setSchool] = useState<School | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'students'>('students');
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setAdminUser(user);
      
      // Security: Prevent school admins from accessing other schools
      if (user.role === 'SCHOOL_ADMIN' && user.schoolId !== schoolId) {
        router.push(`/schools/${user.schoolId}`);
        return;
      }
    }
    loadData();
  }, [schoolId, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dereva-smart-backend.pngobiro.workers.dev';
      
      const [schoolRes, usersData] = await Promise.all([
        fetch(`${apiUrl}/api/schools/${schoolId}`),
        api.getSchoolUsers(schoolId)
      ]);
      
      const schoolData = await schoolRes.json();
      
      setSchool({
        id: schoolData.id,
        name: schoolData.name,
        registrationNumber: schoolData.registrationNumber || schoolData.id,
        phone: schoolData.phone || '',
        email: schoolData.email || '',
        address: schoolData.address || '',
        county: schoolData.county || '',
        town: schoolData.town || '',
        isVerified: schoolData.verified || false,
        createdAt: schoolData.createdAt || Date.now(),
      });
      
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Failed to load school data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!school) {
    return <div className="p-8 text-center">School not found</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          {adminUser?.role === 'SUPER_ADMIN' && (
            <Link href="/schools" className="text-blue-600 hover:underline">
              ← Back to Schools
            </Link>
          )}
          <h1 className="text-3xl font-bold mt-2">{school.name}</h1>
          <div className="text-gray-500 mt-1">School ID: {school.id}</div>
        </div>
        <div className="flex gap-4">
          <Link
            href={`/schools/${schoolId}/progress`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            📊 View Progress Analytics
          </Link>
          <Link
            href={`/schools/${schoolId}/branches`}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-900 transition"
          >
            🏢 Manage Branches
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'students' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Students ({users.length})
          {activeTab === 'students' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'info' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          School Information
          {activeTab === 'info' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
          )}
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Business Details</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 uppercase">Status</div>
                <div className="font-medium">
                  <span className={`px-2 py-1 rounded text-sm ${school.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {school.isVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 uppercase">Registration Number</div>
                <div className="font-medium">{school.registrationNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 uppercase">Joined Date</div>
                <div className="font-medium">{new Date(school.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Contact & Location</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 uppercase">Phone Number</div>
                <div className="font-medium">{school.phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 uppercase">Email Address</div>
                <div className="font-medium">{school.email || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 uppercase">Physical Address</div>
                <div className="font-medium">
                  {school.address}<br />
                  {school.town}, {school.county}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-700">Registered Students</h2>
            <div className="text-xs text-gray-500 uppercase">Total: {users.length}</div>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No students registered for this school yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{user.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.targetCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.subscriptionStatus.startsWith('PREMIUM') 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.lastActiveAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/schools/${schoolId}/students/${user.id}/progress`}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View Progress
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
