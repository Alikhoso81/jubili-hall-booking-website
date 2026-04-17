import { useState } from 'react';
import { Crown, Lock, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { saveAdminSession } from '../lib/adminAuth';
import { AdminUser, Page } from '../lib/types';

interface AdminLoginProps {
  onNavigate: (page: Page) => void;
  onLogin: (admin: AdminUser) => void;
}

export default function AdminLogin({ onNavigate, onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('authenticate_admin', {
        p_username: username.trim(),
        p_password: password,
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        setError('Invalid username or password. Please try again.');
        setLoading(false);
        return;
      }

      const admin: AdminUser = {
        id: data[0].id,
        username: data[0].username,
        display_name: data[0].display_name,
      };

      saveAdminSession(admin);
      onLogin(admin);
      onNavigate('admin-dashboard');
    } catch {
      setError('Login failed. Please check your credentials and try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1b0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => onNavigate('home')} className="inline-flex flex-col items-center group mb-6">
            <Crown className="w-12 h-12 text-[#C9A84C] group-hover:scale-110 transition-transform" />
            <span className="text-white font-bold text-2xl tracking-widest mt-2">JUBLII GROUP</span>
            <span className="text-[#C9A84C] text-xs tracking-[0.3em]">ADMIN PORTAL</span>
          </button>
          <p className="text-white/40 text-sm">Sign in to manage hall bookings</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-[#C9A84C] px-8 py-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#0d1b0f]" />
              <span className="font-bold text-[#0d1b0f] tracking-wider text-sm uppercase">Admin Login</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0d1b0f] hover:bg-[#1a3320] text-white py-3 rounded-xl font-semibold tracking-wider text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('home')}
            className="text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            ← Back to Website
          </button>
        </div>
      </div>
    </div>
  );
}
