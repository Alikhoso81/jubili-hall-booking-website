import { useState } from 'react';
import { Crown, Lock, Mail, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';

type Mode = 'signin' | 'signup';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { error: err, needsConfirmation } = await signUp(email, password);
      if (err) {
        setError(/already registered/i.test(err) ? 'That email already has an account — sign in instead.' : err);
        setLoading(false);
      } else if (needsConfirmation) {
        setConfirmSent(true);
        setLoading(false);
      }
      // else: auth listener swaps to the dashboard
      return;
    }

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(/invalid login credentials/i.test(err) ? 'Incorrect email or password.' : err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1b0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center mb-6">
            <Crown className="w-12 h-12 text-[#C9A84C]" />
            <span className="text-white font-bold text-2xl tracking-widest mt-2">JUBLII GROUP</span>
            <span className="text-[#C9A84C] text-xs tracking-[0.3em]">BOOKING MANAGER</span>
          </div>
          <p className="text-white/40 text-sm">{mode === 'signin' ? 'Staff sign in' : 'Create your staff account'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError('');
                  setConfirmSent(false);
                }}
                className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase transition-colors ${
                  mode === m ? 'bg-[#C9A84C] text-[#0d1b0f]' : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {confirmSent ? (
            <div className="p-8 text-center">
              <MailCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-[#0d1b0f]">Check your email</p>
              <p className="text-gray-500 text-sm mt-1">
                We sent a confirmation link to <span className="font-medium">{email}</span>. Click it, then come back and sign in.
              </p>
              <button
                onClick={() => {
                  setMode('signin');
                  setConfirmSent(false);
                }}
                className="mt-5 text-sm font-semibold text-[#8a6d24]"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>

              {mode === 'signup' && (
                <p className="text-gray-400 text-xs text-center">
                  Use the email your admin invited. Your access level is set from the invite.
                </p>
              )}
            </form>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">Authorised staff only.</p>
      </div>
    </div>
  );
}
