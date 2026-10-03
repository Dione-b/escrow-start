/**
 * Fluxo padrão de TODA escrita no Trustless Work:
 *
 *   1. Chamar um hook do SDK (ex: deployEscrow, fundEscrow...) → recebe { unsignedTransaction }
 *   2. Assinar o XDR com a carteira do usuário (signXdr abaixo)
 *   3. Enviar o XDR assinado com sendTransaction (hook useSendTransaction)
 */
import { signTransaction } from "@/components/tw-blocks/wallet-kit/wallet-kit";

export async function signXdr(unsignedTransaction: string, address: string) {
  if (!unsignedTransaction) throw new Error("Transação não assinada ausente.");
  if (!address) throw new Error("Conecte a carteira antes de assinar.");

  const signed = await signTransaction({ unsignedTransaction, address });
  if (!signed) throw new Error("A carteira não retornou a transação assinada.");
  return signed;
}
