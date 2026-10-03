"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import {
  useApproveMilestone,
  useChangeMilestoneStatus,
  useFundEscrow,
  useGetEscrowFromIndexerByContractIds,
  useReleaseFunds,
} from "@trustless-work/escrow/hooks";
import type { Roles, SingleReleaseMilestone } from "@trustless-work/escrow/types";
import { AppHeader } from "@/components/app-header";
import { HelpTip } from "@/components/help-tip";
import { useWalletContext } from "@/components/tw-blocks/providers/WalletProvider";
import { LINKS } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { escrowStatus } from "@/lib/escrow-status";
import type { GlossaryKey } from "@/lib/glossary";
import { useSignAndSend } from "@/lib/use-sign-and-send";

const NOT_FOUND = "Escrow não encontrado";

type StepId = "fund" | "complete" | "approve" | "release";

const ROLE_LABELS: { key: keyof Roles; label: string }[] = [
  { key: "approver", label: "Approver" },
  { key: "serviceProvider", label: "Service Provider" },
  { key: "releaseSigner", label: "Release Signer" },
  { key: "disputeResolver", label: "Dispute Resolver" },
  { key: "receiver", label: "Receiver" },
  { key: "platformAddress", label: "Platform Address" },
];

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function EscrowPage({ params }: { params: Promise<{ contractId: string }> }) {
  const { contractId } = use(params);
  const { walletAddress } = useWalletContext();
  const [evidence, setEvidence] = useState("");
  const [pending, setPending] = useState<StepId | null>(null);

  // Hooks do SDK ficam no topo do componente; cada um só monta o XDR não assinado.
  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();
  const { fundEscrow } = useFundEscrow();
  const { changeMilestoneStatus } = useChangeMilestoneStatus();
  const { approveMilestone } = useApproveMilestone();
  const { releaseFunds } = useReleaseFunds();
  const signAndSend = useSignAndSend();

  // validateOnChain=true: lê o estado real da blockchain, não o cache do indexer.
  const {
    data: escrow,
    isLoading,
    isError,
    error: loadError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["escrow", contractId],
    queryFn: async () => {
      const [found] = await getEscrowByContractIds({ contractIds: [contractId], validateOnChain: true });
      // Logo após o deploy o indexer pode demorar alguns segundos: lançar faz o React Query tentar de novo.
      if (!found) throw new Error(NOT_FOUND);
      return found;
    },
    // Só repete quando o escrow ainda não foi indexado; outros erros (ex.: 401) aparecem na hora.
    retry: (failureCount, err) => err.message === NOT_FOUND && failureCount < 4,
    retryDelay: 1500,
  });

  const roles = escrow?.roles as Roles | undefined;
  const milestone = escrow?.milestones?.[0] as SingleReleaseMilestone | undefined;
  const balance = escrow?.balance ?? 0;
  const released = !!escrow?.flags?.released;
  const funded = balance > 0;
  const completed = milestone?.status?.toLowerCase() === "completed";
  const approved = !!milestone?.approved || !!escrow?.flags?.approved;
  const isRole = (key: keyof Roles) => !!walletAddress && roles?.[key] === walletAddress;

  const run = async (id: StepId, doneMessage: string, build: () => Promise<{ unsignedTransaction?: string }>) => {
    setPending(id);
    try {
      const { unsignedTransaction } = await build(); // 1. a API monta o XDR
      await signAndSend(unsignedTransaction); //          2. você assina  3. o app envia
      toast.success(doneMessage);
      await refetch(); //                                    reflete o novo estado on-chain
    } catch (error) {
      console.error(`Erro na etapa ${id}:`, error);
      toast.error(errorMessage(error));
    } finally {
      setPending(null);
    }
  };

  const signer = walletAddress ?? "";

  const steps: {
    id: StepId;
    label: string;
    role: string;
    term: GlossaryKey;
    done: boolean;
    blocked?: string;
    onClick: () => void;
  }[] = [
    {
      id: "fund",
      label: "Fund",
      role: "qualquer carteira com USDC",
      term: "stepFund",
      done: funded || released,
      blocked: released ? "Fundos já liberados." : funded ? "Escrow já financiado." : undefined,
      onClick: () =>
        run("fund", "Escrow financiado!", () =>
          fundEscrow({ contractId, amount: escrow!.amount, signer }, "single-release"),
        ),
    },
    {
      id: "complete",
      label: "Concluir milestone",
      role: "service provider",
      term: "stepComplete",
      done: completed,
      blocked: released
        ? "Fundos já liberados."
        : completed
          ? "Milestone já concluído."
          : !isRole("serviceProvider")
            ? "Só o service provider pode concluir."
            : undefined,
      onClick: () =>
        run("complete", "Milestone marcado como concluído!", () =>
          changeMilestoneStatus(
            {
              contractId,
              milestoneIndex: "0", // sempre string, mesmo parecendo número
              newStatus: "completed",
              newEvidence: evidence.trim() || undefined,
              serviceProvider: signer,
            },
            "single-release",
          ),
        ),
    },
    {
      id: "approve",
      label: "Aprovar milestone",
      role: "approver",
      term: "stepApprove",
      done: approved,
      blocked: released
        ? "Fundos já liberados."
        : approved
          ? "Milestone já aprovado."
          : !completed
            ? "Aguardando a conclusão do milestone (etapa 2)."
            : !isRole("approver")
              ? "Só o approver pode aprovar."
              : undefined,
      onClick: () =>
        run("approve", "Milestone aprovado!", () =>
          approveMilestone({ contractId, milestoneIndex: "0", approver: signer }, "single-release"),
        ),
    },
    {
      id: "release",
      label: "Liberar fundos",
      role: "release signer",
      term: "stepRelease",
      done: released,
      blocked: released
        ? "Fundos já liberados."
        : !approved
          ? "Aguardando a aprovação do milestone (etapa 3)."
          : !funded
            ? "O escrow ainda não tem fundos (etapa 1)."
            : !isRole("releaseSigner")
              ? "Só o release signer pode liberar."
              : undefined,
      onClick: () =>
        run("release", "Fundos liberados para o receiver!", async () => {
          // Antes de liberar, confirma o estado direto da blockchain (validateOnChain).
          const [fresh] = await getEscrowByContractIds({ contractIds: [contractId], validateOnChain: true });
          const freshMilestone = fresh?.milestones?.[0] as SingleReleaseMilestone | undefined;
          if (!freshMilestone?.approved && !fresh?.flags?.approved) {
            throw new Error("O milestone ainda não consta como aprovado na blockchain.");
          }
          return releaseFunds({ contractId, releaseSigner: signer }, "single-release");
        }),
    },
  ];

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Voltar
        </Link>

        <section className="space-y-5 rounded-xl border p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{escrow?.title ?? "Escrow"}</h1>
              {escrow?.description && <p className="text-sm text-muted-foreground">{escrow.description}</p>}
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} aria-hidden />
              Atualizar
            </button>
          </div>

          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contract ID <HelpTip term="contractId" label="Contract ID" />
            </p>
            <p className="break-all font-mono text-xs">{contractId}</p>
          </div>

          {isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Lendo o escrow na blockchain…
            </p>
          )}
          {isError && (
            <p role="alert" className="text-sm text-destructive">
              {loadError?.message === NOT_FOUND
                ? "Escrow não encontrado. Se acabou de criá-lo, o indexer pode levar alguns segundos: tente “Atualizar”."
                : errorMessage(loadError)}
            </p>
          )}

          {escrow && (
            <>
              <dl className="grid gap-px overflow-hidden rounded-lg border bg-border text-sm sm:grid-cols-4">
                <Stat label="Valor" term="amount" value={`${escrow.amount} USDC`} />
                <Stat label="Saldo no contrato" term="balance" value={`${balance} USDC`} />
                <Stat
                  label="Milestone"
                  term="milestoneStatus"
                  value={escrowStatus(escrow)}
                />
                <Stat label="Taxa" term="platformFee" value={`${escrow.platformFee}%`} />
              </dl>

              {milestone && (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Milestone:</span> {milestone.description}
                  </p>
                  {milestone.evidence && (
                    <p className="flex items-start gap-1.5 text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        Evidência <HelpTip term="evidence" label="evidência" />:
                      </span>
                      <span className="break-all">{milestone.evidence}</span>
                    </p>
                  )}
                </div>
              )}

              {roles && (
                <ul className="grid gap-2 text-xs sm:grid-cols-2">
                  {ROLE_LABELS.map(({ key, label }) => (
                    <li key={key} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        {label} <HelpTip term={key as GlossaryKey} label={label} />
                      </span>
                      <span className="flex items-center gap-2 font-mono">
                        {roles[key] ? short(roles[key]) : "—"}
                        {isRole(key) && (
                          <span className="rounded-full bg-foreground px-2 py-0.5 font-sans text-[10px] font-medium text-background">
                            você
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

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
              Cada etapa é assinada por um papel diferente e só libera quando a anterior foi concluída. Se a sua
              carteira não tiver o papel, o contrato recusa.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => {
              const disabled = !walletAddress || !escrow || !!s.blocked || pending !== null;
              const reason = !walletAddress ? "Conecte a carteira." : !escrow ? "Aguardando os dados do escrow." : s.blocked;
              return (
                <div key={s.id} className="flex flex-col gap-3 rounded-xl border p-5">
                  <span className="flex items-center justify-between">
                    <span
                      className={`grid size-6 place-items-center rounded-full border text-xs font-medium ${s.done ? "border-foreground bg-foreground text-background" : ""}`}
                    >
                      {s.done ? <Check className="size-3.5" aria-label="concluída" /> : i + 1}
                    </span>
                    <HelpTip term={s.term} label={s.label} />
                  </span>
                  <div>
                    <p className="font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground">Quem assina: {s.role}</p>
                  </div>

                  {s.id === "complete" && !s.done && (
                    <label className="flex flex-col gap-1.5 text-xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        Evidência (opcional) <HelpTip term="evidence" label="evidência" />
                      </span>
                      <input
                        className="input"
                        placeholder="Ex.: https://meusite.com"
                        value={evidence}
                        onChange={(e) => setEvidence(e.target.value)}
                      />
                    </label>
                  )}

                  <button
                    onClick={s.onClick}
                    disabled={disabled}
                    className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {pending === s.id && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    {pending === s.id ? "Processando…" : s.done ? "Concluída" : "Executar"}
                  </button>
                  {reason && !s.done && <p className="text-xs text-muted-foreground">{reason}</p>}
                  {s.id === "fund" && !s.done && (
                    <a
                      href={LINKS.usdcFaucet}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4"
                    >
                      Sem USDC? Pegue 100 no faucet <ExternalLink className="size-3" aria-hidden />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({ label, term, value }: { label: string; term: GlossaryKey; value: string }) {
  return (
    <div className="space-y-1 bg-background p-4">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {label} <HelpTip term={term} label={label} />
      </dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
