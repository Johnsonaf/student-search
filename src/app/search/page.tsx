'use client';
import { useState, useEffect, FormEvent, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import Image from 'next/image';

// Paste your interface here
interface Student {
  id: string;
  key: string;
  class: string;          // 'Class' column
  classNo: string;        // 'Class No.' column (note: spaces become camelCase)
  englishName: string;    // 'English Name' column
  house: string;          // 'House' column
  // Add more, e.g., grade?: string; email?: string;
}

interface MatchScore {
  exact: number;
  prefix: number;
  contains: number;
  earliestIndex: number;
}

const houseAssetMap: Record<string, string> = {
  faith: '/Pic/Faith.png',
  justice: '/Pic/Justice.png',
  kindness: '/Pic/Kindness.png',
  courtesy: '/Pic/Courtesy.png',
  wisdom: '/Pic/Wisdom.png',
};

const readStringField = (data: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    if (!(key in data)) continue;
    const value = data[key];
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
};

const computeMatchScore = (student: Student, tokens: string[]): MatchScore => {
  if (tokens.length === 0) {
    return { exact: 0, prefix: 0, contains: 0, earliestIndex: Number.MAX_SAFE_INTEGER };
  }

  const fields: Array<{ value: string; weight: number }> = [
    { value: student.key ?? '', weight: 6 },
    { value: student.class ?? '', weight: 4 },
    { value: student.classNo ?? '', weight: 4 },
    { value: student.englishName ?? '', weight: 3 },
    { value: student.house ?? '', weight: 2 },
  ];

  let exact = 0;
  let prefix = 0;
  let contains = 0;
  let earliestIndex = Number.MAX_SAFE_INTEGER;

  for (const token of tokens) {
    for (const field of fields) {
      const candidate = field.value.toLowerCase();
      if (!candidate) continue;
      const position = candidate.indexOf(token);
      if (position === -1) continue;

      if (candidate === token) {
        exact += 10 * field.weight;
        earliestIndex = Math.min(earliestIndex, position);
        continue;
      }

      if (position === 0) {
        prefix += 5 * field.weight;
      } else {
        contains += 1 * field.weight;
      }
      earliestIndex = Math.min(earliestIndex, position);
    }
  }

  if (earliestIndex === Number.MAX_SAFE_INTEGER) {
    earliestIndex = Number.MAX_SAFE_INTEGER - 1;
  }

  return { exact, prefix, contains, earliestIndex };
};

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const userInitial = useMemo(() => {
    if (!user?.email) return '?';
    return user.email.charAt(0).toUpperCase();
  }, [user?.email]);

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

const handleSearch = async (event?: FormEvent<HTMLFormElement>) => {
  event?.preventDefault();
  if (!searchTerm.trim()) {
    setStudents([]); // Clear results if empty
    return;
  }
  setLoading(true);
  try {
    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    console.log('Searching for lowercase term:', lowerSearchTerm);

    const snapshot = await getDocs(collection(db, 'students'));
    const rawStudents = snapshot.docs.map((doc) => {
      const data = doc.data();
      const normalized = {
        id: doc.id,
        key: readStringField(data, ['key', 'Key', 'KEY']),
        class: readStringField(data, ['class', 'Class', 'className', 'Class Name']),
        classNo: readStringField(data, ['classNo', 'ClassNo', 'Class No', 'Class No.']),
        englishName: readStringField(data, ['englishName', 'EnglishName', 'English Name']),
        house: readStringField(data, ['house', 'House']),
        // Add more fields as needed, e.g., grade: readStringField(data, ['grade', 'Grade'])
      } satisfies Student;
      console.log('Normalized student:', normalized, 'from raw data:', data);
      return normalized;
    });

    const tokens = lowerSearchTerm.split(/\s+/).filter(Boolean);
    const filteredResults = rawStudents.filter((student) => {
      if (tokens.length === 0) return true;
      const haystack = [
        student.englishName,
        student.key,
        student.class,
        student.classNo,
        student.house,
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });

    const scored = filteredResults.map((student) => ({
      student,
      score: computeMatchScore(student, tokens),
    }));

    scored.sort((a, b) => {
      if (b.score.exact !== a.score.exact) return b.score.exact - a.score.exact;
      if (b.score.prefix !== a.score.prefix) return b.score.prefix - a.score.prefix;
      if (b.score.contains !== a.score.contains) return b.score.contains - a.score.contains;
      if (a.score.earliestIndex !== b.score.earliestIndex) return a.score.earliestIndex - b.score.earliestIndex;
      return a.student.englishName.localeCompare(b.student.englishName);
    });

    const orderedResults = scored.map((entry) => entry.student);

    console.log('Filtered results:', orderedResults);
    setStudents(orderedResults);
    console.log('Students set to:', orderedResults);  // Log after state update
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
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_65%)]" />
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* Header with Logout */}
        <header className="pt-10 pb-8">
          <div className="flex flex-col gap-6 rounded-3xl bg-slate-900/70 backdrop-blur border border-white/10 p-8 shadow-[0_20px_60px_rgba(15,_23,_42,_0.45)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">HKBUAS</p>
                <h1 className="text-3xl md:text-4xl font-semibold text-white">Not So Quick Searcher by JC</h1>
                <p className="mt-2 text-slate-300 max-w-xl">
                  A tribute to Quick Search by JK
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 text-lg font-semibold shadow-lg">
                  {userInitial}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-slate-300">Logged in as</span>
                  <span className="font-medium text-white">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-slate-800 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  <span className="relative">Logout</span>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Encrypted connection
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Auto-synced with Firebase
              </span>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <section className="relative -mt-10 mb-10">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur px-6 py-6 shadow-[0_18px_40px_rgba(15,_23,_42,_0.4)]">
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <label className="text-sm font-medium text-slate-300" htmlFor="search-input">
                What are you looking for?
              </label>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <svg
                      aria-hidden
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </span>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search by name, key, class, or house..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-full border border-white/10 bg-slate-900/60 py-4 pl-12 pr-5 text-base text-white shadow-inner outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/70"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Searching...
                    </span>
                  ) : (
                    'Search directory'
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Pro tip: You can search with keywords like <span className="font-semibold text-slate-200">&ldquo;1a1&rdquo;</span> to narrow results instantly.
              </p>
            </form>
          </div>
        </section>

        {/* Result summary */}
        {students.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Showing {students.length} {students.length === 1 ? 'match' : 'matches'}
            </span>
            <span className="text-xs text-slate-400">Search term: {searchTerm}</span>
          </div>
        )}

        {/* Results */}
        {students.length > 0 ? (
          <div className="space-y-5">
            {students.map((student) => {
              const houseKey = student.house?.trim().toLowerCase() ?? '';
              const houseIcon = houseAssetMap[houseKey];

              return (
              <article
                key={student.id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/70 p-6 shadow-[0_16px_40px_rgba(15,_23,_42,_0.35)] transition hover:-translate-y-1 hover:border-sky-400/60 hover:shadow-[0_22px_60px_rgba(56,_189,_248,_0.25)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-500 opacity-0 transition group-hover:opacity-100" />
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold text-white">{student.englishName || 'N/A'}</h3>
                  <span className="inline-flex items-center justify-center rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-sky-200">
                    {student.key || 'N/A'}
                  </span>
                </header>
                <dl className="mt-5 space-y-3 text-sm text-slate-300">
                  <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Class</dt>
                    <dd className="mt-1 text-base font-medium text-white">{student.class || 'N/A'}</dd>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Class No.</dt>
                    <dd className="mt-1 text-base font-medium text-white">{student.classNo || 'N/A'}</dd>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">House</dt>
                    <dd className="mt-1 flex items-center gap-3 text-base font-medium text-white">
                      {houseIcon && (
                        <Image
                          src={houseIcon}
                          alt={`${student.house} emblem`}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full border border-white/20 bg-white/10 p-1 object-contain"
                        />
                      )}
                      <span>{student.house || 'N/A'}</span>
                    </dd>
                  </div>
                </dl>
              </article>
            );
            })}
          </div>
        ) : searchTerm ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/70 p-12 text-center text-slate-300">
            <h3 className="text-xl font-semibold text-white">No matches for &ldquo;{searchTerm}&rdquo;</h3>
            <p className="mt-3 text-sm text-slate-400">
              Double-check spelling, try student initials, or combine keywords like <span className="font-semibold text-slate-200">&ldquo;key house&rdquo;</span> to widen the search.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-12 text-center text-slate-300">
            <h3 className="text-xl font-semibold text-white">Ready when you are</h3>
            <p className="mt-3 text-sm text-slate-400">
              Begin by typing a name, key, or class. Hit <span className="font-semibold text-slate-100">Enter</span> or tap
              the search button to explore the directory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}