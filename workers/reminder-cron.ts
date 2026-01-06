import type { ScheduledEvent, ExecutionContext } from '@cloudflare/workers-types';

export interface Env {
  NEXT_PUBLIC_APP_URL: string;
  CRON_SECRET: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('[Cron Worker] Triggering appointment reminders');

    try {
      // Call your Next.js API endpoint
      const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/cron/send-reminders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.CRON_SECRET}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[Cron Worker] Reminder job failed:', result);
        throw new Error(`Reminder job failed: ${JSON.stringify(result)}`);
      }

      console.log('[Cron Worker] Reminder job result:', result);

      return result;
    } catch (error) {
      console.error('[Cron Worker] Error triggering reminders:', error);
      throw error;
    }
  },
};
