# Lumus — Branddi Monitor

Aplicação Next.js com duas ferramentas internas:

1. **Relatório Brand Bidding** — gera PDF estruturado a partir de dados do dashboard
2. **Resumo de Tratativa** — gera resumo automático de cards do Pipefy via Gemini

## Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- TailwindCSS
- Google Gemini (`@google/generative-ai`)
- jsPDF + jspdf-autotable

## Como rodar localmente

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env.local` na raiz (use `.env.example` como base):
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```
4. Rode:
   ```bash
   npm run dev
   ```
5. Acesse [http://localhost:3000](http://localhost:3000)

## Deploy

Recomendado: [Vercel](https://vercel.com). Importe o repositório e adicione a variável `GEMINI_API_KEY` nas configurações de ambiente.
