import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';

import { supabase } from '../supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // State for errors
  const [errors, setErrors] = useState({ username: '', password: '' });

  // Refs for Focus Trapping
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  // Ref to track which field currently holds the "focus lock"
  const focusLockRef = useRef<string | null>(null);

  // RFC 5322 Official Standard Regex (Practical Implementation)
  const EMAIL_REGEX = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  const validate = (field: 'username' | 'password', value: string) => {
    if (!value.trim()) return 'Campo obrigatório';

    if (field === 'username') {
      if (!EMAIL_REGEX.test(value)) {
        return 'Formato de e-mail inválido';
      }
    }

    return '';
  };

  // Handle Focus Trap on Blur (Mouse click away)
  const handleBlur = (
    field: 'username' | 'password',
    value: string,
    _ref: React.RefObject<HTMLInputElement>
  ) => {
    const error = validate(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
      // Temporarily disabled focus forcing to prevent infinite loops during mouse interaction
      /*
      focusLockRef.current = field; // Acquire lock
      setTimeout(() => {
        ref.current?.focus();
      }, 0);
      */
    } else {
      setErrors(prev => ({ ...prev, [field]: '' }));
      // Release lock if this field held it
      if (focusLockRef.current === field) {
        focusLockRef.current = null;
      }
    }
  };

  // Handle Focus Trap on KeyDown (Tab/Enter)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'username' | 'password',
    value: string
  ) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      const error = validate(field, value);
      if (error) {
        e.preventDefault(); // Stop movement
        setErrors(prev => ({ ...prev, [field]: error }));
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const userError = validate('username', username);
    const passError = validate('password', password);

    if (userError || passError) {
      setErrors({ username: userError, password: passError });

      // Prioritize focusing the first error and set lock
      if (userError) {
        userRef.current?.focus();
        focusLockRef.current = 'username';
      } else if (passError) {
        passRef.current?.focus();
        focusLockRef.current = 'password';
      }
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        // If user not found (or invalid credentials), redirect to register
        if (error.message.includes('Invalid login credentials') || error.status === 400) {
          navigate('/register', { state: { email: username, password: password } });
          return;
        }
        throw error;
      }

      if (data.user) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      let friendlyMessage = 'Erro ao realizar login.';
      if (err.message.includes('Email not confirmed')) {
        friendlyMessage = 'Por favor, confirme seu e-mail antes de entrar.';
      } else if (err.message.includes('Invalid login credentials')) {
        friendlyMessage = 'Credenciais inválidas.';
      } else {
        friendlyMessage = err.message || 'Ocorreu um erro inesperado.';
      }
      setLoginError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-4">

      {/* Login Card Container with Border and Shadow */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">

        <div className="flex flex-col items-center mb-8">
          <img
            src={LOGO_URL}
            alt="CKDEV Soluções"
            className="h-24 w-auto object-contain mb-2 dark:invert dark:hue-rotate-180"
          />
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-4" autoComplete="off">

          {loginError && (
            <div className="p-4 rounded-xl bg-red-100 text-red-700 text-sm font-medium dark:bg-red-900/30 dark:text-red-400">
              {loginError}
            </div>
          )}

          {/* 
            Anti-Autofill Hack: 
            Hidden inputs to trick browser heuristics (especially Chrome) into filling these instead of the real ones.
          */}
          <input type="text" name="fake_email_prevent_autofill" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <input type="password" name="fake_password_prevent_autofill" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <div className="space-y-1">
            <input
              ref={userRef}
              type="email"
              name="login_user_new" // Non-standard name to avoid heuristics
              id="login_user_new"
              autoComplete="off" // Explicitly off
              placeholder="E-mail"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                // Clear error immediately if user starts typing (improves UX inside trap)
                if (errors.username) {
                  const currentError = validate('username', e.target.value);
                  if (!currentError) {
                    setErrors(prev => ({ ...prev, username: '' }));
                    if (focusLockRef.current === 'username') focusLockRef.current = null;
                  }
                }
              }}
              onBlur={() => handleBlur('username', username, userRef)}
              onKeyDown={(e) => handleKeyDown(e, 'username', username)}
              aria-label="E-mail"
              title="E-mail"
              className={`w-full bg-slate-100 dark:bg-slate-800 border ${errors.username ? 'border-red-500 ring-1 ring-red-500' : 'border-none'} rounded-lg p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400`}
            />
            {errors.username && <p className="text-xs text-red-500 ml-1">{errors.username}</p>}
          </div>

          <div className="space-y-1">
            <input
              ref={passRef}
              type="password"
              name="login_pass_new" // Non-standard name
              id="login_pass_new"
              autoComplete="new-password" // "new-password" is the strongest signal to stop 'current-password' autofill
              placeholder="Senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password && e.target.value.trim()) {
                  setErrors(prev => ({ ...prev, password: '' }));
                  if (focusLockRef.current === 'password') focusLockRef.current = null;
                }
              }}
              onBlur={() => handleBlur('password', password, passRef)}
              onKeyDown={(e) => handleKeyDown(e, 'password', password)}
              aria-label="Senha"
              title="Senha"
              className={`w-full bg-slate-100 dark:bg-slate-800 border ${errors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-none'} rounded-lg p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400`}
            />
            {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20 mt-4 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4 text-sm w-full">
          <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            Esqueceu a senha?
          </button>
          <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
          <button
            onClick={() => navigate('/register')}
            className="text-primary hover:text-orange-600 font-semibold mt-2"
          >
            Registrar-se
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;