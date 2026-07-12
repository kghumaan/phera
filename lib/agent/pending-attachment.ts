/**
 * Carries a file attached in the landing-page hero chat box into the planner.
 *
 * The File object itself rides a module-level singleton — it survives the
 * client-side router.push from the landing page to the assistant (same JS
 * context), which is the normal path. The file NAME is also stashed in
 * sessionStorage so that when the flow detours through a full-page auth
 * redirect (anonymous sign-ins disabled → login → /welcome), the planner can
 * at least tell the agent an attachment was lost and ask for a re-attach.
 */

const NAME_KEY = 'phera-pending-attachment-name';

let pendingFile: File | null = null;

export function setPendingAttachment(file: File | null) {
  pendingFile = file;
  try {
    if (file) window.sessionStorage.setItem(NAME_KEY, file.name);
    else window.sessionStorage.removeItem(NAME_KEY);
  } catch {
    /* private mode — the in-memory file still works for the same-context path */
  }
}

/** The attached File, if it survived (same-context navigation). Clears both stores. */
export function takePendingAttachment(): File | null {
  const file = pendingFile;
  pendingFile = null;
  if (file) {
    try {
      window.sessionStorage.removeItem(NAME_KEY);
    } catch {
      /* noop */
    }
  }
  return file;
}

/** The lost attachment's name, when only the sessionStorage stash survived a
 *  full-page redirect. Clears it. */
export function takeLostAttachmentName(): string | null {
  try {
    const name = window.sessionStorage.getItem(NAME_KEY);
    if (name) window.sessionStorage.removeItem(NAME_KEY);
    return name;
  } catch {
    return null;
  }
}

/** Route a hero attachment into the planner's existing import pipelines by
 *  extension: spreadsheets/contacts → guest list, PDFs/images → floor plan.
 *  null = a type the chat can't parse yet (the agent acknowledges it instead). */
export function attachmentImportKind(fileName: string): 'guests' | 'rooms' | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['csv', 'tsv', 'txt', 'xlsx', 'xls', 'vcf', 'vcard'].includes(ext)) return 'guests';
  if (['pdf', 'png', 'jpg', 'jpeg', 'webp', 'heic'].includes(ext)) return 'rooms';
  return null;
}
