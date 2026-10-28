import React, { useState, useMemo } from 'react';
import { TabType, ParsedSessionState } from './types/zlce';
import { INITIAL_SESSION_STATE_MD } from './data/templates';
import { parseSessionStateMarkdown } from './utils/markdownParser';
import { validateSessionState } from './utils/zlceValidator';
import { Header } from './components/Header';
import { SessionStateTab } from './components/SessionStateTab';
import { LandingWizardTab } from './components/LandingWizardTab';
import { PromptEngineTab } from './components/PromptEngineTab';
import { RuntimeEngineTab } from './components/RuntimeEngineTab';
import { RecoveryTab } from './components/RecoveryTab';
import { RevisionTriageTab } from './components/RevisionTriageTab';
import { TestHarnessTab } from './components/TestHarnessTab';
import { TemplatesTab } from './components/TemplatesTab';
import { TutorialTab } from './components/TutorialTab';
import { PersistentSidebar } from './components/PersistentSidebar';
import { FullscreenEditorModal } from './components/FullscreenEditorModal';
import { useSessionPersistence, SessionSnapshot, UseSessionPersistenceReturn } from './hooks/useSessionPersistence';
import { ShieldCheck, Info, RotateCcw, Undo2, Redo2, Check } from 'lucide-react';

export { useSessionPersistence };
export type { SessionSnapshot, UseSessionPersistenceReturn };

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('session');
  const [isFullscreenEditorOpen, setIsFullscreenEditorOpen] = useState<boolean>(false);

  // Initialize rawMarkdown from localStorage if present
  const [rawMarkdown, setRawMarkdown] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('zlce_session_raw_markdown');
      if (saved && saved.trim().length > 0) {
        return saved;
      }
    } catch {
      // fallback
    }
    return INITIAL_SESSION_STATE_MD;
  });

  // Initialize stateData from localStorage or fallback
  const [stateData, setStateData] = useState<ParsedSessionState>(() => {
    try {
      const savedState = localStorage.getItem('zlce_session_state_data');
      if (savedState) {
        return JSON.parse(savedState);
      }
      const savedMd = localStorage.getItem('zlce_session_raw_markdown');
      if (savedMd) {
        return parseSessionStateMarkdown(savedMd);
      }
    } catch {
      // fallback
    }
    return parseSessionStateMarkdown(INITIAL_SESSION_STATE_MD);
  });

  // Automatic persistence to localStorage with Undo/Restore history capability
  const persistence = useSessionPersistence(
    rawMarkdown,
    stateData,
    setRawMarkdown,
    setStateData,
    { maxHistory: 35, debounceMs: 400 }
  );

  // Global keyboard shortcuts:
  // - Ctrl/Cmd + Shift + F: Toggle Fullscreen Editor
  // - Ctrl/Cmd + Z: Undo session change (when not typing inside an input/textarea)
  // - Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo session change
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Fullscreen shortcut
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsFullscreenEditorOpen(prev => !prev);
        return;
      }

      // Check if user is typing in standard textarea/input
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      // Undo: Ctrl/Cmd + Z (outside raw input, or global)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (!isInputFocused && persistence.canUndo) {
          e.preventDefault();
          persistence.undo();
        }
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (
        ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        if (!isInputFocused && persistence.canRedo) {
          e.preventDefault();
          persistence.redo();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [persistence]);

  // Real-time validation computation (zlce-check port)
  const validation = useMemo(() => {
    return validateSessionState(rawMarkdown);
  }, [rawMarkdown]);

  const handleUpdateMarkdown = (newMd: string) => {
    setRawMarkdown(newMd);
  };

  const handleUpdateStateData = (newData: ParsedSessionState) => {
    setStateData(newData);
  };

  const handleRunLinter = () => {
    // Force re-evaluation and switch to session tab to view diagnostics
    setActiveTab('session');
  };

  const handleToggleFullscreen = () => {
    setIsFullscreenEditorOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        validation={validation}
        onRunLinter={handleRunLinter}
        rawMarkdown={rawMarkdown}
        onToggleFullscreen={handleToggleFullscreen}
        persistence={persistence}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'session' && (
          <SessionStateTab
            stateData={stateData}
            rawMarkdown={rawMarkdown}
            validation={validation}
            onUpdateMarkdown={handleUpdateMarkdown}
            onUpdateStateData={handleUpdateStateData}
            onRunLinter={handleRunLinter}
            onToggleFullscreen={handleToggleFullscreen}
          />
        )}

        {activeTab === 'initiation' && <LandingWizardTab />}

        {activeTab === 'prompt-engine' && <PromptEngineTab />}

        {activeTab === 'runtime-engine' && <RuntimeEngineTab />}

        {activeTab === 'recovery' && <RecoveryTab stateData={stateData} rawMarkdown={rawMarkdown} />}

        {activeTab === 'triage' && <RevisionTriageTab stateData={stateData} />}

        {activeTab === 'harness' && <TestHarnessTab />}

        {activeTab === 'templates' && <TemplatesTab />}

        {activeTab === 'tutorial' && <TutorialTab />}
      </main>

      {/* Persistent Quick Ops Sidebar */}
      <PersistentSidebar
        rawMarkdown={rawMarkdown}
        onUpdateMarkdown={handleUpdateMarkdown}
        stateData={stateData}
        onUpdateStateData={handleUpdateStateData}
        validation={validation}
        onRunLinter={handleRunLinter}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreenEditorOpen}
        persistence={persistence}
      />

      {/* Fullscreen Editor Modal */}
      {isFullscreenEditorOpen && (
        <FullscreenEditorModal
          rawMarkdown={rawMarkdown}
          onUpdateMarkdown={handleUpdateMarkdown}
          onUpdateStateData={handleUpdateStateData}
          validation={validation}
          onClose={() => setIsFullscreenEditorOpen(false)}
          persistence={persistence}
        />
      )}

      {/* Footer info bar */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 sm:px-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Zero-Loss Context Engineering (ZLCE) Kit v3.2.2 • Single Source of Truth</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Anti-Ekstrapolasi Jam: <strong className="text-emerald-400">Fix X1 Aktif</strong></span>
          <span>Protokol Recovery: <strong className="text-cyan-400">Kasus A / B / C / D</strong></span>
        </div>
      </footer>
    </div>
  );
};

export default App;
