# Escrow Start — Trustless Work (aula)

Esqueleto de uma plataforma de **escrow single-release** na **testnet Stellar** usando [Trustless Work](https://docs.trustlesswork.com).
A lógica de cada etapa está marcada com `// TODO (aula)` — vamos implementar juntos.

## Pré-requisitos
- Node 20+
- Extensão [Freighter](https://freighter.app) configurada em **Testnet**
- Conta financiada com XLM via [friendbot](https://laboratory.stellar.org/#account-creator?network=test)
- Trustline de **USDC testnet** (`GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`) na sua conta, criada no [Stellar Lab](https://laboratory.stellar.org)
- Saldo de USDC: **100 USDC grátis** no [faucet Sozu](https://faucet.sozu.capital/) (informe o seu endereço `G…`; a trustline precisa existir antes). Alternativa: [faucet Circle](https://faucet.circle.com)
- API key em https://dapp.trustlesswork.com

## Setup
```bash
npm install
cp .env.example .env.local   # cole sua NEXT_PUBLIC_API_KEY
npm run dev                  # http://localhost:3000
```

## Estrutura
| Arquivo | Papel |
|---|---|
| `src/app/layout.tsx` | Providers: React Query → TrustlessWork → Wallet |
| `src/trustless-work-provider.tsx` | `TrustlessWorkConfig` (ambiente `development`) |
| `src/components/tw-blocks/` | Blocos gerados pelo CLI (`npx trustless-work add wallet-kit`) |
| `src/lib/sign.ts` | Assinar XDR com a carteira |
| `src/app/escrow/new/page.tsx` | Formulário de criação (deploy) |
| `src/app/escrow/[contractId]/page.tsx` | Painel: fund → milestone → approve → release |

## Roteiro da aula
Toda escrita segue: **hook do SDK → `unsignedTransaction` → assinar na carteira → `useSendTransaction`**.

1. **Deploy** — `useInitializeEscrow().deployEscrow(payload, "single-release")` em `escrow/new`
2. **Ler** — `useGetEscrowFromIndexerByContractIds` em `escrow/[contractId]`
3. **Fund** — `useFundEscrow`
4. **Concluir milestone** (service provider) — `useChangeMilestoneStatus`
5. **Aprovar** (approver) — `useApproveMilestone`
6. **Liberar** (release signer) — `useReleaseFunds`

Dica: na demo, use o botão "Usar minha carteira em todos" para ocupar todos os papéis com uma só carteira.
Confira o resultado no [Escrow Viewer](https://viewer.trustlesswork.com).
