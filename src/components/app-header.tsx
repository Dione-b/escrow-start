import Link from "next/link";
import { WalletButton } from "@/components/tw-blocks/wallet-kit/WalletButtons";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-foreground text-xs font-bold text-background">
            E
          </span>
          Escrow Start
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            testnet
          </span>
        </Link>
        <WalletButton />
      </div>
    </header>
  );
}
