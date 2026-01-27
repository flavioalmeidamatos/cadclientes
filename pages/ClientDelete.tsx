import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { MAP_IMAGE_URL } from '../constants';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

const ClientDelete: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState<any>(null);

    useEffect(() => {
        const fetchClient = async () => {
            if (!id) return;
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('id', id)
                .single();

            if (data && !error) {
                setClient(data);
            } else {
                alert('Erro ao carregar dados do cliente.');
                navigate('/clients');
            }
        };
        fetchClient();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (!id || !user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Cliente excluído com sucesso!');
            navigate('/clients');
        } catch (error: any) {
            console.error('Erro ao excluir cliente:', error);
            alert('Erro ao excluir cliente: ' + (error.message || 'Erro desconhecido.'));
        } finally {
            setLoading(false);
        }
    };

    if (!client) return (
        <Layout title="Carregando...">
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        </Layout>
    );

    return (
        <Layout title="EXCLUSÃO de Cliente" variant="danger" showBack={true}>

            {/* Danger Banner */}
            <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg flex gap-3">
                <Icon name="delete_forever" className="text-red-500 text-xl leading-none" />
                <p className="text-sm text-red-700 dark:text-red-300 leading-tight font-medium">
                    Atenção: Você está prestes a excluir este registro. Esta ação não poderá ser desfeita.
                </p>
            </div>

            <div className="flex justify-center my-6">
                <div className="w-28 h-28 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center relative overflow-hidden border-4 border-red-100">
                    {client.avatar_url ? (
                        <img src={client.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <Icon name="person" className="text-slate-400 dark:text-slate-500 text-7xl" />
                    )}
                </div>
            </div>

            <div className="px-4 space-y-6">
                <section className="space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Dados do Cliente</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Confirme as informações antes da exclusão.</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nome Completo</label>
                        <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-md text-sm p-3 dark:text-white opacity-75">
                            {client.nome_completo}
                        </div>
                    </div>
                </section>

                <hr className="border-slate-100 dark:border-slate-800" />

                <section className="space-y-4">
                    <h2 className="text-xs font-bold text-primary tracking-widest uppercase">Localização</h2>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Endereço</label>
                            <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-md text-sm p-3 dark:text-white opacity-75 leading-relaxed">
                                {client.logradouro}, {client.numero}<br />
                                {client.bairro} - {client.cep}<br />
                                {client.cidade} - {client.estado}<br />
                                {client.complemento && <span className="text-xs italic">({client.complemento})</span>}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="pt-4 pb-8">
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className={`w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-500/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        title="Confirmar Exclusão"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <Icon name="delete_forever" />
                                Confirmar Exclusão
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default ClientDelete;