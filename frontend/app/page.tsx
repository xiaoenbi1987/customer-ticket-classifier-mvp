"use client";

import { useCallback, useEffect, useState } from "react";
import { adjustTicket, confirmTicket, getStats, getTickets } from "@/lib/api";
import type { Stats, Ticket } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import StatsBar from "@/components/StatsBar";
import TicketTable from "@/components/TicketTable";

export default function Home() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [ticketData, statsData] = await Promise.all([
        getTickets(),
        getStats(),
      ]);
      setTickets(ticketData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleConfirm(ticketId: string) {
    const updated = await confirmTicket(ticketId);
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
  }

  async function handleAdjust(ticketId: string, newPriority: number) {
    const updated = await adjustTicket(ticketId, newPriority);
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("page.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("page.subtitle")}
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : (
          <div className="space-y-6">
            {stats && <StatsBar stats={stats} />}
            <TicketTable
              tickets={tickets}
              onConfirm={handleConfirm}
              onAdjust={handleAdjust}
            />
          </div>
        )}
      </main>
    </div>
  );
}
