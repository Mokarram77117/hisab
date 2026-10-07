import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { createStarterData } from "./starter";

export type Profile = typeof profiles.$inferSelect;

/** Profile for the given (already authenticated) user, creating it if missing. */
export const getProfile = cache(async (userId: string, fallbackName: string): Promise<Profile> => {
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (row) return row;
  await createStarterData(db, { id: userId, name: fallbackName });
  const [created] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return created;
});

export type UserSettings = {
  timezone: string;
  weekStartsOn: number;
  currency: string;
  lastUsedAccountId: string | null;
  displayName: string;
};

/** Calendar/currency settings used by queries. Falls back to Bangladesh defaults. */
export const getUserSettings = cache(async (userId: string): Promise<UserSettings> => {
  const [row] = await db
    .select({
      timezone: profiles.timezone,
      weekStartsOn: profiles.startOfWeek,
      currency: profiles.preferredCurrency,
      lastUsedAccountId: profiles.lastUsedAccountId,
      displayName: profiles.displayName,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return (
    row ?? { timezone: "Asia/Dhaka", weekStartsOn: 6, currency: "BDT", lastUsedAccountId: null, displayName: "" }
  );
});
