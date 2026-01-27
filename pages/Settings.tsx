import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { ThemeMode } from '../types';

const Settings: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.LIGHT);
  const [primaryColor, setPrimaryColor] = useState('#f2711c');

  // Simple Theme Toggle Logic
  useEffect(() => {
    if (theme === ThemeMode.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const ColorOption = ({ color, bgColorClass, selected }: { color: string, bgColorClass: string, selected: boolean }) => (
    <button
      onClick={() => setPrimaryColor(color)}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95 ${bgColorClass} ${selected ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500' : ''}`}
      title={`Selecionar cor ${color}`}
      aria-label={`Selecionar cor ${color}`}
    >
      {selected && <Icon name="check" className="text-white drop-shadow-md" />}
    </button>
  );

  return (
    <Layout title="Ajustes de Tema e Aparência" showBack={true}>
      <div className="p-4 space-y-8">

        {/* Theme Mode Section */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Modo de Tema</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">

            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setTheme(ThemeMode.LIGHT)}>
              <span className="font-medium dark:text-white">Claro</span>
              <div className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors ${theme === ThemeMode.LIGHT ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${theme === ThemeMode.LIGHT ? 'translate-x-5' : ''}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setTheme(ThemeMode.DARK)}>
              <span className="font-medium dark:text-white">Escuro</span>
              <div className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors ${theme === ThemeMode.DARK ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${theme === ThemeMode.DARK ? 'translate-x-5' : ''}`}></div>
              </div>
            </div>

          </div>
        </section>

        {/* Customization Section */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Personalização</h3>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-6">

            <div>
              <p className="font-medium dark:text-white mb-3">Cor Primária da Marca</p>
              <div className="flex gap-4">
                <ColorOption color="#0ea5e9" bgColorClass="bg-[#0ea5e9]" selected={primaryColor === '#0ea5e9'} />
                <ColorOption color="#22c55e" bgColorClass="bg-[#22c55e]" selected={primaryColor === '#22c55e'} />
                <ColorOption color="#ef4444" bgColorClass="bg-[#ef4444]" selected={primaryColor === '#ef4444'} />
                <ColorOption color="#a855f7" bgColorClass="bg-[#a855f7]" selected={primaryColor === '#a855f7'} />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center"></div>
                  <span className="text-[10px] text-slate-500 mt-1">Personal...</span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-700" />

            <div>
              <p className="font-medium dark:text-white mb-3">Cor da Fonte</p>
              <div className="flex gap-4">
                <button className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center ring-2 ring-offset-2 ring-slate-400" title="Cor cinza escuro" aria-label="Selecionar fonte cinza escuro">
                  <Icon name="check" className="text-white" />
                </button>
                <button className="w-12 h-12 rounded-full bg-black border border-slate-200" title="Cor preta" aria-label="Selecionar fonte preta"></button>
                <button className="w-12 h-12 rounded-full bg-blue-900" title="Cor azul" aria-label="Selecionar fonte azul"></button>
              </div>
            </div>

          </div>
        </section>

        <button className="w-full text-red-500 py-4 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors" title="Redefinir padrões" aria-label="Redefinir configurações para os padrões">
          Redefinir Padrões
        </button>

      </div>
    </Layout>
  );
};

export default Settings;