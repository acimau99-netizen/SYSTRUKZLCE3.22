import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileJson, 
  FileText, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  RefreshCw, 
  HardDrive,
  Copy,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ParsedSessionState } from '../types/zlce';
import { UseSessionPersistenceReturn, ZlceSessionEnvelope } from '../hooks/useSessionPersistence';
import { 
  validateEnvelope, 
  createEnvelopeFromSession, 
  downloadEnvelopeJson, 
  serializeEnvelopeToJson,
  createWorkspaceBundle
} from '../utils/exportImport';
import { copyText } from '../utils/clipboard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMarkdown: string;
  stateData: ParsedSessionState;
  onUpdateMarkdown: (newMd: string) => void;
  onUpdateStateData: (newData: ParsedSessionState) => void;
  persistence?: UseSessionPersistenceReturn;
  onRunLinter: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rawMarkdown,
  stateData,
  onUpdateMarkdown,
  onUpdateStateData,
  persistence,
  onRunLinter
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'import' | 'projects' | 'about'>('backup');
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    envelope?: ZlceSessionEnvelope;
  }>({ status: 'idle', message: '' });
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Active current envelope
  const currentEnvelope = createEnvelopeFromSession(
    rawMarkdown,
    stateData,
    persistence?.history || [],
    stateData.context.projectName
  );

  const handleExportJson = () => {
    downloadEnvelopeJson(currentEnvelope);
  };

  const handleExportBundle = () => {
    const bundle = createWorkspaceBundle([currentEnvelope]);
    const content = JSON.stringify(bundle, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zlce_workspace_bundle_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    const jsonStr = serializeEnvelopeToJson(currentEnvelope, true);
    const success = await copyText(jsonStr);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportJsonText(text);
        validateAndPreview(text);
      }
    };
    reader.readAsText(file);
  };

  const validateAndPreview = (text: string) => {
    const res = validateEnvelope(text);
    if (res.valid && res.envelope) {
      setImportStatus({
        status: 'success',
        message: `Envelope valid! Proyek: "${res.envelope.projectName}", ${res.envelope.stateData.tasks.length} task, ${res.envelope.history.length} snapshot riwayat.`,
        envelope: res.envelope
      });
    } else {
      setImportStatus({
        status: 'error',
        message: res.error || 'Format envelope tidak valid.',
        envelope: undefined
      });
    }
  };

  const handleApplyImport = () => {
    if (!importStatus.envelope) return;

    const env = importStatus.envelope;
    onUpdateStateData(env.stateData);
    onUpdateMarkdown(env.rawMarkdown);
    setTimeout(onRunLinter, 50);
    setImportStatus({
      status: 'success',
      message: 'Workspace berhasil dipulihkan dari envelope!',
      envelope: env
    });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Manajemen Workspace & Ekosistem</h3>
              <p className="text-xs text-slate-400">Pencadangan, pemulihan riwayat sesi, dan ekspor multi-proyek (TASK-004)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2">
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'backup'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Ekspor / Backup</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'import'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Impor Envelope</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'projects'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Info Sesi Aktif</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200 text-xs">
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-cyan-400" />
                  JSON Envelope ZLCE (v3.3.0 Standard)
                </h4>
                <p className="text-slate-400">
                  Menyimpan seluruh kondisi sesi saat ini beserta seluruh snapshot riwayat undo/redo ({persistence?.history.length || 0} snapshot),
                  konteks proyek, dan detail WAL tanpa ada data yang terputus.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh JSON Envelope</span>
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Bundle Multi-Proyek Workspace
                </h4>
                <p className="text-slate-400">
                  Kemas beberapa proyek sekaligus ke dalam format <code>ZLCE_WORKSPACE_BUNDLE</code> untuk arsip jangka panjang atau migrasi antar perangkat.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleExportBundle}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg font-medium shadow transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Ekspor Workspace Bundle</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Pilih Berkas JSON Envelope (.json)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl bg-slate-950/40 hover:bg-slate-950/80 transition flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-cyan-300"
                >
                  <Upload className="w-6 h-6 text-cyan-400" />
                  <span className="font-medium text-xs">Klik untuk memilih berkas JSON envelope dari komputer Anda</span>
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Atau Tempel (Paste) Konten JSON Envelope:
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => {
                    setImportJsonText(e.target.value);
                    if (e.target.value.trim().length > 10) {
                      validateAndPreview(e.target.value);
                    }
                  }}
                  rows={5}
                  placeholder='{"schemaVersion": "3.3.0", "projectName": "...", "rawMarkdown": "..."}'
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-slate-200 text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Status & Preview Card */}
              {importStatus.message && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  importStatus.status === 'success'
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                }`}>
                  {importStatus.status === 'success' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-medium">{importStatus.message}</p>
                    {importStatus.envelope && (
                      <div className="pt-2">
                        <button
                          onClick={handleApplyImport}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition active:scale-95 shadow"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Terapkan & Pulihkan Sesi Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  Ringkasan Sesi Aktif di Memori
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-300 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Nama Proyek:</span>{' '}
                    <strong className="text-white">{stateData.context.projectName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Mode:</span>{' '}
                    <strong className="text-cyan-400">{stateData.context.mode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Task Aktif:</span>{' '}
                    <strong className="text-amber-400">{stateData.status.activeTask} ({stateData.status.activeTaskStatus})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Jumlah Task:</span>{' '}
                    <strong className="text-white">{stateData.tasks.length} task terdaftar</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Snapshot Riwayat:</span>{' '}
                    <strong className="text-white">{persistence?.history.length || 0} snapshot</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Auto-Save Status:</span>{' '}
                    <span className="text-emerald-400">{persistence?.isSaved ? 'Tersinkron' : 'Menyimpan...'}</span>
                  </div>
                </div>
              </div>

              {persistence && persistence.history.length > 0 && (
                <div className="space-y-2">
                  <label className="text-slate-400 text-xs font-medium">Snapshot Riwayat Tersimpan:</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {persistence.history.map((snap, i) => (
                      <div
                        key={snap.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/80 text-[11px]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="text-slate-200 font-medium truncate">{snap.label}</span>
                          <span className="text-slate-500 font-mono">({new Date(snap.timestamp).toLocaleTimeString('id-ID')})</span>
                        </div>
                        <button
                          onClick={() => {
                            persistence.restoreSnapshot(snap.id);
                            onClose();
                          }}
                          className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-slate-300 rounded border border-slate-700 transition"
                        >
                          Pulihkan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-slate-400 text-[11px]">
          <span>Format: ZLCE Envelope v3.3.0 Standard</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
