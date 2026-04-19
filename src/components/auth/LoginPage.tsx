import React, { useState } from 'react';
import { LogIn, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regPasswordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (regPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(regUsername, regEmail, regPassword);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-d4-bg via-d4-surface to-d4-bg flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-d4-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-d4-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-d4-accent drop-shadow-lg" />
            <h1 className="text-5xl font-black text-d4-accent drop-shadow-lg tracking-wide">
              D4 BUILDS
            </h1>
          </div>
          <p className="text-d4-text-dim uppercase tracking-widest text-sm">
            Build Manager para Diablo IV
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`py-3 px-4 rounded-lg font-bold transition-all ${
                isLoginMode
                  ? 'bg-d4-accent text-black'
                  : 'bg-d4-border text-d4-text-dim hover:bg-d4-border/80'
              }`}
            >
              <LogIn className="w-5 h-5 inline-block mr-2" />
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`py-3 px-4 rounded-lg font-bold transition-all ${
                !isLoginMode
                  ? 'bg-d4-accent text-black'
                  : 'bg-d4-border text-d4-text-dim hover:bg-d4-border/80'
              }`}
            >
              <UserPlus className="w-5 h-5 inline-block mr-2" />
              Registrarse
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-600/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-d4-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-d4-bg border-2 border-d4-border rounded-lg text-d4-text focus:border-d4-accent focus:outline-none transition-colors"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-d4-text mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-d4-bg border-2 border-d4-border rounded-lg text-d4-text focus:border-d4-accent focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-d4-text mb-2">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-d4-bg border-2 border-d4-border rounded-lg text-d4-text focus:border-d4-accent focus:outline-none transition-colors"
                  placeholder="nombreusuario"
                  minLength={3}
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-d4-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-d4-bg border-2 border-d4-border rounded-lg text-d4-text focus:border-d4-accent focus:outline-none transition-colors"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-d4-text mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-d4-bg border-2 border-d4-border rounded-lg text-d4-text focus:border-d4-accent focus:outline-none transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-d4-text mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-d4-bg border-2 border-d4-border rounded-lg text-d4-text focus:border-d4-accent focus:outline-none transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>

              <p className="text-xs text-d4-text-dim text-center">
                Al registrarte, comienzas con una cuenta <strong>Basic</strong>.
                Podrás actualizar a <strong className="text-d4-accent">Premium</strong> después.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-d4-text-dim text-sm mt-6">
          v0.7.0 - © 2026 D4Builds by Zapato
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
