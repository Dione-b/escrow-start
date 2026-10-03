"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ListChecks, Loader2 } from "lucide-react";
import { useGetEscrowsFromIndexerBySigner } from "@trustless-work/escrow/hooks";
import type { Roles } from "@trustless-work/escrow/types";
import { HelpTip } from "@/components/help-tip";
import { useWalletContext } from "@/components/tw-blocks/providers/WalletProvider";
import { errorMessage } from "@/lib/errors";
import { escrowStatus } from "@/lib/escrow-status";

const ROLE_LABELS: Record<string, string> = {
  approver: "Approver",
  serviceProvider: "Service Provider",
  releaseSigner: "Release Signer",
  disputeResolver: "Dispute Resolver",
  receiver: "Receiver",
  platformAddress: "Platform",
};

/** O indexer pode devolver ISO string ou timestamp do Firestore ({ _seconds }); o tipo do SDK diz Date. */
function formatDate(value: unknown) {
  const raw = value as { _seconds?: number } | string | number | Date | undefined;
  const date = raw && typeof raw === "object" && "_seconds" in raw && raw._seconds != null ? new Date(raw._seconds * 1000) : raw ? new Date(raw as string | number | Date) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("pt-BR") : null;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Botão + lista dos escrows assinados (signer) pela carteira conectada. */
export function MyEscrows() {
  const { walletAddress } = useWalletContext();
  const { getEscrowsBySigner } = useGetEscrowsFromIndexerBySigner();

  // enabled: false → a consulta só roda quando o usuário clica no botão (refetch).
  const { data, isFetching, isError, error, isFetched, refetch } = useQuery({
    queryKey: ["my-escrows", walletAddress],
    queryFn: async () => {
      const result = await getEscrowsBySigner({
        signer: walletAddress!,
        orderBy: "createdAt",
        orderDirection: "desc",
      });
      return Array.isArray(result) ? result : [];
    },
    enabled: false,
    retry: false,
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-semibold">
            Meus escrows <HelpTip term="myEscrows" label="meus escrows" />
          </h2>
          <p className="text-sm text-muted-foreground">Escrows que a sua carteira criou, do mais novo para o mais antigo.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={!walletAddress || isFetching}
          className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFetching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ListChecks className="size-4" aria-hidden />}
          {isFetching ? "Buscando…" : isFetched ? "Atualizar lista" : "Listar meus escrows"}
        </button>
      </div>

      {!walletAddress && <p className="text-sm text-muted-foreground">Conecte a carteira para listar os seus escrows.</p>}

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(error)}
        </p>
      )}

      {isFetched && !isError && data?.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum escrow encontrado para esta carteira. Crie um em “Criar novo escrow”. Se acabou de criar, o indexer pode
          levar alguns segundos.
        </p>
      )}

      {!!data?.length && (
        <ul className="grid gap-3">
          {data.map((escrow, i) => {
            const roles = escrow.roles as Roles;
            const myRoles = Object.entries(roles ?? {})
              .filter(([, address]) => address === walletAddress)
              .map(([role]) => ROLE_LABELS[role] ?? role);
            const status = escrowStatus(escrow);
            const row = (
              <>
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold">{escrow.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {escrow.contractId ? short(escrow.contractId) : "contrato ainda não indexado"}
                    {formatDate(escrow.createdAt) && ` · ${formatDate(escrow.createdAt)}`}
                  </p>
                  {myRoles.length > 0 && (
                    <p className="flex flex-wrap gap-1.5 pt-1">
                      {myRoles.map((r) => (
                        <span key={r} className="rounded-full border px-2 py-0.5 text-[10px] font-medium">
                          {r}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="font-semibold">{escrow.amount} USDC</p>
                  <p className="text-xs text-muted-foreground">
                    Saldo {escrow.balance ?? 0} ·{" "}
                    <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">{status}</span>
                  </p>
                </div>
              </>
            );
            const cls = "flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors";
            return (
              <li key={escrow.contractId ?? i}>
                {escrow.contractId ? (
                  <Link href={`/escrow/${encodeURIComponent(escrow.contractId)}`} className={`${cls} hover:bg-muted`}>
                    {row}
                  </Link>
                ) : (
                  <div className={cls}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
