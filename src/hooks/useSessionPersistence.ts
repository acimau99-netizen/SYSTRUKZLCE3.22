import { useState, useEffect, useRef, useCallback } from 'react';
import { ParsedSessionState } from '../types/zlce';
import { parseSessionStateMarkdown } from '../utils/markdownParser';
import { INITIAL_SESSION_STATE_MD } from '../data/templates';

export const STORAGE_KEY_ENVELOPE = 'zlce_session_envelope_v3_3';

// Legacy keys for seamless migration
const LEGACY_STORAGE_KEY_MARKDOWN = 'zlce_session_raw_markdown';
const LEGACY_STORAGE_KEY_STATE = 'zlce_session_state_data';
const LEGACY_STORAGE_KEY_LAST_SAVED = 'zlce_session_last_saved';
const LEGACY_STORAGE_KEY_HISTORY = 'zlce_session_history';

export interface ZlceSessionEnvelope {
  schemaVersion: '3.3.0';
  envelopeId: string;
  updatedAt: string;
  projectName: string;
  rawMarkdown: string;
  stateData: ParsedSessionState;
  history: Array<{
    id: string;
    timestamp: number;
    label: string;
    rawMarkdown: string;
  }>;
}

export interface SessionSnapshot {
  id: string;
  timestamp: number;
  label: string;
  rawMarkdown: string;
  stateData: ParsedSessionState;
}

export interface UseSessionPersistenceReturn {
  lastSaved: Date | null;
  isSaved: boolean;
  storageError: string | null;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => boolean;
  redo: () => boolean;
  restoreFromStorage: () => boolean;
  restoreSnapshot: (snapshotId: string) => boolean;
  resetToDefault: () => void;
  createManualSnapshot: (label?: string) => void;
  clearStorage: () => void;
  hasStoredSession: boolean;
  history: SessionSnapshot[];
  historyIndex: number;
}

function loadEnvelopeOrMigrateLegacy(): {
  envelope: ZlceSessionEnvelope | null;
  lastSaved: Date | null;
} {
  try {
    const rawEnvelope = localStorage.getItem(STORAGE_KEY_ENVELOPE);
    if (rawEnvelope) {
      const parsed = JSON.parse(rawEnvelope) as ZlceSessionEnvelope;
      if (parsed && parsed.rawMarkdown) {
        return {
          envelope: parsed,
          lastSaved: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
        };
      }
    }

    // Fallback: migrate from legacy keys if available
    const legacyMd = localStorage.getItem(LEGACY_STORAGE_KEY_MARKDOWN);
    if (legacyMd && legacyMd.trim().length > 0) {
      const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY_LAST_SAVED);
      const legacyState = localStorage.getItem(LEGACY_STORAGE_KEY_STATE);
      let parsedState: ParsedSessionState;
      try {
        parsedState = legacyState ? JSON.parse(legacyState) : parseSessionStateMarkdown(legacyMd);
      } catch {
        parsedState = parseSessionStateMarkdown(legacyMd);
      }

      let historyList: Array<{ id: string; timestamp: number; label: string; rawMarkdown: string }> = [];
      const legacyHist = localStorage.getItem(LEGACY_STORAGE_KEY_HISTORY);
      if (legacyHist) {
        try {
          const parsedH = JSON.parse(legacyHist);
          if (Array.isArray(parsedH)) historyList = parsedH;
        } catch {
          // ignore
        }
      }

      const migratedEnvelope: ZlceSessionEnvelope = {
        schemaVersion: '3.3.0',
        envelopeId: 'migrated-' + Date.now(),
        updatedAt: legacySaved || new Date().toISOString(),
        projectName: parsedState.context?.projectName || 'Project',
        rawMarkdown: legacyMd,
        stateData: parsedState,
        history: historyList
      };

      // Atomic save of migrated envelope
      try {
        localStorage.setItem(STORAGE_KEY_ENVELOPE, JSON.stringify(migratedEnvelope));
      } catch {
        // ignore
      }

      return {
        envelope: migratedEnvelope,
        lastSaved: legacySaved ? new Date(legacySaved) : new Date()
      };
    }
  } catch (err) {
    console.warn('[ZLCE Envelope] Gagal memuat envelope:', err);
  }
  return { envelope: null, lastSaved: null };
}

export function useSessionPersistence(
  rawMarkdown: string,
  stateData: ParsedSessionState,
  setRawMarkdown: React.Dispatch<React.SetStateAction<string>>,
  setStateData: React.Dispatch<React.SetStateAction<ParsedSessionState>>,
  options: { maxHistory?: number; debounceMs?: number } = {}
): UseSessionPersistenceReturn {
  const { maxHistory = 30, debounceMs = 400 } = options;

  const initialLoadRef = useRef(loadEnvelopeOrMigrateLegacy());
  const [lastSaved, setLastSaved] = useState<Date | null>(() => initialLoadRef.current.lastSaved);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [hasStoredSession, setHasStoredSession] = useState<boolean>(() => {
    const env = initialLoadRef.current.envelope;
    return Boolean(env && env.rawMarkdown && env.rawMarkdown.trim().length > 0 && env.rawMarkdown !== INITIAL_SESSION_STATE_MD);
  });

  // History stack for Undo / Redo in current session
  const [history, setHistory] = useState<SessionSnapshot[]>(() => {
    const env = initialLoadRef.current.envelope;
    if (env && Array.isArray(env.history) && env.history.length > 0) {
      return env.history.slice(-maxHistory).map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        label: item.label,
        rawMarkdown: item.rawMarkdown,
        stateData: parseSessionStateMarkdown(item.rawMarkdown)
      }));
    }
    return [
      {
        id: 'init-' + Date.now(),
        timestamp: Date.now(),
        label: 'Initial State',
        rawMarkdown,
        stateData
      }
    ];
  });

  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    return Math.max(0, history.length - 1);
  });

  const isInternalChangeRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Persist to localStorage whenever rawMarkdown or stateData changes atomically via single envelope
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    setIsSaved(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const now = new Date();
        const currentSnapshot = history[historyIndex];
        let nextHistory = history;
        let nextIndex = historyIndex;

        if (!currentSnapshot || currentSnapshot.rawMarkdown !== rawMarkdown) {
          const updatedHistory = history.slice(0, historyIndex + 1);
          const newSnapshot: SessionSnapshot = {
            id: 'snap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            timestamp: Date.now(),
            label: `Edit (${stateData.status?.activeTask || stateData.context?.projectName || 'Update'})`,
            rawMarkdown,
            stateData
          };

          nextHistory = [...updatedHistory, newSnapshot].slice(-maxHistory);
          nextIndex = nextHistory.length - 1;
          setHistory(nextHistory);
          setHistoryIndex(nextIndex);
        }

        const envelope: ZlceSessionEnvelope = {
          schemaVersion: '3.3.0',
          envelopeId: 'env-' + Date.now(),
          updatedAt: now.toISOString(),
          projectName: stateData.context?.projectName || 'Project',
          rawMarkdown,
          stateData,
          history: nextHistory.map(({ id, timestamp, label, rawMarkdown: md }) => ({
            id,
            timestamp,
            label,
            rawMarkdown: md
          }))
        };

        // Atomic write in a single setItem call
        localStorage.setItem(STORAGE_KEY_ENVELOPE, JSON.stringify(envelope));
        setLastSaved(now);
        setIsSaved(true);
        setStorageError(null);
        setHasStoredSession(true);
      } catch (err: any) {
        console.error('[ZLCE Storage] Gagal menyimpan envelope atomik:', err);
        setStorageError(
          err?.name === 'QuotaExceededError'
            ? 'Penyimpanan lokal penuh (Quota Exceeded). Silakan bersihkan riwayat atau unduh berkas SESSION_STATE.md.'
            : 'Penyimpanan lokal gagal. Pastikan browser mengizinkan penyimpanan localStorage.'
        );
        setIsSaved(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rawMarkdown, stateData, history, historyIndex, maxHistory, debounceMs]);

  // Undo: Step back in history
  const undo = useCallback((): boolean => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const targetSnapshot = history[prevIdx];
      if (targetSnapshot) {
        isInternalChangeRef.current = true;
        setHistoryIndex(prevIdx);
        setRawMarkdown(targetSnapshot.rawMarkdown);
        setStateData(targetSnapshot.stateData);
        setIsSaved(true);
        return true;
      }
    }
    return false;
  }, [historyIndex, history, setRawMarkdown, setStateData]);

  // Redo: Step forward in history
  const redo = useCallback((): boolean => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const targetSnapshot = history[nextIdx];
      if (targetSnapshot) {
        isInternalChangeRef.current = true;
        setHistoryIndex(nextIdx);
        setRawMarkdown(targetSnapshot.rawMarkdown);
        setStateData(targetSnapshot.stateData);
        setIsSaved(true);
        return true;
      }
    }
    return false;
  }, [historyIndex, history, setRawMarkdown, setStateData]);

  // Restore: Load persisted rawMarkdown & stateData from envelope
  const restoreFromStorage = useCallback((): boolean => {
    try {
      const { envelope, lastSaved: restoredTime } = loadEnvelopeOrMigrateLegacy();
      if (!envelope || !envelope.rawMarkdown) {
        return false;
      }

      isInternalChangeRef.current = true;
      setRawMarkdown(envelope.rawMarkdown);
      setStateData(envelope.stateData);
      setLastSaved(restoredTime);
      setIsSaved(true);
      setStorageError(null);

      const restoreSnap: SessionSnapshot = {
        id: 'snap-restore-' + Date.now(),
        timestamp: Date.now(),
        label: 'Restored from Storage Envelope',
        rawMarkdown: envelope.rawMarkdown,
        stateData: envelope.stateData
      };

      const next = [...history, restoreSnap].slice(-maxHistory);
      setHistory(next);
      setHistoryIndex(next.length - 1);
      return true;
    } catch (err) {
      console.error('[ZLCE Storage] Gagal memulihkan envelope:', err);
      return false;
    }
  }, [history, maxHistory, setRawMarkdown, setStateData]);

  // Restore a specific snapshot by ID
  const restoreSnapshot = useCallback((snapshotId: string): boolean => {
    const target = history.find(s => s.id === snapshotId);
    if (!target) return false;

    const idx = history.findIndex(s => s.id === snapshotId);
    isInternalChangeRef.current = true;
    setHistoryIndex(idx);
    setRawMarkdown(target.rawMarkdown);
    setStateData(target.stateData);
    setIsSaved(true);
    return true;
  }, [history, setRawMarkdown, setStateData]);

  // Reset to default template
  const resetToDefault = useCallback(() => {
    const defaultData = parseSessionStateMarkdown(INITIAL_SESSION_STATE_MD);
    isInternalChangeRef.current = true;
    setRawMarkdown(INITIAL_SESSION_STATE_MD);
    setStateData(defaultData);

    const now = new Date();
    const resetSnap: SessionSnapshot = {
      id: 'snap-reset-' + Date.now(),
      timestamp: Date.now(),
      label: 'Reset to Template Awal',
      rawMarkdown: INITIAL_SESSION_STATE_MD,
      stateData: defaultData
    };

    const next = [...history, resetSnap].slice(-maxHistory);
    setHistory(next);
    setHistoryIndex(next.length - 1);

    try {
      const envelope: ZlceSessionEnvelope = {
        schemaVersion: '3.3.0',
        envelopeId: 'reset-' + Date.now(),
        updatedAt: now.toISOString(),
        projectName: 'Default Project',
        rawMarkdown: INITIAL_SESSION_STATE_MD,
        stateData: defaultData,
        history: next.map(({ id, timestamp, label, rawMarkdown: md }) => ({ id, timestamp, label, rawMarkdown: md }))
      };
      localStorage.setItem(STORAGE_KEY_ENVELOPE, JSON.stringify(envelope));
      setLastSaved(now);
      setIsSaved(true);
      setStorageError(null);
    } catch {
      // ignore
    }
  }, [history, maxHistory, setRawMarkdown, setStateData]);

  // Create manual snapshot
  const createManualSnapshot = useCallback((label: string = 'Manual Checkpoint') => {
    const manualSnap: SessionSnapshot = {
      id: 'snap-manual-' + Date.now(),
      timestamp: Date.now(),
      label: `${label} (${stateData.status?.activeTask || 'State'})`,
      rawMarkdown,
      stateData
    };

    const next = [...history.slice(0, historyIndex + 1), manualSnap].slice(-maxHistory);
    setHistory(next);
    setHistoryIndex(next.length - 1);
  }, [history, historyIndex, maxHistory, rawMarkdown, stateData]);

  // Clear storage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_ENVELOPE);
      localStorage.removeItem(LEGACY_STORAGE_KEY_MARKDOWN);
      localStorage.removeItem(LEGACY_STORAGE_KEY_STATE);
      localStorage.removeItem(LEGACY_STORAGE_KEY_LAST_SAVED);
      localStorage.removeItem(LEGACY_STORAGE_KEY_HISTORY);
      setHasStoredSession(false);
      setStorageError(null);
    } catch {
      // ignore
    }
  }, []);

  return {
    lastSaved,
    isSaved,
    storageError,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
    restoreFromStorage,
    restoreSnapshot,
    resetToDefault,
    createManualSnapshot,
    clearStorage,
    hasStoredSession,
    history,
    historyIndex
  };
}
