// Rede usada em todo o app. Para ir à mainnet: troque aqui, o `baseURL` em
// src/trustless-work-provider.tsx e o filtro em wallet-kit/trustlines.ts.
export const NETWORK = "testnet" as const;

// USDC na testnet Stellar (trustline usada pelo escrow)
export const USDC_TESTNET = {
  symbol: "USDC",
  address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

// Contract ID Soroban: "C" + 55 caracteres base32
export const isValidContractId = (id: string) => /^C[A-Z2-7]{55}$/.test(id);
