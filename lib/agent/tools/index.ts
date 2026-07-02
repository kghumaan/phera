import { registerTools, listTools } from './registry';
import { weddingTools } from './wedding';
import { guestTools } from './guests';
import { roomTools } from './rooms';
import { scheduleTools } from './schedule';
import { contentTools } from './content';
import { travelTools } from './travel';
import { transportationTools } from './transportation';
import { vendorTools } from './vendors';
import { directoryTools } from './directory';
import { knowledgeTools } from './knowledge';
import { askTools } from './ask';
import { goalsTools } from './goals';
import { focusTools } from './focus';
import { uploadTools } from './upload';
import { shagunTools } from './shagun';
import { consentTools } from './consent';
import { requestTools } from './requests';
import { messagingTools } from './messaging';

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
    ...directoryTools,
    ...knowledgeTools,
    ...askTools,
    ...goalsTools,
    ...focusTools,
    ...uploadTools,
    ...shagunTools,
    ...consentTools,
    ...requestTools,
    ...messagingTools,
  ]);
}

export function getAllTools() {
  ensureToolsRegistered();
  return listTools();
}

export { dispatchTool, getTool } from './registry';
