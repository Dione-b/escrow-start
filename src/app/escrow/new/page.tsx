"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useInitializeEscrow } from "@trustless-work/escrow/hooks";
import type { InitializeSingleReleaseEscrowPayload } from "@trustless-work/escrow/types";
import { useForm } from "react-hook-form";
import { AppHeader } from "@/components/app-header";
import { Field } from "@/components/field";
import { HelpTip } from "@/components/help-tip";
import { useWalletContext } from "@/components/tw-blocks/providers/WalletProvider";
import { isValidWallet } from "@/components/tw-blocks/wallet-kit/validators";
import { USDC_TESTNET } from "@/lib/constants";
import type { GlossaryKey } from "@/lib/glossary";
import { errorMessage } from "@/lib/errors";
import { useSignAndSend } from "@/lib/use-sign-and-send";

type FormValues = {
  title: string;
  description: string;
  amount: number;
  platformFee: number;
  milestone: string;
  approver: string;
  serviceProvider: string;
  releaseSigner: string;
  disputeResolver: string;
  receiver: string;
  platformAddress: string;
};

type RoleName = Extract<
  keyof FormValues,
  "approver" | "serviceProvider" | "releaseSigner" | "disputeResolver" | "receiver" | "platformAddress"
>;

const ROLE_FIELDS: { name: RoleName; label: string; hint: string }[] = [
  { name: "approver", label: "Approver", hint: "Aprova a entrega" },
  { name: "serviceProvider", label: "Service Provider", hint: "Faz o trabalho" },
  { name: "releaseSigner", label: "Release Signer", hint: "Libera os fundos" },
  { name: "disputeResolver", label: "Dispute Resolver", hint: "Resolve disputas" },
  { name: "receiver", label: "Receiver", hint: "Recebe o pagamento" },
  { name: "platformAddress", label: "Platform Address", hint: "Recebe a taxa" },
];

const INVALID_ADDRESS = "Endereço Stellar inválido (começa com G, 56 caracteres)";

export default function NewEscrowPage() {
  const { walletAddress } = useWalletContext();
  const router = useRouter();
  const { deployEscrow } = useInitializeEscrow();
  const signAndSend = useSignAndSend();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { amount: 10, platformFee: 1 },
  });

  // Atalho para a demo: preencher todos os papéis com a carteira conectada
  const fillWithMyWallet = () => {
    if (!walletAddress) return;
    ROLE_FIELDS.forEach((f) => setValue(f.name, walletAddress, { shouldValidate: true }));
  };

  const onSubmit = async (values: FormValues) => {
    if (!walletAddress) return;

    const payload: InitializeSingleReleaseEscrowPayload = {
      signer: walletAddress,
      engagementId: crypto.randomUUID(),
      title: values.title,
      description: values.description,
      amount: values.amount,
      platformFee: values.platformFee,
      roles: {
        approver: values.approver,
        serviceProvider: values.serviceProvider,
        platformAddress: values.platformAddress,
        releaseSigner: values.releaseSigner,
        disputeResolver: values.disputeResolver,
        receiver: values.receiver,
      },
      trustline: { address: USDC_TESTNET.address, symbol: USDC_TESTNET.symbol },
      milestones: [{ description: values.milestone }],
    };

    try {
      // 1. A API devolve o XDR não assinado
      const { unsignedTransaction } = await deployEscrow(payload, "single-release");
      if (!unsignedTransaction) throw new Error("A API não retornou a transação para assinar.");

      // 2 e 3. Assina na carteira e envia: só então o contrato passa a existir on-chain
      const data = await signAndSend(unsignedTransaction);
      if (!("contractId" in data) || !data.contractId) throw new Error("O contrato não foi retornado pela API.");

      toast.success("Escrow criado!");
      router.push(`/escrow/${encodeURIComponent(data.contractId)}`);
    } catch (error) {
      console.error("Erro ao criar escrow:", error);
      toast.error(errorMessage(error));
    }
  };

  const onInvalid = () => toast.error("Corrija os campos destacados antes de continuar.");

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> Voltar
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Novo escrow</h1>
          <p className="text-muted-foreground">
            Modelo <strong className="font-medium text-foreground">single-release</strong>: um pagamento único,
            liberado depois que o milestone for aprovado. Passe o mouse nos ícones ⓘ para entender cada campo.
          </p>
          {!walletAddress && (
            <p className="rounded-md border border-dashed px-3 py-2 text-sm">
              Conecte sua carteira (canto superior direito) para criar o escrow.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8" noValidate>
          <Section number={1} title="O combinado" description="O que será entregue e como será descrito.">
            <Field label="Título" term="title" error={errors.title?.message}>
              <input className="input" placeholder="Ex.: Site institucional" {...register("title", { required: "Informe um título" })} />
            </Field>
            <Field label="Descrição" term="description" error={errors.description?.message}>
              <textarea
                className="input min-h-20"
                placeholder="Ex.: Criar e publicar o site com 5 páginas"
                {...register("description", { required: "Informe uma descrição" })}
              />
            </Field>
            <Field label="Milestone" term="milestone" error={errors.milestone?.message}>
              <input className="input" placeholder="Ex.: Entregar o site" {...register("milestone", { required: "Descreva o milestone" })} />
            </Field>
          </Section>

          <Section number={2} title="O valor" description="Quanto fica travado e qual a taxa da plataforma.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Valor (USDC)" term="amount" error={errors.amount?.message} hint="Mínimo 0,01">
                <input
                  type="number"
                  step="any"
                  className="input"
                  {...register("amount", {
                    valueAsNumber: true,
                    required: "Informe o valor",
                    min: { value: 0.01, message: "O valor mínimo é 0,01" },
                  })}
                />
              </Field>
              <Field label="Taxa da plataforma (%)" term="platformFee" error={errors.platformFee?.message} hint="Entre 0 e 100">
                <input
                  type="number"
                  step="any"
                  className="input"
                  {...register("platformFee", {
                    valueAsNumber: true,
                    required: "Informe a taxa",
                    min: { value: 0, message: "A taxa não pode ser negativa" },
                    max: { value: 100, message: "A taxa máxima é 100%" },
                  })}
                />
              </Field>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Token: {USDC_TESTNET.symbol} (testnet) <HelpTip term="trustline" label="trustline" />
            </p>
          </Section>

          <Section
            number={3}
            title="Quem faz o quê"
            description="Cada papel é um endereço Stellar (G…) e só pode executar a sua etapa."
            action={
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={fillWithMyWallet}
                  disabled={!walletAddress}
                  className="text-sm font-medium underline underline-offset-4 disabled:no-underline disabled:opacity-50"
                >
                  Usar minha carteira em todos
                </button>
                <HelpTip term="fillWithMyWallet" label="usar minha carteira" />
              </span>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {ROLE_FIELDS.map((f) => (
                <Field key={f.name} label={f.label} term={f.name as GlossaryKey} hint={f.hint} error={errors[f.name]?.message}>
                  <input
                    className="input font-mono text-xs"
                    placeholder="G…"
                    autoComplete="off"
                    spellCheck={false}
                    {...register(f.name, {
                      required: "Informe o endereço",
                      validate: (v) => isValidWallet(String(v)) || INVALID_ADDRESS,
                    })}
                  />
                </Field>
              ))}
            </div>
          </Section>

          <div className="flex items-center justify-between gap-4 border-t pt-6">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Você assina com a sua carteira <HelpTip term="signer" label="assinatura" />
            </p>
            <button
              type="submit"
              disabled={!walletAddress || isSubmitting}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {isSubmitting ? "Criando escrow…" : "Deploy escrow"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

function Section({
  number,
  title,
  description,
  action,
  children,
}: {
  number: number;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-xs font-medium text-background">
            {number}
          </span>
          <div>
            <h2 className="font-semibold leading-7">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
