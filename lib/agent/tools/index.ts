import { registerTools, listTools } from './registry';
import { weddingTools } from './wedding';
import { guestTools } from './guests';
import { roomTools } from './rooms';
import { scheduleTools } from './schedule';
import { contentTools } from './content';
import { travelTools } from './travel';
import { transportationTools } from './transportation';
import { vendorTools } from './vendors';
import { knowledgeTools } from './knowledge';

let registered = false;

/** Idempotent: registers every tool domain exactly once per process. */
export function ensureToolsRegistered() {
  if (registered) return;
  registered = true;
  registerTools([
    ...weddingTools,
    ...guestTools,
    ...roomTools,
    ...scheduleTools,
    ...contentTools,
    ...travelTools,
    ...transportationTools,
    ...vendorTools,
    ...knowledgeTools,
  ]);
}

export function getAllTools() {
  ensureToolsRegistered();
  return listTools();
}

export { dispatchTool, getTool } from './registry';
