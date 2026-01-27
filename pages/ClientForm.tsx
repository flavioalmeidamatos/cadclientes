import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { MAP_IMAGE_URL, MOCK_CLIENT } from '../constants';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

interface ClientFormProps {
    mode: 'create' | 'edit';
}

const ClientForm: React.FC<ClientFormProps> = ({ mode }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();

    // Refs for focus management
    const nameInputRef = useRef<HTMLInputElement>(null);
    const cepInputRef = useRef<HTMLInputElement>(null);
    const searchBtnRef = useRef<HTMLButtonElement>(null);
    const numberInputRef = useRef<HTMLInputElement>(null);
    const complementInputRef = useRef<HTMLInputElement>(null);
    const saveBtnRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ref to track which field currently holds the "focus lock" to prevent infinite loops
    const focusLockRef = useRef<string | null>(null);

    const [loadingCep, setLoadingCep] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [addressLocked, setAddressLocked] = useState(false);
    const [mapSrc, setMapSrc] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        name: '', cep: '', address: '', neighborhood: '', city: '', state: '', number: '', complement: '', ativo: true
    });

    const title = mode === 'create' ? 'Detalhes do Cliente' : 'Alteração de Cliente';
    const subtitle = mode === 'create'
        ? 'Preencha as informações para o novo registro.'
        : 'Atualize as informações do registro selecionado.';
    const btnText = mode === 'create' ? 'Salvar Cliente' : 'Salvar Alterações';

    // Fetch client data in edit mode
    useEffect(() => {
        if (mode === 'edit' && id) {
            const fetchClient = async () => {
                const { data, error } = await supabase
                    .from('clientes')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (data && !error) {
                    setFormData({
                        name: data.nome_completo,
                        cep: data.cep || '',
                        address: data.logradouro || '',
                        neighborhood: data.bairro || '',
                        city: data.cidade || '',
                        state: data.estado || '',
                        number: data.numero || '',
                        complement: data.complemento || '',
                        ativo: data.ativo ?? true
                    });
                    if (data.avatar_url) setAvatarPreview(data.avatar_url);
                    if (data.cep) {
                        setAddressLocked(true);
                        const fullAddress = `${data.logradouro}, ${data.cidade} - ${data.estado}`;
                        const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                        setMapSrc(mapUrl);
                    }
                } else {
                    alert('Erro ao carregar dados do cliente.');
                    navigate('/clients');
                }
            };
            fetchClient();
        }
    }, [id, mode, navigate]);

    // Ensure focus on mount
    useEffect(() => {
        if (mode === 'create' && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [mode]);

    // Generalized Focus Trap Handler (prevents leaving field if empty)
    const handleFocusTrapBlur = (field: string, value: string, ref: React.RefObject<HTMLInputElement>) => {
        // If lock is held by another field, do nothing to prevent fighting
        if (focusLockRef.current && focusLockRef.current !== field) return;

        if (!value.trim()) {
            focusLockRef.current = field;
            // Timeout ensures the browser processes the blur before forcing focus back
            setTimeout(() => {
                ref.current?.focus();
            }, 0);
        } else {
            // Release lock if this field held it
            if (focusLockRef.current === field) {
                focusLockRef.current = null;
            }
        }
    };

    // Handle Focus Logic for Name Field
    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab' || e.key === 'Enter') {
            if (!formData.name.trim()) {
                // Trap focus if empty
                e.preventDefault();
                nameInputRef.current?.focus();
            } else {
                // Move to CEP if filled
                e.preventDefault();
                cepInputRef.current?.focus();
            }
        }
    };

    // Handle CEP Change with Masking and Auto-Focus
    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

        // Limit to 8 digits
        if (value.length > 8) value = value.slice(0, 8);

        // Apply Mask: XXXXX-XXX
        let formattedValue = value;
        if (value.length > 5) {
            formattedValue = `${value.slice(0, 5)}-${value.slice(5)}`;
        }

        setFormData({ ...formData, cep: formattedValue });

        // If CEP is cleared manually, unlock fields and reset map
        if (value.length < 8) {
            setAddressLocked(false);
            setMapSrc(null);
        }

        // If full CEP (8 digits), move focus to Search Button
        if (value.length === 8) {
            searchBtnRef.current?.focus();
        }
    };

    // Handle Enter on Search Button
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCepSearch();
        }
    };

    // Handle CEP Search via ViaCEP API
    const handleCepSearch = async () => {
        const cleanCep = formData.cep.replace(/\D/g, '');

        if (cleanCep.length !== 8) {
            alert("Por favor, digite um CEP válido com 8 números.");
            return;
        }

        setLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                alert("CEP não encontrado.");
                setAddressLocked(false);
                setMapSrc(null);
            } else {
                const address = data.logradouro ? data.logradouro.toUpperCase() : '';
                const neighborhood = data.bairro ? data.bairro.toUpperCase() : '';
                const city = data.localidade ? data.localidade.toUpperCase() : '';
                const state = data.uf ? data.uf.toUpperCase() : '';

                setFormData(prev => ({
                    ...prev,
                    address: address,
                    neighborhood: neighborhood,
                    city: city,
                    state: state
                }));

                // Lock fields
                setAddressLocked(true);

                // Generate Map URL
                // Format: https://maps.google.com/maps?q=ADDRESS&output=embed
                const fullAddress = `${address}, ${city} - ${state}`;
                const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                setMapSrc(mapUrl);

                // Focus Number field
                setTimeout(() => {
                    numberInputRef.current?.focus();
                }, 100);
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            alert("Erro ao buscar informações do CEP. Verifique sua conexão.");
        } finally {
            setLoadingCep(false);
        }
    };

    // Handle Number Field Logic (Blur = S/N, Enter/Tab = Go to Complement)
    const handleNumberBlur = () => {
        if (!formData.number.trim()) {
            setFormData(prev => ({ ...prev, number: 'S/N' }));
        }
    };

    const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            // If empty when pressing enter/tab, set S/N immediately before moving
            if (!formData.number.trim()) {
                setFormData(prev => ({ ...prev, number: 'S/N' }));
            }
            complementInputRef.current?.focus();
        }
    };

    // Handle Complement Field Logic (Enter/Tab = Go to Save Button)
    const handleComplementKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            saveBtnRef.current?.focus();
        }
    };

    // Handle Avatar Click & File Selection
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const imageUrl = URL.createObjectURL(file);
            setAvatarPreview(imageUrl);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!formData.name.trim()) {
            alert('O nome do cliente é obrigatório.');
            return;
        }

        setLoadingSave(true);
        try {
            let avatarUrl = avatarPreview || '';

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('client-avatars')
                    .upload(filePath, avatarFile);

                if (uploadError) {
                    console.error('Error uploading client avatar:', uploadError);
                } else {
                    const { data: publicUrlData } = supabase.storage
                        .from('client-avatars')
                        .getPublicUrl(filePath);
                    avatarUrl = publicUrlData.publicUrl;
                }
            }

            const payload = {
                nome_completo: formData.name,
                cep: formData.cep,
                logradouro: formData.address,
                bairro: formData.neighborhood,
                cidade: formData.city,
                estado: formData.state,
                numero: formData.number,
                complemento: formData.complement,
                avatar_url: avatarUrl,
                usuario_id: user.id,
                ativo: formData.ativo
            };

            if (mode === 'create') {
                const { error } = await supabase
                    .from('clientes')
                    .insert([payload]);
                if (error) throw error;
                alert('Cliente cadastrado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('clientes')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
                alert('Cliente atualizado com sucesso!');
            }

            navigate('/clients');
        } catch (error: any) {
            console.error('Error saving client:', error);
            alert('Erro ao salvar cliente: ' + (error.message || 'Erro desconhecido.'));
        } finally {
            setLoadingSave(false);
        }
    };

    return (
        <Layout title={title} showBack={true}>

            {/* Search Header for Edit Mode */}
            {mode === 'edit' && (
                <div className="px-4 pt-4 mb-2">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
                        <input
                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                            placeholder="Pesquisar cliente..."
                            aria-label="Pesquisar cliente"
                            title="Pesquisar cliente"
                            type="text"
                        />
                    </div>
                </div>
            )}

            {/* Warning Banner */}
            <div className="mx-4 mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-lg flex gap-3">
                <Icon name="warning" className="text-orange-500 text-xl leading-none" />
                <p className="text-sm text-orange-700 dark:text-orange-300 leading-tight">
                    Os campos marcados com <span className="text-primary font-bold">*</span> são de preenchimento obrigatório.
                </p>
            </div>

            {/* Avatar Section */}
            <div className="flex justify-center my-6">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    title="Selecionar foto do cliente"
                    aria-label="Selecionar foto do cliente"
                />

                {/* Avatar Wrapper (Relative context for badge, NO overflow-hidden here) */}
                <div
                    onClick={handleAvatarClick}
                    className="relative w-28 h-28 cursor-pointer group"
                >
                    {/* Inner Circle (Holds image/icon, HAS overflow-hidden) */}
                    <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg group-hover:ring-4 group-hover:ring-primary/20 transition-all">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <Icon name="person" className="text-slate-400 dark:text-slate-500 text-4xl" />
                        )}
                    </div>

                    {/* Camera Badge (Floating on top, outside overflow-hidden) */}
                    <button
                        type="button"
                        className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full border-2 border-white dark:border-slate-900 shadow-md z-10"
                        title="Alterar foto"
                        aria-label="Alterar foto"
                    >
                        <Icon name="photo_camera" className="text-sm" />
                    </button>
                </div>
            </div>

            <form className="px-4 space-y-6" onSubmit={handleSave}>

                {/* Basic Info */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Dados do Cliente</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="nome_completo" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nome Completo <span className="text-primary">*</span></label>
                        <input
                            id="nome_completo"
                            ref={nameInputRef}
                            autoFocus
                            type="text"
                            title="Nome Completo"
                            aria-label="Nome Completo"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm p-3 outline-none dark:text-white transition-all"
                            placeholder="EX: JOÃO DA SILVA"
                            value={formData.name}
                            onKeyDown={handleNameKeyDown}
                            onBlur={() => handleFocusTrapBlur('name', formData.name, nameInputRef)}
                            onChange={e => {
                                // Enforce uppercase and remove numbers
                                const formattedValue = e.target.value.replace(/\d/g, '').toUpperCase();
                                setFormData({ ...formData, name: formattedValue });
                                // Unlock if valid while typing
                                if (formattedValue.trim() && focusLockRef.current === 'name') {
                                    focusLockRef.current = null;
                                }
                            }}
                        />
                    </div>
                </section>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Location Info */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold text-primary tracking-widest uppercase">Localização</h2>

                    <div className="flex gap-3">
                        <div className="flex-1 space-y-1">
                            <label htmlFor="cep" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">CEP</label>
                            <input
                                id="cep"
                                ref={cepInputRef}
                                title="CEP"
                                aria-label="CEP"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm p-3 outline-none dark:text-white transition-all"
                                placeholder="00000-000"
                                type="text"
                                maxLength={9} // 8 digits + 1 hyphen
                                value={formData.cep}
                                onChange={(e) => {
                                    handleCepChange(e);
                                    // Unlock if valid while typing
                                    if (e.target.value.trim() && focusLockRef.current === 'cep') {
                                        focusLockRef.current = null;
                                    }
                                }}
                                onBlur={() => handleFocusTrapBlur('cep', formData.cep, cepInputRef)}
                            />
                        </div>
                        <div className="flex items-end pb-[1px]">
                            <button
                                ref={searchBtnRef}
                                type="button"
                                onClick={handleCepSearch}
                                onKeyDown={handleSearchKeyDown}
                                disabled={loadingCep}
                                className="bg-primary hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-md text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loadingCep ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Buscando...
                                    </>
                                ) : (
                                    'Buscar'
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="logradouro" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Logradouro</label>
                        <input
                            id="logradouro"
                            readOnly={addressLocked}
                            title="Logradouro"
                            aria-label="Logradouro"
                            className={`w-full border border-slate-300 dark:border-slate-700 rounded-md text-sm p-3 outline-none dark:text-white transition-all ${addressLocked ? 'bg-slate-100 dark:bg-slate-900 opacity-70 cursor-not-allowed focus:ring-0' : 'bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary'}`}
                            placeholder="RUA, AVENIDA..."
                            type="text"
                            value={formData.address}
                            onChange={e => !addressLocked && setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                            <label htmlFor="bairro" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Bairro</label>
                            <input
                                id="bairro"
                                readOnly={addressLocked}
                                title="Bairro"
                                aria-label="Bairro"
                                className={`w-full border border-slate-300 dark:border-slate-700 rounded-md text-sm p-3 outline-none dark:text-white transition-all ${addressLocked ? 'bg-slate-100 dark:bg-slate-900 opacity-70 cursor-not-allowed focus:ring-0' : 'bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary'}`}
                                type="text"
                                value={formData.neighborhood}
                                onChange={e => !addressLocked && setFormData({ ...formData, neighborhood: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="estado" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">UF</label>
                            <input
                                id="estado"
                                readOnly={addressLocked}
                                title="Estado (UF)"
                                aria-label="Estado (UF)"
                                className={`w-full border border-slate-300 dark:border-slate-700 rounded-md text-sm p-3 outline-none dark:text-white transition-all ${addressLocked ? 'bg-slate-100 dark:bg-slate-900 opacity-70 cursor-not-allowed focus:ring-0' : 'bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary'}`}
                                type="text"
                                value={formData.state}
                                onChange={e => !addressLocked && setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="cidade" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cidade</label>
                        <input
                            id="cidade"
                            readOnly={addressLocked}
                            title="Cidade"
                            aria-label="Cidade"
                            className={`w-full border border-slate-300 dark:border-slate-700 rounded-md text-sm p-3 outline-none dark:text-white transition-all ${addressLocked ? 'bg-slate-100 dark:bg-slate-900 opacity-70 cursor-not-allowed focus:ring-0' : 'bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary'}`}
                            type="text"
                            value={formData.city}
                            onChange={e => !addressLocked && setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <label htmlFor="numero" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Número</label>
                            <input
                                id="numero"
                                ref={numberInputRef}
                                title="Número"
                                aria-label="Número"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm p-3 outline-none dark:text-white transition-all"
                                placeholder="S/N"
                                type="text"
                                value={formData.number}
                                onBlur={handleNumberBlur}
                                onKeyDown={handleNumberKeyDown}
                                onChange={e => setFormData({ ...formData, number: e.target.value })}
                            />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                            <label htmlFor="complemento" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Complemento</label>
                            <input
                                id="complemento"
                                ref={complementInputRef}
                                title="Complemento"
                                aria-label="Complemento"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm p-3 outline-none dark:text-white transition-all"
                                placeholder="APTO, BLOCO..."
                                type="text"
                                value={formData.complement}
                                onKeyDown={handleComplementKeyDown}
                                onChange={e => setFormData({ ...formData, complement: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="flex items-end pb-3">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.ativo}
                                        onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">Ativo</span>
                            </label>
                        </div>
                    </div>

                    {/* Map Section */}
                    <div className="mt-6">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Localização no Mapa</label>
                        <div className="w-full h-48 rounded-xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-inner bg-slate-100 dark:bg-slate-900 group">
                            {mapSrc ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight={0}
                                    marginWidth={0}
                                    src={mapSrc}
                                    title="Google Maps"
                                    className="w-full h-full"
                                />
                            ) : (
                                <>
                                    <img src={MAP_IMAGE_URL} alt="Mapa de localização" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <Icon name="location_on" className="text-primary text-5xl drop-shadow-lg" />
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded text-[10px] font-bold shadow-sm border border-slate-200 dark:border-slate-700">
                                        Google
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <div className="pt-4 pb-8">
                    <button
                        ref={saveBtnRef}
                        type="submit"
                        disabled={loadingSave}
                        className={`w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-orange-500/20 ${loadingSave ? 'opacity-70 cursor-not-allowed' : ''}`}
                        title={btnText}
                    >
                        {loadingSave ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <Icon name="check_circle" />
                                {btnText}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Layout>
    );
};

export default ClientForm;