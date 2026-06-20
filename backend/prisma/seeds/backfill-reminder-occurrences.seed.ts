/**
 * Backfill ReminderOccurrence rows from existing Reminder records.
 *
 * Run-once after the add_reminder_subject_and_occurrences migration. Idempotent —
 * safe to re-run thanks to the (reminderId, scheduledAt) unique constraint.
 *
 * For each non-terminal Reminder:
 *   - inserts one occurrence at remindAt;
 *   - if lastSentAt is set, marks that occurrence FIRED with firedAt = lastSentAt;
 *   - otherwise leaves it SCHEDULED so the scheduler picks it up.
 *
 * The scheduler's normal materialise-on-fire step takes over from there for recurring
 * reminders.
 */
import { PrismaClient } from '@prisma/client';

export async function backfillReminderOccurrences(prisma: PrismaClient) {
  const reminders = await prisma.reminder.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'EXPIRED'] as any[] },
    },
    select: {
      id: true,
      remindAt: true,
      lastSentAt: true,
      status: true,
    },
  });

  let inserted = 0;
  let skipped = 0;

  for (const r of reminders) {
    const state = r.lastSentAt ? 'FIRED' : 'SCHEDULED';
    try {
      // @ts-ignore - prisma client regen pending
      await prisma.reminderOccurrence.create({
        data: {
          reminderId: r.id,
          scheduledAt: r.remindAt,
          state,
          firedAt: r.lastSentAt ?? null,
        },
      });
      inserted++;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        skipped++;
        continue;
      }
      throw err;
    }
  }

  console.log(
    `[backfillReminderOccurrences] inserted=${inserted} skipped=${skipped} ` +
      `total-reminders=${reminders.length}`,
  );
}

// Allow standalone invocation: `ts-node backfill-reminder-occurrences.seed.ts`
if (require.main === module) {
  const prisma = new PrismaClient();
  backfillReminderOccurrences(prisma)
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
