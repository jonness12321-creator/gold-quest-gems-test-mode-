import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/coinquest";
import { adminOverview, adminUpdateKyc, adminUpdateWithdrawal } from "@/lib/coinquest.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — CoinQuest" },
      { name: "description", content: "Review withdrawals, verifications and platform metrics." },
      { property: "og:title", content: "Admin — CoinQuest" },
      { property: "og:description", content: "Review withdrawals, verifications and platform metrics." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const overview = useServerFn(adminOverview);
  const updateWithdrawal = useServerFn(adminUpdateWithdrawal);
  const updateKyc = useServerFn(adminUpdateKyc);

  const data = useQuery({
    queryKey: ["admin-overview"],
    enabled: isAdmin,
    queryFn: () => overview({}),
  });

  const withdrawalAction = useMutation({
    mutationFn: (input: { id: string; status: "approved" | "rejected" | "paid" }) =>
      updateWithdrawal({ data: input }),
    onSuccess: () => {
      toast.success("Withdrawal updated.");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const kycAction = useMutation({
    mutationFn: (input: { id: string; status: "approved" | "rejected" }) =>
      updateKyc({ data: input }),
    onSuccess: () => {
      toast.success("Verification updated.");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isAdmin) {
    return (
      <AppShell subtitle="Admin">
        <p className="mt-8 text-center text-sm text-muted-foreground">
          You don't have access to the admin panel.
        </p>
      </AppShell>
    );
  }

  const stats = data.data?.stats;

  return (
    <AppShell subtitle="Admin">
      <h1 className="mt-2 text-2xl">Admin panel</h1>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="surface-card p-3">
          <p className="text-xs text-muted-foreground">Users</p>
          <p className="text-amount text-lg">{stats?.users ?? 0}</p>
        </div>
        <div className="surface-card p-3">
          <p className="text-xs text-muted-foreground">Paid out</p>
          <p className="text-amount text-lg">{formatMoney(stats?.paidOut ?? 0)}</p>
        </div>
      </div>

      <SectionTitle>Pending withdrawals</SectionTitle>
      <ul className="space-y-2">
        {(data.data?.withdrawals ?? []).map((request) => (
          <li key={request.id} className="surface-card p-3">
            <div className="flex items-center justify-between">
              <p className="text-amount">{formatMoney(request.amount)}</p>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(request.created_at)}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="jade"
                onClick={() => withdrawalAction.mutate({ id: request.id, status: "approved" })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="gold"
                onClick={() => withdrawalAction.mutate({ id: request.id, status: "paid" })}
              >
                Mark paid
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => withdrawalAction.mutate({ id: request.id, status: "rejected" })}
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <SectionTitle>Pending verifications</SectionTitle>
      <ul className="space-y-2">
        {(data.data?.kyc ?? []).map((submission) => (
          <li key={submission.id} className="surface-card p-3">
            <p className="font-semibold">{submission.full_name}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(submission.created_at)}</p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="jade"
                onClick={() => kycAction.mutate({ id: submission.id, status: "approved" })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => kycAction.mutate({ id: submission.id, status: "rejected" })}
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
