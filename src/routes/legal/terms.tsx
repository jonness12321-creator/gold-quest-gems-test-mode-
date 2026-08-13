import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms & policies — CashGPT" },
      { name: "description", content: "CashGPT terms of service, privacy and payout policy." },
      { property: "og:title", content: "Terms & policies — CashGPT" },
      { property: "og:description", content: "CashGPT terms of service, privacy and payout policy." },
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
          CashGPT rewards are earned by genuinely completing ads, offers and tasks. Automated
          traffic, emulators, multiple accounts or tampering with reward callbacks void all balances.
        </p>
        <h2 className="text-lg">Privacy</h2>
        <p className="text-sm text-muted-foreground">
          We store your account details, wallet activity and a device identifier used solely for
          fraud prevention. Verification documents are used only to approve payouts.
        </p>
        <h2 className="text-lg">Payout policy</h2>
        <p className="text-sm text-muted-foreground">
          Withdrawals start at $5.00 and are reviewed manually. Rejected requests return the amount
          to your wallet.
        </p>
        <h2 className="text-lg">Referral program</h2>
        <p className="text-sm text-muted-foreground">
          You can earn up to $3.00 per referred friend: $1.00 when they sign up, $1.00 when they
          complete their first task, offer or quest, and $1.00 when they complete their first
          withdrawal. Each milestone pays once per referral.
        </p>
        <p className="text-sm text-muted-foreground">
          Complete all 3 milestones within 1 year of your friend's signup to keep the referral
          rewards. If your referred friend does not complete their first withdrawal within 1 year of
          their signup, the first two $1 referral rewards credited for that referral will be
          reversed/removed from the referrer's balance.
        </p>
      </section>
    </main>
  );
}
