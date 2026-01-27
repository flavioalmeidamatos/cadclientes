export interface Client {
  id: string;
  name: string;
  cep: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  complement?: string;
  status: 'active' | 'inactive';
  avatarUrl?: string;
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export interface ChartData {
  name: string;
  value: number;
}