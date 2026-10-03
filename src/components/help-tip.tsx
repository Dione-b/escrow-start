"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

/** Ícone "i" que abre uma explicação ao passar o mouse ou focar com o teclado. */
export function HelpTip({ term, label }: { term: GlossaryKey; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`O que é: ${label ?? term}`}
            className="inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          />
        }
      >
        <Info className="size-4" aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{GLOSSARY[term]}</TooltipContent>
    </Tooltip>
  );
}
