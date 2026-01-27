import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Tooltip, XAxis } from 'recharts';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        active: 0,
        inactive: 0,
        growthData: [] as { name: string, value: number }[],
        canceledData: [] as { name: string, value: number }[],
        stateData: [] as { label: string, pct: number, color: string }[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const { data: clients, error } = await supabase
                    .from('clientes')
                    .select('*')
                    .eq('usuario_id', user.id);

                if (error) throw error;

                const activeCount = clients.filter(c => c.ativo !== false).length;
                const inactiveCount = clients.filter(c => c.ativo === false).length;

                // Meses em português
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const monthlyGrowth = new Array(12).fill(0);
                const monthlyCanceled = new Array(12).fill(0);

                clients.forEach(c => {
                    const date = new Date(c.criado_em);
                    const month = date.getMonth();
                    if (c.ativo !== false) {
                        monthlyGrowth[month]++;
                    } else {
                        monthlyCanceled[month]++;
                    }
                });

                const growthData = monthNames.map((name, i) => ({ name, value: monthlyGrowth[i] }));
                const canceledData = monthNames.map((name, i) => ({ name, value: monthlyCanceled[i] }));

                // Agrupamento por estado
                const states: Record<string, number> = {};
                clients.forEach(c => {
                    if (c.estado) {
                        const state = c.estado.toUpperCase();
                        states[state] = (states[state] || 0) + 1;
                    }
                });

                const totalClients = clients.length || 1;
                const stateData = Object.entries(states)
                    .map(([label, count]) => ({
                        label,
                        pct: Math.round((count / totalClients) * 100),
                        color: 'bg-primary'
                    }))
                    .sort((a, b) => b.pct - a.pct)
                    .slice(0, 5);

                setStats({ active: activeCount, inactive: inactiveCount, growthData, canceledData, stateData });
            } catch (err) {
                console.error('Erro ao buscar dados do dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    return (
        <Layout title="Dashboard">
            <div className="p-4 space-y-6">

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Clientes Ativos */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Clientes Ativos</span>
                        <p className="text-2xl font-bold text-active-green mt-1">
                            {loading ? '...' : stats.active}
                        </p>
                    </div>
                    {/* Clientes Desativados */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Clientes Desativados</span>
                        <p className="text-2xl font-bold text-red-500 mt-1">
                            {loading ? '...' : stats.inactive}
                        </p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Client Growth Bar Chart */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white">Novos Clientes (Anual)</h3>
                            <Icon name="trending_up" className="text-active-green" />
                        </div>
                        <div className="h-64 w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.growthData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={false}
                                        formatter={(value: number) => [value, 'Clientes']}
                                    />
                                    <Bar dataKey="value" fill="#f2711c" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Canceled Clients Line Chart */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 uppercase text-sm">Clientes Cancelados</h3>
                        <div className="h-64 w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.canceledData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorValueCanceled" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={false}
                                        formatter={(value: number) => [value, 'Cancelados']}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorValueCanceled)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Progress Bars */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Distribuição por Estado</h3>
                    <div className="space-y-4">
                        {stats.stateData.length > 0 ? (
                            stats.stateData.map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <span className="text-xs font-bold w-6 text-slate-600 dark:text-slate-300">{item.label}</span>
                                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color}`}
                                            ref={(el) => { if (el) el.style.width = `${item.pct}%`; }}
                                            role="img"
                                            aria-label={`${item.label}: ${item.pct}%`}
                                            title={`${item.label}: ${item.pct}%`}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-slate-500 w-8 text-right">{item.pct}%</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">Nenhum dado de estado disponível.</p>
                        )}
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default Dashboard;