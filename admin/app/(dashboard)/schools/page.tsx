'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  totalBranches: number;
  createdAt: number;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools`);
      const data = await res.json();
      setSchools(data.schools || []);
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading schools...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏫 Driving Schools</h1>
        <p className="text-gray-600 mt-2">Manage driving schools and their branches</p>
      </div>

      {schools.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No schools found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{school.name}</div>
                    <div className="text-sm text-gray-500">{school.registrationNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{school.town}</div>
                    <div className="text-sm text-gray-500">{school.county}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{school.phone}</div>
                    <div className="text-sm text-gray-500">{school.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {school.totalBranches > 0 ? (
                      <Link
                        href={`/schools/${school.id}/branches`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {school.totalBranches} {school.totalBranches === 1 ? 'branch' : 'branches'}
                      </Link>
                    ) : (
                      <span className="text-gray-400">0 branches</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        school.isVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {school.isVerified ? '✓ Verified' : 'Pending'}
                    </span>
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
