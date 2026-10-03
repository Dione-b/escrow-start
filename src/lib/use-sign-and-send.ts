"use client";

import { useCallback } from "react";
import { useSendTransaction } from "@trustless-work/escrow/hooks";
import { useWalletContext } from "@/components/tw-blocks/providers/WalletProvider";
import { signXdr } from "@/lib/sign";

/**
 * Passos 2 e 3 de toda escrita no Trustless Work: assinar o XDR na carteira
 * e enviá-lo. O passo 1 (montar o XDR) é o hook do SDK de cada etapa.
 */
export function useSignAndSend() {
  const { walletAddress } = useWalletContext();
  const { sendTransaction } = useSendTransaction();

  return useCallback(
    async (unsignedTransaction?: string) => {
      if (!walletAddress) throw new Error("Conecte a carteira antes de assinar.");
      if (!unsignedTransaction) throw new Error("A API não retornou a transação para assinar.");

      const signedXdr = await signXdr(unsignedTransaction, walletAddress);
      const data = await sendTransaction(signedXdr);
      if (data.status !== "SUCCESS") throw new Error(data.message || "A transação não foi confirmada.");
      return data;
    },
    [walletAddress, sendTransaction],
  );
}
