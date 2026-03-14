import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { Icon } from '../components/Icon';

import { getAuthRedirectUrl, translateSupabaseError } from '../auth';
import { supabase } from '../supabase';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    password: location.state?.password || '',
    confirmPassword: location.state?.password || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const NAME_REGEX = /[^a-zA-Z\u00C0-\u00FF\s]/g;
  const EMAIL_REGEX = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'O nome e obrigatorio.';
        return '';
      case 'email':
        if (!value.trim()) return 'O e-mail e obrigatorio.';
        if (!EMAIL_REGEX.test(value)) return 'Formato de e-mail invalido.';
        return '';
      case 'password':
        if (!value) return 'A senha e obrigatoria.';
        if (!STRONG_PASSWORD_REGEX.test(value)) return 'Senha fraca. Minimo 8 caracteres, letra maiuscula, minuscula, numero e especial.';
        return '';
      case 'confirmPassword':
        if (!value) return 'A confirmacao e obrigatoria.';
        if (value !== formData.password) return 'As senhas nao coincidem.';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, _ref: React.RefObject<HTMLInputElement>) => {
    const value = formData[field as keyof typeof formData];
    const error = validateField(field, value);

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      const value = formData[field as keyof typeof formData];
      const error = validateField(field, value);

      if (error) {
        e.preventDefault();
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    if (field === 'name') {
      value = value.toUpperCase().replace(NAME_REGEX, '');
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const newErrors: { [key: string]: string } = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key as keyof typeof formData]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = '';

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `avatars/temp/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          data: {
            nome_completo: formData.name,
            avatar_url: avatarUrl
          }
        }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Cadastro realizado com sucesso. Verifique seu e-mail para confirmar a conta.' });

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: translateSupabaseError(err?.message) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center animate-fade-in-up relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Voltar para Login"
        >
          <Icon name="close" className="text-xl" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <img
            src={LOGO_URL}
            alt="CKDEV Solucoes"
            className="h-20 w-auto object-contain mb-2 dark:invert dark:hue-rotate-180"
          />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">Crie sua conta</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados abaixo para comecar</p>
        </div>

        <form onSubmit={handleRegister} className="w-full space-y-5" autoComplete="off">
          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-primary transition-colors">
                    <Icon name="person" className="text-4xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="edit" className="text-white text-xl" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full border-2 border-white dark:border-slate-900 shadow-md z-10"
                title="Selecionar foto"
                aria-label="Selecionar foto"
              >
                <Icon name="photo_camera" className="text-sm" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              title="Upload Avatar"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
              aria-label="Selecionar arquivo de avatar"
            />
          </div>

          <input type="text" name="fake_email_prevent_autofill" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <input type="password" name="fake_password_prevent_autofill" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <input type="text" name="fake_name_prevent_autofill" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <div className="space-y-1">
            <input
              ref={nameRef}
              type="text"
              name="reg_name_new"
              id="reg_name_new"
              autoComplete="off"
              placeholder="Nome Completo"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              onBlur={() => handleBlur('name', nameRef)}
              onKeyDown={(e) => handleKeyDown(e, 'name')}
              className={`w-full bg-slate-100 dark:bg-slate-800 border ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent'} rounded-lg p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400`}
              required
              aria-label="Nome Completo"
            />
            {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <input
              ref={emailRef}
              type="email"
              name="reg_email_new"
              id="reg_email_new"
              autoComplete="off"
              placeholder="E-mail"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => handleBlur('email', emailRef)}
              onKeyDown={(e) => handleKeyDown(e, 'email')}
              className={`w-full bg-slate-100 dark:bg-slate-800 border ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent'} rounded-lg p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400`}
              required
              aria-label="E-mail"
            />
            {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                name="reg_pass_new"
                id="reg_pass_new"
                autoComplete="new-password"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                onBlur={() => handleBlur('password', passwordRef)}
                onKeyDown={(e) => handleKeyDown(e, 'password')}
                className={`w-full bg-slate-100 dark:bg-slate-800 border ${errors.password ? 'border-red-500 ring-1 ring-500' : 'border-transparent'} rounded-lg p-4 pr-12 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400`}
                required
                aria-label="Senha"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Esconder senha' : 'Mostrar senha'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors" tabIndex={-1} aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}>
                <Icon name={showPassword ? 'visibility' : 'visibility_off'} />
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 ml-1 leading-tight">{errors.password}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                ref={confirmPasswordRef}
                type={showConfirmPassword ? 'text' : 'password'}
                name="reg_confirm_pass_new"
                id="reg_confirm_pass_new"
                autoComplete="new-password"
                placeholder="Confirmar Senha"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword', confirmPasswordRef)}
                onKeyDown={(e) => handleKeyDown(e, 'confirmPassword')}
                className={`w-full bg-slate-100 dark:bg-slate-800 border ${errors.confirmPassword ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent'} rounded-lg p-4 pr-12 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400`}
                required
                aria-label="Confirmar Senha"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? 'Esconder confirmacao' : 'Mostrar confirmacao'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors" tabIndex={-1} aria-label={showConfirmPassword ? 'Esconder confirmacao de senha' : 'Mostrar confirmacao de senha'}>
                <Icon name={showConfirmPassword ? 'visibility' : 'visibility_off'} />
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 ml-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            title="Criar nova conta"
            aria-label="Criar nova conta"
            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Icon name="person_add" />
                Cadastrar
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4 text-sm w-full">
          <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
          <p className="text-slate-500 dark:text-slate-400">
            Ja possui uma conta?{' '}
            <button
              onClick={() => navigate('/')}
              className="text-primary hover:text-orange-600 font-semibold"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
