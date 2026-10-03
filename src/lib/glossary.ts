/**
 * Textos didáticos usados nos tooltips. Centralizados para que a mesma
 * explicação apareça igual na home, no formulário e na tela do escrow.
 */
export const GLOSSARY = {
  // Formulário
  title: "Nome curto do escrow, só para você identificá-lo. Fica salvo junto aos dados do contrato.",
  description: "Explique o combinado entre as partes. A API exige um texto não vazio.",
  amount: "Valor total em USDC que será travado no contrato. Só sai de lá quando o milestone for aprovado e os fundos liberados.",
  platformFee: "Percentual do valor que vai para o Platform Address na liberação. Não é um depósito extra: é descontado do valor do escrow.",
  milestone: "Entrega que precisa ser concluída. No single-release, todos os milestones precisam ser aprovados antes de liberar o pagamento. Aqui criamos um só.",

  // Papéis (roles) — Trustless Work V1
  approver: "Confere o trabalho e aprova o milestone (normalmente o cliente). A aprovação é irreversível.",
  serviceProvider: "Quem executa o trabalho e marca o milestone como concluído.",
  releaseSigner: "Quem assina a liberação dos fundos depois que o milestone foi aprovado.",
  disputeResolver: "Árbitro em caso de disputa: decide como o saldo é dividido. Esse endereço não pode abrir disputas.",
  receiver: "Endereço que recebe o pagamento. Precisa ter a trustline do USDC, senão o deploy é recusado.",
  platformAddress: "Endereço da plataforma: recebe a taxa e é quem pode atualizar o escrow. Também precisa da trustline.",

  // Conceitos
  trustline: "Na Stellar, uma conta só pode receber um token (como o USDC) se criou uma trustline para ele. Aqui usamos o USDC da testnet.",
  contractId: "Endereço do contrato Soroban do escrow. Começa com C e tem 56 caracteres. Aparece depois do deploy.",
  signer: "Carteira que assina a transação. A chave privada nunca sai da sua carteira: o app só recebe a assinatura.",
  wallet: "Sua carteira Stellar (ex.: Freighter). É ela que assina cada etapa. Precisa estar na Testnet.",
  xdr: "O XDR é a transação serializada. A API monta, você assina na carteira e o app envia de volta para a rede.",
  fillWithMyWallet: "Atalho para a demo: usa a mesma carteira em todos os papéis. Em produção, cada papel costuma ser uma pessoa diferente.",

  // Etapas do fluxo
  stepDeploy: "Cria o contrato do escrow na blockchain com os papéis, o valor e o milestone. Ele nasce vazio.",
  stepFund: "O depositante transfere o USDC para dentro do contrato. A partir daqui o valor fica travado.",
  stepComplete: "O service provider avisa que entregou o trabalho (e pode anexar uma evidência).",
  stepApprove: "O approver confirma que a entrega está ok. Sem isso, os fundos não podem ser liberados.",
  stepRelease: "O release signer libera o valor para o receiver, descontando as taxas.",
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
