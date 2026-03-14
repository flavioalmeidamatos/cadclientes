# CKDEV Solucoes

Aplicacao web para autenticacao e gestao de clientes, construida com React, TypeScript, Vite e Supabase.

## Stack

- React 19
- TypeScript
- Vite
- React Router DOM
- Supabase Auth, Database e Storage
- Recharts
- Vercel Analytics e Speed Insights

## Estrutura principal

- `index.tsx`: inicializa a aplicacao React e integra analytics da Vercel.
- `App.tsx`: define rotas publicas e privadas e envolve a arvore com `AuthProvider`.
- `contexts/AuthContext.tsx`: centraliza sessao, usuario autenticado e logout.
- `supabase.ts`: cria o cliente Supabase com persistencia de sessao.
- `pages/`: telas de login, cadastro, dashboard e CRUD de clientes.
- `components/Layout.tsx`: shell principal da interface autenticada.

## Variaveis de ambiente

Crie um arquivo `.env.local` com:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_APP_URL=https://cadclientes.vercel.app
```

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Inicie o ambiente local:

```bash
npm run dev
```

3. Gere a build de producao:

```bash
npm run build
```

## Dependencias do Supabase

O app espera, no minimo, os seguintes recursos no projeto Supabase:

- Tabela `clientes`
- Tabela `usuarios`
- Bucket `avatars`
- Bucket `client-avatars`

As paginas autenticadas consultam `clientes` e `usuarios`, enquanto login e cadastro dependem do Supabase Auth.

## Deploy

O deploy pode ser feito na Vercel como aplicacao Vite estaticamente servida. Tambem e necessario configurar na Vercel as variaveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_APP_URL`.
