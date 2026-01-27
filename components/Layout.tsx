import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { LOGO_URL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
  variant?: 'default' | 'danger';
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showBack = false,
  action,
  variant = 'default'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ fullName: string | null, avatarUrl: string | null }>({ fullName: null, avatarUrl: null });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('usuarios')
          .select('nome_completo, avatar_url')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setProfile({ fullName: data.nome_completo, avatarUrl: data.avatar_url });
        }
      };

      fetchProfile();
    }
  }, [user]);

  const titleColor = variant === 'danger' ? 'text-red-600 dark:text-red-500 uppercase' : 'text-slate-900 dark:text-white';
  const headerBorder = variant === 'danger' ? 'border-red-100 dark:border-red-900' : 'border-slate-200 dark:border-slate-800';

  const menuItems = [
    { icon: 'speed', label: 'Dashboard', path: '/dashboard' },
    { icon: 'group', label: 'Clientes', path: '/clients' },
    { icon: 'sell', label: 'Temas', path: '/settings' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-50">
        <div className="p-6 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800 h-[120px]">
          <img src={LOGO_URL} alt="CKDEV Soluções" className="h-full w-auto object-contain max-h-16 dark:invert dark:hue-rotate-180" />
        </div>
        <nav className="flex-1 py-6 space-y-2 px-3">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path)
                ? 'bg-orange-50 dark:bg-orange-900/20 text-primary font-semibold'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <Icon name={item.icon} filled={isActive(item.path)} className={isActive(item.path) ? '' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors w-full" title="Sair do sistema" aria-label="Sair do sistema">
            <Icon name="logout" className="text-lg" />
            <span>Sair</span>
          </button>
        </div>
      </aside>


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 relative">
        {/* Header */}
        <header className={`sticky top-0 z-40 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b ${headerBorder} px-4 py-3 flex items-center justify-between h-16`}>
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors -ml-2 shrink-0"
                title="Voltar"
                aria-label="Voltar para a página anterior"
              >
                <Icon name="arrow_back" />
              </button>
            )}
            <h1 className={`text-lg font-bold ${titleColor} truncate`}>{title}</h1>
          </div>

          {/* Mobile Branding & Logout */}
          <div className="flex items-center md:hidden gap-3 shrink-0">
            <img src={LOGO_URL} alt="CKDEV" className="h-8 w-auto object-contain dark:invert dark:hue-rotate-180" />
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sair do sistema"
              aria-label="Sair"
            >
              <Icon name="logout" />
            </button>
          </div>

          {/* Desktop User Profile (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-sm font-bold dark:text-white truncate max-w-[200px]">
                {profile.fullName || 'Usuário'}
              </p>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                {user?.email}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center border border-primary/20 overflow-hidden bg-primary/10">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Icon name="person" className="text-primary" />
              )}
            </div>
          </div>

        </header>

        {/* Content */}
        {/* Added pb-24 for mobile bottom nav spacing */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-8 md:px-8 md:max-w-5xl md:mx-auto w-full">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-2 py-3 pb-6 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {menuItems.map((item, index) => (
            <button
              key={`${item.path}-${index}`}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <Icon
                name={item.icon}
                filled={isActive(item.path)}
                className={`text-2xl transition-colors ${isActive(item.path) ? 'text-active-green' : 'text-inactive-grey'}`}
              />
              <span className={`text-[10px] font-medium transition-colors ${isActive(item.path) ? 'text-active-green font-semibold' : 'text-inactive-grey'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};