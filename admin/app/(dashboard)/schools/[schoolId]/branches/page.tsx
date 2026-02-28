'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Branch {
  id: string;
  schoolId: string;
  branchName: string;
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  county: string;
  town: string;
  isActive: boolean;
  createdAt: number;
}

interface School {
  id: string;
  name: string;
}

export default function SchoolBranchesPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setAdminUser(user);
      if (user.role === 'SCHOOL_ADMIN' && user.schoolId !== schoolId) {
        router.push(`/schools/${user.schoolId}/branches`);
        return;
      }
    }
    loadData();
  }, [schoolId, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Use direct fetch for school metadata (it's public anyway)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dereva-smart-backend.pngobiro.workers.dev';
      const [schoolRes, branchesData] = await Promise.all([
        fetch(`${apiUrl}/api/schools/${schoolId}`),
        api.getSchoolBranches(schoolId),
      ]);

      const schoolData = await schoolRes.json();
      setSchool(schoolData);
      setBranches(branchesData.branches || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      branchName: formData.get('branchName'),
      location: formData.get('location'),
      contactPerson: formData.get('contactPerson'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      county: formData.get('county'),
      town: formData.get('town'),
    };

    try {
      await api.createBranch(schoolId, data);
      form.reset();
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Failed to create branch:', err);
      alert('Failed to create branch');
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('Delete this branch?')) return;

    try {
      await api.deleteBranch(schoolId, branchId);
      loadData();
    } catch (err) {
      console.error('Failed to delete branch:', err);
      alert('Failed to delete branch');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading branches...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        {adminUser?.role === 'SUPER_ADMIN' ? (
          <Link href="/schools" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Back to Schools
          </Link>
        ) : (
          <Link href={`/schools/${schoolId}`} className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Back to School
          </Link>
        )}
        <h1 className="text-3xl font-bold text-gray-900">🏢 Branches - {school?.name}</h1>
        <p className="text-gray-600 mt-2">{branches.length} branches</p>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ New Branch'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Branch Name</label>
              <input
                type="text"
                name="branchName"
                required
                placeholder="Main Branch"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                name="location"
                required
                placeholder="Westlands, Nairobi"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                placeholder="Branch Manager"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="+254712345678"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                placeholder="branch@school.com"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                name="address"
                placeholder="123 Main Street"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Town</label>
              <input
                type="text"
                name="town"
                placeholder="Nairobi"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">County</label>
              <input
                type="text"
                name="county"
                placeholder="Nairobi"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Branch
          </button>
        </form>
      )}

      {branches.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No branches yet</p>
          <p className="text-gray-400 text-sm mt-2">Click "New Branch" to add the first branch</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{branch.branchName}</div>
                    <div className="text-sm text-gray-500">{branch.location}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{branch.town}</div>
                    <div className="text-sm text-gray-500">{branch.county}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{branch.phone}</div>
                    {branch.email && <div className="text-sm text-gray-500">{branch.email}</div>}
                    {branch.contactPerson && (
                      <div className="text-sm text-gray-500">{branch.contactPerson}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        branch.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
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
