# MoneyBox · livro-caixa pessoal

Controle financeiro com Supabase (back-end) + React/Vite + TailwindCSS.

Estética **Aero**: moderna, minimalista e futurista — vidro fosco (glassmorphism),
um espectro aqua→lima e luz de aurora ao fundo, com toda cifra em fonte mono
tabular. Tema **claro e escuro**, alternável e com respeito à preferência do
sistema.

### Sistema de design

Os tokens vivem em variáveis CSS (`src/index.css`) como trios `R G B`, e o
Tailwind os lê via `rgb(var(--token) / <alpha-value>)` (`tailwind.config.js`).
Trocar o tema troca só as variáveis — nenhum componente conhece cores fixas.

| Token | Papel |
|---|---|
| `canvas` / `surface` / `line` | fundo, superfícies e traços |
| `fg` / `muted` / `subtle` | hierarquia de texto |
| `brand` / `brand2` / `sky` / `accent` | espectro aero (aqua → lima) |
| `pos` / `neg` / `warn` | semântica de dinheiro |
| `onbrand` | tinta escura sobre superfícies aqua vivas |

Regra de contraste: **superfície aqua viva sempre carrega tinta escura**
(`onbrand`) — nos dois temas. Texto branco sobre `#22D3EE` daria 1.8:1 e
reprovaria no WCAG AA; a tinta escura passa com folga (8.9:1).

Utilitários próprios: `.glass` (vidro), `.aurora` (luz de fundo), `.figure`
(cifras mono tabulares), `.gradient-text`.

---

## 1. Subir o back-end (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No painel: **SQL Editor → New query**, cole **todo** o conteúdo de
   `supabase/schema.sql` e clique em **Run**.
   Isso cria as tabelas, ativa Row Level Security (cada usuário só vê os
   próprios dados) e instala o gatilho que gera o perfil financeiro no cadastro.
3. **Project Settings → API**: copie a `Project URL` e a `anon public key`.
4. (Opcional) Em **Authentication → Providers → Email**, desligue
   "Confirm email" para testar mais rápido sem confirmação por e-mail.

## 2. Rodar o front-end

```bash
cp .env.example .env.local      # preencha com a URL e a anon key
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (ex.: `http://localhost:5173`).
Crie uma conta em **Criar conta**, entre, e em **Ajustes** defina seu
**salário**, **dia de pagamento** e **saldo atual**.

---

## 3. Como a lógica financeira funciona

| Ação | Efeito |
|------|--------|
| **Salário** (Ajustes) | Valor fixo, é o seu saldo de partida. Muda só ao trocar de emprego. |
| **Receita** | Aumenta o saldo. |
| **Despesa no dinheiro** | Diminui o saldo. Se faltar, o que falta vai para a **fatura** (sem dinheiro = crédito). |
| **Despesa no crédito** | Entra na fatura do mês; o saldo só cai quando a fatura é paga. |
| **Conta fixa / parcela** | Ao marcar como paga, diminui o saldo (ou entra na fatura, se você escolher "no crédito"). |
| **Pagar fatura** | Diminui o saldo. Se quitar tudo, aparece **Finalizar**. Se não, dá pra **rolar** o restante com juros — abrindo a fatura do mês seguinte. |
| **Meta (caixinha)** | Guardar tira do saldo; resgatar devolve ao saldo. |

**Projeção (dashboard):** `saldo + salário − fatura em aberto − contas do mês`,
estendida por 6 meses. Se um mês fica negativo, o déficit vira fatura no mês
seguinte e sobe com juros — exatamente o ciclo que você descreveu.

> Decisão de modelagem: quando um gasto em dinheiro ultrapassa o saldo, o app
> zera o saldo e joga a diferença na fatura (em vez de deixar o saldo negativo),
> porque "ficar sem dinheiro" significa, na prática, usar o crédito. O saldo só
> aparece negativo na **projeção**, nunca por contagem dupla da dívida.

---

## 4. Estrutura

```
supabase/schema.sql        Esquema + RLS + gatilhos + função get_or_create_invoice
src/lib/finance.js         Regras puras: formatação, projeção, obrigações
src/lib/supabase.js        Cliente Supabase
src/context/AuthContext    Sessão, login, cadastro
src/context/FinanceContext Carrega dados e aplica as regras (mutações)
src/context/ThemeContext   Tema claro/escuro (localStorage + preferência do SO)
src/pages/                 Auth, Dashboard, Movements, Invoice, Bills, Goals, Settings
src/components/            Layout (trilho + navegação inferior), ornamentos aero
src/components/ui/         primitives.jsx (Button, Card, Money…), icons.jsx
```

## 5. Build de produção

```bash
npm run build      # gera /dist
npm run preview    # serve o build localmente
```
