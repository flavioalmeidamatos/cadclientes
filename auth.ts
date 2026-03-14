export const getAuthRedirectUrl = () => {
  const configuredUrl = (import.meta as any).env.VITE_APP_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  return window.location.origin;
};

export const translateSupabaseError = (message?: string) => {
  if (!message) {
    return 'Ocorreu um erro inesperado.';
  }

  if (message.includes('Email not confirmed')) {
    return 'Por favor, confirme seu e-mail antes de entrar.';
  }

  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha invalidos.';
  }

  if (message.includes('User already registered')) {
    return 'Este e-mail ja esta cadastrado.';
  }

  if (message.includes('Password should be at least')) {
    return 'A senha precisa atender aos requisitos minimos de seguranca.';
  }

  if (message.includes('Signup is disabled')) {
    return 'O cadastro de novos usuarios esta desativado no momento.';
  }

  if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
    return 'Nao foi possivel se comunicar com o servidor. Tente novamente em instantes.';
  }

  return 'Ocorreu um erro inesperado. Se o problema continuar, tente novamente.';
};
