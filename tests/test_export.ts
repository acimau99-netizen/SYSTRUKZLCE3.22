/**
 * Unit Test Suite for Workspace Export / Import & Envelope Integrity (TASK-004)
 */

import fs from 'fs';
import path from 'path';
import { 
  validateEnvelope, 
  createEnvelopeFromSession, 
  serializeEnvelopeToJson, 
  createWorkspaceBundle,
  validateWorkspaceBundle
} from '../src/utils/exportImport';
import { parseSessionStateMarkdown } from '../src/utils/markdownParser';
import { SessionSnapshot } from '../src/hooks/useSessionPersistence';

function runTests() {
  console.log('=== RUNNING WORKSPACE EXPORT/IMPORT INTEGRITY TESTS (TASK-004) ===');

  const rootPath = process.cwd();
  const sampleMdPath = path.join(rootPath, 'SESSION_STATE.md');
  const rawMarkdown = fs.readFileSync(sampleMdPath, 'utf8');
  const stateData = parseSessionStateMarkdown(rawMarkdown);

  const mockSnapshots: SessionSnapshot[] = [
    {
      id: 'snap-1',
      timestamp: 1730480000000,
      label: 'Initial State',
      rawMarkdown: rawMarkdown,
      stateData: stateData
    },
    {
      id: 'snap-2',
      timestamp: 1730483600000,
      label: 'Step Completed',
      rawMarkdown: rawMarkdown,
      stateData: stateData
    }
  ];

  // Test 1: Create and validate envelope
  const envelope = createEnvelopeFromSession(rawMarkdown, stateData, mockSnapshots, 'ZLCE Test Project');
  if (envelope.projectName !== 'ZLCE Test Project') {
    throw new Error(`Test 1 Failed: Project name mismatch: ${envelope.projectName}`);
  }
  if (envelope.history.length !== 2) {
    throw new Error(`Test 1 Failed: History snapshots lost! Expected 2, got ${envelope.history.length}`);
  }
  console.log('  [PASS] Test 1: createEnvelopeFromSession preserves all metadata and history snapshots');

  // Test 2: Serialization and round-trip validation
  const jsonStr = serializeEnvelopeToJson(envelope);
  const valResult = validateEnvelope(jsonStr);
  if (!valResult.valid || !valResult.envelope) {
    throw new Error(`Test 2 Failed: Envelope validation failed: ${valResult.error}`);
  }
  if (valResult.envelope.history.length !== 2) {
    throw new Error(`Test 2 Failed: Deserialized history count mismatch: ${valResult.envelope.history.length}`);
  }
  if (valResult.envelope.rawMarkdown !== rawMarkdown) {
    throw new Error('Test 2 Failed: Raw markdown content corrupted during round-trip');
  }
  console.log('  [PASS] Test 2: Round-trip JSON serialization and validation is 100% loss-less');

  // Test 3: Invalid JSON rejection
  const invalidJson = '{"schemaVersion": "3.3.0", rawMarkdown: invalid}';
  const invalidResult = validateEnvelope(invalidJson);
  if (invalidResult.valid) {
    throw new Error('Test 3 Failed: Invalid JSON was accepted as valid');
  }
  console.log('  [PASS] Test 3: Invalid JSON syntax is safely rejected with descriptive error');

  // Test 4: Missing stateData auto-recovery
  const partialEnvelope = {
    schemaVersion: '3.3.0',
    envelopeId: 'env-recover-test',
    updatedAt: new Date().toISOString(),
    projectName: 'Recovered Project',
    rawMarkdown: rawMarkdown,
    history: []
  };
  const recoverResult = validateEnvelope(JSON.stringify(partialEnvelope));
  if (!recoverResult.valid || !recoverResult.envelope) {
    throw new Error(`Test 4 Failed: Could not recover envelope from rawMarkdown: ${recoverResult.error}`);
  }
  if (!recoverResult.envelope.stateData || recoverResult.envelope.stateData.tasks.length !== 4) {
    throw new Error('Test 4 Failed: Recovered stateData does not contain the 4 tasks');
  }
  console.log('  [PASS] Test 4: Missing stateData is successfully auto-reconstructed from rawMarkdown');

  // Test 5: Multi-Project Workspace Bundle
  const bundle = createWorkspaceBundle([envelope, recoverResult.envelope]);
  const bundleJson = JSON.stringify(bundle);
  const bundleVal = validateWorkspaceBundle(bundleJson);
  if (!bundleVal.valid || !bundleVal.bundle) {
    throw new Error(`Test 5 Failed: Workspace bundle validation failed: ${bundleVal.error}`);
  }
  if (bundleVal.bundle.projects.length !== 2) {
    throw new Error(`Test 5 Failed: Expected 2 projects in bundle, got ${bundleVal.bundle.projects.length}`);
  }
  console.log('  [PASS] Test 5: Multi-project workspace bundle packaging and unpacking succeeds');

  console.log('\n>>> ALL WORKSPACE EXPORT/IMPORT INTEGRITY TESTS PASSED! <<<');
}

runTests();
