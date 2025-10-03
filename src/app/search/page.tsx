'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';  // Auth stuff here
import { collection, query, where, getDocs } from 'firebase/firestore';  // Firestore stuff here
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Check auth on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/'); // Redirect to login if not auth'd
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe(); // Cleanup
  }, [router]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setStudents([]); // Clear results if empty
      return;
    }
    setLoading(true);
    try {
      // Basic search: Query by name (prefix match, e.g., "John" finds "John Doe")
      const q = query(
        collection(db, 'students'),
        where('name', '>=', searchTerm.trim()),
        where('name', '<=', searchTerm.trim() + '\uf8ff') // Unicode trick for prefix end
      );
      const snapshot = await getDocs(q);
      setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed—check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (!user) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Student Directory Search</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.email}!</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by student name (e.g., John)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        {students.length > 0 ? (
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">{student.name || 'N/A'}</h3>
                <p className="text-gray-600"><strong>Grade:</strong> {student.grade || 'N/A'}</p>
                <p className="text-gray-600"><strong>ID:</strong> {student.id || 'N/A'}</p>
                {/* Add more fields here based on your CSV, e.g., <p><strong>Email:</strong> {student.email}</p> */}
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <p className="text-center text-gray-500 py-8">No students found matching "{searchTerm}". Try another name.</p>
        ) : (
          <p className="text-center text-gray-500 py-8 italic">Enter a name above to start searching.</p>
        )}
      </div>
    </div>
  );
}