import { storage } from "@/lib/db/storage";
import type { InsertNotification } from "@shared/schema";
export { notifyTemplates } from "@/lib/notification-templates";

/**
 * Helper to safely create notifications without breaking the parent transaction.
 * If notification creation fails (e.g., DB issue), it's logged but doesn't throw.
 */
export async function notify(input: InsertNotification): Promise<void> {
  try {
    await storage.createNotification(input);
  } catch (e) {
    console.error("[notify] failed to create notification:", e);
  }
}
