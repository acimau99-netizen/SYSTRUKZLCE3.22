/**
 * ZLCE Workspace Export/Import Utilities (TASK-004)
 * Provides robust JSON envelope serialization, validation, multi-project bundling,
 * and loss-less history preservation conforming to ZLCE v3.3.0 specifications.
 */

import { ParsedSessionState } from '../types/zlce';
import { ZlceSessionEnvelope, SessionSnapshot } from '../hooks/useSessionPersistence';
import { parseSessionStateMarkdown } from './markdownParser';

export interface EnvelopeValidationResult {
  valid: boolean;
  error?: string;
  envelope?: ZlceSessionEnvelope;
  warnings?: string[];
}

export interface WorkspaceBundle {
  format: 'ZLCE_WORKSPACE_BUNDLE';
  bundleVersion: '1.0.0';
  createdAt: string;
  activeProjectId: string;
  projects: ZlceSessionEnvelope[];
}

/**
 * Validates a JSON string as a valid ZlceSessionEnvelope.
 * Enforces schema compliance, ensures all required sections exist,
 * and confirms history records remain intact without data loss.
 */
export function validateEnvelope(jsonString: string): EnvelopeValidationResult {
  if (!jsonString || typeof jsonString !== 'string' || jsonString.trim().length === 0) {
    return { valid: false, error: 'Konten JSON kosong atau tidak valid.' };
  }

  let data: any;
  try {
    data = JSON.parse(jsonString);
  } catch (err: any) {
    return { valid: false, error: `Format JSON tidak valid: ${err.message}` };
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, error: 'Root dokumen envelope harus berupa objek JSON.' };
  }

  // Schema version check
  if (!data.schemaVersion) {
    return { valid: false, error: "Field 'schemaVersion' tidak ditemukan dalam envelope." };
  }

  // Validate raw markdown presence
  if (typeof data.rawMarkdown !== 'string' || data.rawMarkdown.trim().length === 0) {
    return { valid: false, error: "Field 'rawMarkdown' kosong atau tidak valid." };
  }

  // Validate stateData or re-generate if missing
  let stateData = data.stateData;
  const warnings: string[] = [];

  if (!stateData || typeof stateData !== 'object') {
    warnings.push("Field 'stateData' tidak ditemukan; dipulihkan dari 'rawMarkdown'.");
    stateData = parseSessionStateMarkdown(data.rawMarkdown);
  } else {
    if (!stateData.status || !Array.isArray(stateData.tasks) || !stateData.wal) {
      warnings.push("Struktur 'stateData' tidak lengkap; dinormalisasi ulang dari 'rawMarkdown'.");
      stateData = parseSessionStateMarkdown(data.rawMarkdown);
    }
  }

  // Validate history array
  let history = data.history;
  if (!Array.isArray(history)) {
    warnings.push("Field 'history' bukan array; diinisialisasi sebagai array kosong.");
    history = [];
  } else {
    // Validate each snapshot in history
    history = history.map((item: any, idx: number) => {
      const snapId = typeof item.id === 'string' ? item.id : `snap-${idx}-${Date.now()}`;
      const snapTime = typeof item.timestamp === 'number' ? item.timestamp : Date.now();
      const snapLabel = typeof item.label === 'string' ? item.label : `Snapshot ${idx + 1}`;
      const snapMd = typeof item.rawMarkdown === 'string' ? item.rawMarkdown : data.rawMarkdown;
      return {
        id: snapId,
        timestamp: snapTime,
        label: snapLabel,
        rawMarkdown: snapMd
      };
    });
  }

  const envelope: ZlceSessionEnvelope = {
    schemaVersion: '3.3.0',
    envelopeId: typeof data.envelopeId === 'string' && data.envelopeId ? data.envelopeId : `env-${Date.now()}`,
    updatedAt: typeof data.updatedAt === 'string' && data.updatedAt ? data.updatedAt : new Date().toISOString(),
    projectName: typeof data.projectName === 'string' && data.projectName ? data.projectName : (stateData.context?.projectName || 'Project'),
    rawMarkdown: data.rawMarkdown,
    stateData,
    history
  };

  return {
    valid: true,
    envelope,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Creates a validated ZlceSessionEnvelope from active memory session state.
 */
export function createEnvelopeFromSession(
  rawMarkdown: string,
  stateData: ParsedSessionState,
  history: SessionSnapshot[] = [],
  projectName?: string
): ZlceSessionEnvelope {
  const pName = projectName || stateData.context?.projectName || 'ZLCE Studio';
  return {
    schemaVersion: '3.3.0',
    envelopeId: `zlce-env-${Date.now()}`,
    updatedAt: new Date().toISOString(),
    projectName: pName,
    rawMarkdown,
    stateData,
    history: history.map(h => ({
      id: h.id,
      timestamp: h.timestamp,
      label: h.label,
      rawMarkdown: h.rawMarkdown
    }))
  };
}

/**
 * Serializes an envelope to a formatted JSON string.
 */
export function serializeEnvelopeToJson(envelope: ZlceSessionEnvelope, pretty: boolean = true): string {
  return JSON.stringify(envelope, null, pretty ? 2 : undefined);
}

/**
 * Triggers a client-side file download for an envelope JSON file.
 */
export function downloadEnvelopeJson(envelope: ZlceSessionEnvelope, customFilename?: string): void {
  const cleanName = (envelope.projectName || 'session').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = customFilename || `zlce_workspace_${cleanName}_v3.3.0.json`;
  const content = serializeEnvelopeToJson(envelope, true);

  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Creates a multi-project workspace backup bundle.
 */
export function createWorkspaceBundle(
  envelopes: ZlceSessionEnvelope[],
  activeProjectId?: string
): WorkspaceBundle {
  return {
    format: 'ZLCE_WORKSPACE_BUNDLE',
    bundleVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    activeProjectId: activeProjectId || (envelopes[0]?.envelopeId || 'default'),
    projects: envelopes
  };
}

/**
 * Validates and unpacks a workspace bundle from JSON.
 */
export function validateWorkspaceBundle(jsonString: string): {
  valid: boolean;
  error?: string;
  bundle?: WorkspaceBundle;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Format JSON bukan objek valid.' };
    }

    // Check if it is a single envelope instead of a bundle
    if (data.schemaVersion && data.rawMarkdown) {
      const single = validateEnvelope(jsonString);
      if (single.valid && single.envelope) {
        return {
          valid: true,
          bundle: {
            format: 'ZLCE_WORKSPACE_BUNDLE',
            bundleVersion: '1.0.0',
            createdAt: new Date().toISOString(),
            activeProjectId: single.envelope.envelopeId,
            projects: [single.envelope]
          }
        };
      }
      return { valid: false, error: single.error };
    }

    if (data.format !== 'ZLCE_WORKSPACE_BUNDLE') {
      return { valid: false, error: "Header bundle bukan 'ZLCE_WORKSPACE_BUNDLE'." };
    }

    if (!Array.isArray(data.projects) || data.projects.length === 0) {
      return { valid: false, error: 'Bundle tidak memiliki daftar proyek yang valid.' };
    }

    return {
      valid: true,
      bundle: data as WorkspaceBundle
    };
  } catch (err: any) {
    return { valid: false, error: `Gagal membaca bundle: ${err.message}` };
  }
}
