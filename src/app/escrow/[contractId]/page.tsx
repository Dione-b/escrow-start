"use client";

import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { HelpTip } from "@/components/help-tip";
import { useWalletContext } from "@/components/tw-blocks/providers/WalletProvider";
import type { GlossaryKey } from "@/lib/glossary";

export default function EscrowPage({ params }: { params: Promise<{ contractId: string }> }) {
  const { contractId } = use(params);
  const { walletAddress } = useWalletContext();

  // TODO (aula) 0: ler o escrow do indexer
  //   const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();
  //   const [escrow] = await getEscrowByContractIds({ contractIds: [contractId] });
  // Atenção: hooks (useFundEscrow etc.) ficam no TOPO do componente, nunca dentro dos handlers.

  const todo = (n: number) => () =>
    toast.info(`Etapa ainda não implementada (TODO ${n} da aula).`);

  // TODO (aula) 1: fundEscrow({ contractId, amount, signer: walletAddress }, "single-release") → assinar → useSendTransaction
  const handleFund = todo(1);
  // TODO (aula) 2: changeMilestoneStatus({ contractId, milestoneIndex: "0", newStatus: "completed", newEvidence, serviceProvider: walletAddress })
  const handleCompleteMilestone = todo(2);
  // TODO (aula) 3: approveMilestone({ contractId, milestoneIndex: "0", approver: walletAddress })
  const handleApprove = todo(3);
  // TODO (aula) 4: releaseFunds({ contractId, releaseSigner: walletAddress }) — consulte antes com validateOnChain=true
  const handleRelease = todo(4);

  const steps: { label: string; role: string; term: GlossaryKey; onClick: () => void }[] = [
    { label: "Fund", role: "qualquer carteira com USDC", term: "stepFund", onClick: handleFund },
    { label: "Concluir milestone", role: "service provider", term: "stepComplete", onClick: handleCompleteMilestone },
    { label: "Aprovar milestone", role: "approver", term: "stepApprove", onClick: handleApprove },
    { label: "Liberar fundos", role: "release signer", term: "stepRelease", onClick: handleRelease },
  ];

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Voltar
        </Link>

        <section className="space-y-3 rounded-xl border p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Escrow</h1>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contract ID <HelpTip term="contractId" label="Contract ID" />
            </p>
            <p className="break-all font-mono text-xs">{contractId}</p>
          </div>
          {/* TODO (aula): exibir título, valor, saldo (balance), status do milestone e flags (approved, released) */}
          <a
            className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4"
            href={`https://viewer.trustlesswork.com/${encodeURIComponent(contractId)}`}
            target="_blank"
            rel="noreferrer"
          >
            Ver no Escrow Viewer <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Etapas</h2>
            <p className="text-sm text-muted-foreground">
              Cada etapa é assinada por um papel diferente. Se a sua carteira não tiver o papel, o contrato recusa.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <div key={s.label} className="flex flex-col gap-3 rounded-xl border p-5">
                <span className="flex items-center justify-between">
                  <span className="grid size-6 place-items-center rounded-full border text-xs font-medium">{i + 1}</span>
                  <HelpTip term={s.term} label={s.label} />
                </span>
                <div>
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-xs text-muted-foreground">Quem assina: {s.role}</p>
                </div>
                <button
                  onClick={s.onClick}
                  disabled={!walletAddress}
                  className="mt-1 h-10 rounded-md bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Executar
                </button>
              </div>
            ))}
          </div>
          {!walletAddress && <p className="text-sm text-muted-foreground">Conecte a carteira para habilitar as etapas.</p>}
        </section>
      </main>
    </>
  );
}
