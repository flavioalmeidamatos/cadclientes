import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';

interface Cliente {
  id: string;
  nome_completo: string;
  cidade: string;
  estado: string;
  avatar_url: string | null;
}

const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClientes = async () => {
    if (!user) return;
    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    setLoading(true);
    try {
      let query = supabase
        .from('clientes')
        .select('id, nome_completo, cidade, estado, avatar_url');

      if (!isAdmin) {
        query = query.eq('usuario_id', user.id);
      }

      const { data, error } = await query.order('criado_em', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [user]);

  const filteredClientes = clientes.filter(c =>
    c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  return (
    <Layout title={isAdmin ? "Todos os Clientes" : "Meus Clientes"}>
      <div className="p-4">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-white outline-none transition-all"
          />
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/clients/new')}
            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-transform active:scale-95"
          >
            <Icon name="add" />
            Adicionar Novo Cliente
          </button>
        </div>

        {/* List Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
            {loading ? 'Carregando...' : `Clientes (${filteredClientes.length})`}
          </h2>

          {filteredClientes.length === 0 && !loading && (
            <p className="text-center py-8 text-slate-500 text-sm">Nenhum cliente encontrado.</p>
          )}

          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              onClick={() => navigate(`/clients/edit/${cliente.id}`)}
              className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 overflow-hidden">
                {cliente.avatar_url ? (
                  <img src={cliente.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-sm">{cliente.nome_completo.substring(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">{cliente.nome_completo}</h3>
                <p className="text-xs text-slate-500 truncate">{cliente.cidade || 'Cidade não informada'} - {cliente.estado || 'UF'}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/clients/edit/${cliente.id}`); }}
                  className="p-2 text-primary hover:bg-orange-50 dark:hover:bg-slate-600 rounded-full transition-colors"
                  title="Editar Cliente"
                  aria-label="Editar Cliente"
                >
                  <Icon name="edit" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/clients/delete/${cliente.id}`); }}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                  title="Excluir Cliente"
                  aria-label="Excluir Cliente"
                >
                  <Icon name="delete" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ClientList;