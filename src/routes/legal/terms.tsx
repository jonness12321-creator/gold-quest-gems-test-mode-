import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms & policies — CoinQuest" },
      { name: "description", content: "CoinQuest terms of service, privacy and payout policy." },
      { property: "og:title", content: "Terms & policies — CoinQuest" },
      { property: "og:description", content: "CoinQuest terms of service, privacy and payout policy." },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-lg bg-background px-4 py-8">
      <Link to="/home" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
        ← Back to app
      </Link>
      <h1 className="mt-4 text-2xl">Terms & policies</h1>
      <section className="mt-6 space-y-3">
        <h2 className="text-lg">Terms of service</h2>
        <p className="text-sm text-muted-foreground">
          CoinQuest rewards are earned by genuinely completing ads, offers and tasks. Automated
          traffic, emulators, multiple accounts or tampering with reward callbacks void all balances.
        </p>
        <h2 className="text-lg">Privacy</h2>
        <p className="text-sm text-muted-foreground">
          We store your account details, wallet activity and a device identifier used solely for
          fraud prevention. Verification documents are used only to approve payouts.
        </p>
        <h2 className="text-lg">Payout policy</h2>
        <p className="text-sm text-muted-foreground">
          Withdrawals start at $5.00 and are reviewed manually. Identity verification is required
          once lifetime earnings pass $20.00. Rejected requests return the amount to your wallet.
        </p>
      </section>
    </main>
  );
}
