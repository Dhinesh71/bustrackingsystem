import React, { useState } from 'react';
import { Bus, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AdminLogin: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 animate-fade-in-up">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-2xl">
              <Bus className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
            Admin Portal
          </h2>
          <p className="text-slate-600 text-lg">
            Sign in to access the fleet management dashboard
          </p>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div className="card-elevated p-10">
            {error && (
              <div className="mb-6 p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center">
                <div className="p-2 bg-rose-100 rounded-xl mr-3">
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                </div>
                <span className="text-rose-700 font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-8">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-3">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <div className="p-2 bg-slate-100 rounded-xl group-focus-within:bg-blue-100 transition-colors">
                      <User className="h-5 w-5 text-slate-600 group-focus-within:text-blue-600" />
                    </div>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-modern pl-16 h-14 text-base group-hover:shadow-md"
                    placeholder="admin@bustrack.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <div className="p-2 bg-slate-100 rounded-xl group-focus-within:bg-blue-100 transition-colors">
                      <Lock className="h-5 w-5 text-slate-600 group-focus-within:text-blue-600" />
                    </div>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-modern pl-16 h-14 text-base group-hover:shadow-md"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-14 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <div className="mt-8 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-sm text-slate-600 font-medium">
                  Demo Credentials
                </p>
                <p className="text-xs text-slate-500 mt-1">
                Demo credentials: admin@bustrack.com / password123
                </p>
              </div>
            </div>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
};