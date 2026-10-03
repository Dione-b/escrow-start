import type { GetEscrowsFromIndexerResponse, SingleReleaseMilestone } from "@trustless-work/escrow/types";

export type EscrowStatus = "Pendente" | "Concluído" | "Aprovado" | "Liberado";

/** Estado do (único) milestone de um escrow single-release, do mais avançado para o menos. */
export function escrowStatus(escrow: Pick<GetEscrowsFromIndexerResponse, "milestones" | "flags">): EscrowStatus {
  const milestone = escrow.milestones?.[0] as SingleReleaseMilestone | undefined;
  if (escrow.flags?.released) return "Liberado";
  if (milestone?.approved || escrow.flags?.approved) return "Aprovado";
  if (milestone?.status?.toLowerCase() === "completed") return "Concluído";
  return "Pendente";
}
