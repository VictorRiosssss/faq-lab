"use server";

import { requireAdmin } from "@/server/auth/session";
import { getDashboardStats as getDashboardStatsQuery } from "@/server/db/queries/stats.queries";

export async function getDashboardStats() {
  await requireAdmin();
  return getDashboardStatsQuery();
}
