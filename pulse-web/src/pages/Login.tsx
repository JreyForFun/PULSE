import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signInWithOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email to receive a magic link.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signInWithOtp(email);
      setMagicLinkSent(true);
    } catch (err: any) {
      console.error("Magic link failed", err);
      setError(err.message || 'Failed to send magic link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg transform rotate-3">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PULSE</h1>
          <p className="text-gray-500">Public Unified Local Health Engine</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {magicLinkSent ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
            <p className="font-bold">Magic Link Sent! ✨</p>
            <p className="text-sm mt-1">Check your email ({email}) for the login link.</p>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-xs text-green-600 hover:text-green-800 underline mt-2">
              Use Password Instead
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="bhw@pulse.gov.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1">
              <div className="flex justify-between">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full justify-center py-3" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-center py-3"
                disabled={isLoading}
                onClick={handleMagicLink}
              >
                Send Magic Link
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-gray-400">
          Authorized Personnel Only • Brgy. Santa Rosa Health Center
        </p>
      </div>
    </div>
  );
}
