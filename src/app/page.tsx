"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { HelpTip } from "@/components/help-tip";
import { useWalletContext } from "@/components/tw-blocks/providers/WalletProvider";
import { LINKS, isValidContractId } from "@/lib/constants";
import type { GlossaryKey } from "@/lib/glossary";

const FLOW: { title: string; who: string; term: GlossaryKey }[] = [
  { title: "Deploy", who: "Quem cria o escrow", term: "stepDeploy" },
  { title: "Fund", who: "Depositante (USDC)", term: "stepFund" },
  { title: "Concluir milestone", who: "Service provider", term: "stepComplete" },
  { title: "Aprovar", who: "Approver", term: "stepApprove" },
  { title: "Liberar fundos", who: "Release signer", term: "stepRelease" },
];

const PREREQS: { text: string; link?: { label: string; href: string } }[] = [
  { text: "Extensão Freighter configurada na Testnet" },
  { text: "Conta com XLM de teste", link: { label: "friendbot", href: LINKS.friendbot } },
  { text: "Trustline de USDC testnet na sua conta (Stellar Lab)" },
  { text: "Saldo de USDC testnet (100 USDC grátis)", link: { label: "faucet Sozu", href: LINKS.usdcFaucet } },
  { text: "API key no arquivo .env.local" },
];

export default function HomePage() {
  const { walletAddress } = useWalletContext();
  const [contractId, setContractId] = useState("");
  const router = useRouter();
  const invalid = contractId !== "" && !isValidContractId(contractId);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl space-y-12 px-4 py-12">
        <section className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Trustless Work · Stellar
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Pagamentos que só saem quando o trabalho é aprovado.
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Um <strong className="font-medium text-foreground">escrow</strong> trava o dinheiro em um contrato
            inteligente. Ele só é liberado depois que o trabalho é entregue e aprovado, sem depender de
            terceiros. Passe o mouse nos ícones <span aria-hidden>ⓘ</span> para entender cada conceito.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/escrow/new"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Criar novo escrow <ArrowRight className="size-4" aria-hidden />
            </Link>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Carteira: {walletAddress ? <code className="font-mono text-xs text-foreground">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</code> : "não conectada"}
              <HelpTip term="wallet" label="carteira" />
            </span>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-lg font-semibold">Como o fluxo funciona</h2>
          <ol className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-5">
            {FLOW.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-2 bg-background p-4">
                <span className="grid size-6 place-items-center rounded-full border text-xs font-medium">{i + 1}</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {step.title}
                  <HelpTip term={step.term} label={step.title} />
                </span>
                <span className="text-xs text-muted-foreground">{step.who}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 rounded-xl border p-6">
            <h2 className="text-lg font-semibold">Antes de começar</h2>
            <ul className="space-y-2 text-sm">
              {PREREQS.map((item) => (
                <li key={item.text} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    {item.text}
                    {item.link && (
                      <>
                        {" · "}
                        <a
                          href={item.link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
                        >
                          {item.link.label} <ExternalLink className="size-3" aria-hidden />
                        </a>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <form
            className="space-y-3 rounded-xl border p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (isValidContractId(contractId)) router.push(`/escrow/${encodeURIComponent(contractId)}`);
            }}
          >
            <h2 className="flex items-center gap-1.5 text-lg font-semibold">
              Abrir um escrow existente
              <HelpTip term="contractId" label="Contract ID" />
            </h2>
            <input
              className="input w-full font-mono text-xs"
              placeholder="Contract ID (C…)"
              aria-label="Contract ID"
              value={contractId}
              onChange={(e) => setContractId(e.target.value.trim())}
              aria-invalid={invalid}
            />
            {invalid && (
              <p role="alert" className="text-xs font-medium text-destructive">
                Formato inválido: começa com C e tem 56 caracteres.
              </p>
            )}
            <button
              type="submit"
              disabled={!isValidContractId(contractId)}
              className="h-10 rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Abrir
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
