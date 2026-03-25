#!/usr/bin/env tsx
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import readline from 'readline';

const program = new Command();

type Step = {
  label: string;
  prompt: string;
  model: string;
};

type WorkflowStepRecord = {
  stepKey: string;
  label: string;
  model: string;
  startedAt: string;
  completedAt: string;
  status: 'completed' | 'failed';
  outputSummary: string;
  handoff?: StepHandoff;
};

type WorkflowContext = {
  specPath: string;
  branchName: string;
  flow?: string;
  startedAt: string;
  updatedAt: string;
  steps: WorkflowStepRecord[];
};

type HandoffCriterion = {
  id: string;
  status: 'pending' | 'completed' | 'blocked';
  notes: string;
};

type StepHandoff = {
  version: 1;
  stepKey: string;
  status: 'completed' | 'failed' | 'partial';
  summary: string;
  acceptanceCriteria: HandoffCriterion[];
  filesChanged: string[];
  testsAdded: string[];
  verification: string[];
  openIssues: string[];
  nextStepGuidance: string[];
};

const HANDOFF_START = '--- HANDOFF JSON START ---';
const HANDOFF_END = '--- HANDOFF JSON END ---';
const CLAUDE_PERMISSION_MODE = 'acceptEdits';
const STEP_TIMEOUT_MS = 300_000;

const steps: Record<string, Step> = {
  analyze: {
    label: 'Analyze spec',
    prompt: 'prompts/analyze-spec.md',
    model: 'claude-haiku-4-5-20251001',
  },
  plan: {
    label: 'Plan spec',
    prompt: 'prompts/plan-spec.md',
    model: 'claude-sonnet-4-6',
  },
  implement: {
    label: 'Implement feature from tests',
    prompt: 'prompts/implement-feature.md',
    model: 'claude-sonnet-4-6',
  },
  'implement-first': {
    label: 'Implement feature from spec',
    prompt: 'prompts/implement-feature-first.md',
    model: 'claude-sonnet-4-6',
  },
  test: {
    label: 'Generate tests',
    prompt: 'prompts/generate-tests.md',
    model: 'claude-haiku-4-5-20251001',
  },
  'implement-tests': {
    label: 'Implement tests',
    prompt: 'prompts/implement-tests.md',
    model: 'claude-haiku-4-5-20251001',
  },
  verify: {
    label: 'Verify implementation',
    prompt: 'prompts/verify-spec.md',
    model: 'claude-haiku-4-5-20251001',
  },
};

const flows: Record<string, string[]> = {
  default: ['implement-first', 'test', 'implement-tests', 'verify'],
  plan: ['plan', 'implement-first', 'test', 'implement-tests', 'verify'],
  tdd: ['analyze', 'test', 'implement-tests', 'implement', 'verify'],
  'no-tdd': ['analyze', 'implement-first', 'verify'],
};

// Helper: create readline interface for interactive prompts
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Helper: ask user a yes/no/other question
async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function promptForChoice(
  rl: readline.Interface,
  question: string,
  validAnswers: string[]
): Promise<string> {
  const accepted = new Set(validAnswers.map((answer) => answer.toLowerCase()));

  while (true) {
    const answer = await prompt(rl, question);
    if (accepted.has(answer)) {
      return answer;
    }

    console.log(`Please enter one of: ${validAnswers.join(', ')}`);
  }
}

// Validate spec file exists and is readable
function validateSpecFile(specPath: string): void {
  if (!specPath.endsWith('.md')) {
    console.error(`❌ Spec path must end with .md: ${specPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(specPath)) {
    console.error(`❌ Spec file not found: ${specPath}`);
    process.exit(1);
  }

  try {
    fs.accessSync(specPath, fs.constants.R_OK);
  } catch {
    console.error(`❌ Cannot read spec file: ${specPath}`);
    process.exit(1);
  }
}

// Format elapsed time
function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function slugifySpecPath(specPath: string): string {
  return specPath.replace(/[\\/]/g, '__').replace(/[^a-zA-Z0-9._-]/g, '-');
}

function getWorkflowContextPath(specPath: string): string {
  return path.join('.spec-workflow', `${slugifySpecPath(specPath)}.json`);
}

function getWorkflowContext(specPath: string, flow?: string): WorkflowContext {
  const contextPath = getWorkflowContextPath(specPath);
  const branchName = getSpecBranchName(specPath);

  if (fs.existsSync(contextPath)) {
    const raw = fs.readFileSync(contextPath, 'utf-8');
    const parsed = JSON.parse(raw) as WorkflowContext;
    if (!parsed.flow && flow) {
      parsed.flow = flow;
    }
    if (!parsed.branchName) {
      parsed.branchName = branchName;
    }
    return parsed;
  }

  const now = new Date().toISOString();
  return {
    specPath,
    branchName,
    flow,
    startedAt: now,
    updatedAt: now,
    steps: [],
  };
}

function saveWorkflowContext(context: WorkflowContext): void {
  const contextPath = getWorkflowContextPath(context.specPath);
  fs.mkdirSync(path.dirname(contextPath), { recursive: true });
  context.updatedAt = new Date().toISOString();
  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2) + '\n', 'utf-8');
}

function summarizeOutput(output: string): string {
  const normalized = output
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    return 'No output captured from the step.';
  }

  return normalized.slice(-12).join('\n').slice(0, 4000);
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeAcceptanceCriteria(value: unknown): HandoffCriterion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
    const notes = typeof candidate.notes === 'string' ? candidate.notes.trim() : '';
    const status = candidate.status;

    if (!id || !notes) {
      return [];
    }

    if (status !== 'pending' && status !== 'completed' && status !== 'blocked') {
      return [];
    }

    return [{ id, status, notes }];
  });
}

function normalizeStepHandoff(stepKey: string, value: unknown): StepHandoff | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const version = candidate.version;
  const status = candidate.status;
  const summary = typeof candidate.summary === 'string' ? candidate.summary.trim() : '';

  if (version !== 1 || !summary) {
    return null;
  }

  if (status !== 'completed' && status !== 'failed' && status !== 'partial') {
    return null;
  }

  return {
    version: 1,
    stepKey: typeof candidate.stepKey === 'string' && candidate.stepKey.trim() ? candidate.stepKey.trim() : stepKey,
    status,
    summary,
    acceptanceCriteria: sanitizeAcceptanceCriteria(candidate.acceptanceCriteria),
    filesChanged: sanitizeStringArray(candidate.filesChanged),
    testsAdded: sanitizeStringArray(candidate.testsAdded),
    verification: sanitizeStringArray(candidate.verification),
    openIssues: sanitizeStringArray(candidate.openIssues),
    nextStepGuidance: sanitizeStringArray(candidate.nextStepGuidance),
  };
}

function parseHandoffFromOutput(stepKey: string, output: string): StepHandoff | null {
  const startIndex = output.lastIndexOf(HANDOFF_START);
  const endIndex = output.lastIndexOf(HANDOFF_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  const jsonText = output
    .slice(startIndex + HANDOFF_START.length, endIndex)
    .trim();

  if (!jsonText) {
    return null;
  }

  try {
    return normalizeStepHandoff(stepKey, JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function buildFallbackHandoff(stepKey: string, status: 'completed' | 'failed', output: string): StepHandoff {
  return {
    version: 1,
    stepKey,
    status,
    summary: summarizeOutput(output),
    acceptanceCriteria: [],
    filesChanged: [],
    testsAdded: [],
    verification: [],
    openIssues: status === 'failed' ? ['Step failed before emitting structured handoff JSON.'] : [],
    nextStepGuidance: [],
  };
}

// Truncate handoff JSON to reduce token consumption: keep only essential fields, cap array sizes
function truncateHandoffForContext(handoff: StepHandoff): StepHandoff {
  const maxArrayItems = 3; // Keep first 3 items per array
  return {
    version: handoff.version,
    stepKey: handoff.stepKey,
    status: handoff.status,
    summary: handoff.summary.length > 200 ? handoff.summary.slice(0, 200) + '…' : handoff.summary,
    acceptanceCriteria: handoff.acceptanceCriteria.slice(0, maxArrayItems),
    filesChanged: handoff.filesChanged.slice(0, maxArrayItems),
    testsAdded: handoff.testsAdded.slice(0, maxArrayItems),
    verification: handoff.verification.slice(0, maxArrayItems),
    openIssues: [],  // Skip to save tokens—covered by status
    nextStepGuidance: handoff.nextStepGuidance.slice(0, 2),
  };
}

function buildStepContextBlock(context: WorkflowContext): string {
  if (context.steps.length === 0) {
    return '';
  }

  const recentSteps = context.steps.slice(-3);
  const lines = recentSteps.flatMap((step) => {
    const handoff = step.handoff ?? buildFallbackHandoff(step.stepKey, step.status, step.outputSummary);
    const truncatedHandoff = truncateHandoffForContext(handoff);
    return [
      `- ${step.label} (${step.stepKey})`,
      `  model: ${step.model}`,
      `  status: ${step.status}`,
      `  completedAt: ${step.completedAt}`,
      `  handoff:`,
      ...JSON.stringify(truncatedHandoff, null, 2)
        .split('\n')
        .map((line) => `    ${line}`),
    ];
  });

  return [
    '',
    'WORKFLOW CONTEXT',
    'Use this as handoff context from previous steps. Re-check the repository before acting if anything seems stale.',
    `If present, always prefer the structured JSON handoff over any prose output.`,
    `Workflow state file: ${getWorkflowContextPath(context.specPath)}`,
    `Branch: ${context.branchName}`,
    `Flow: ${context.flow ?? 'single-step'}`,
    'Recent completed steps:',
    ...lines,
  ].join('\n');
}

function recordStepResult(
  context: WorkflowContext,
  stepKey: string,
  model: string,
  startedAt: string,
  status: 'completed' | 'failed',
  output: string
): void {
  const handoff = parseHandoffFromOutput(stepKey, output) ?? buildFallbackHandoff(stepKey, status, output);
  context.steps.push({
    stepKey,
    label: steps[stepKey]?.label ?? stepKey,
    model,
    startedAt,
    completedAt: new Date().toISOString(),
    status,
    outputSummary: summarizeOutput(output),
    handoff,
  });
  saveWorkflowContext(context);
}

function extractTextFromAssistantMessage(message: Record<string, unknown>): string {
  const content = Array.isArray(message.content) ? message.content : [];
  const fragments: string[] = [];

  for (const item of content) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    if (candidate.type === 'text' && typeof candidate.text === 'string') {
      fragments.push(candidate.text);
    }
  }

  return fragments.join('');
}

async function runStep(
  stepKey: string,
  specPath: string,
  flow?: string,
  modelOverride?: string,
  stepIndex?: number,
  totalSteps?: number
): Promise<void> {
  const step = steps[stepKey];
  const model = modelOverride || step.model;
  const context = getWorkflowContext(specPath, flow);
  const startedAt = new Date().toISOString();

  // Show step progress
  const progress = stepIndex !== undefined && totalSteps !== undefined
    ? ` (${stepIndex}/${totalSteps})`
    : '';
  console.log(`\n⏩ STEP: ${step.label}${progress} using ${model}`);

  const template = fs.readFileSync(step.prompt, 'utf-8');
  const prompt = template.replace('{{SPEC_PATH}}', specPath) + buildStepContextBlock(context);
  const inactivityMs = 15000;

  const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
    const child = spawn(
      'claude',
      [
        '-p',
        prompt,
        '--model',
        model,
        '--verbose',
        '--permission-mode',
        CLAUDE_PERMISSION_MODE,
        '--output-format',
        'stream-json',
        '--include-partial-messages',
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: Object.fromEntries(
          Object.entries(process.env).filter(([key]) => key !== 'CLAUDECODE')
        ),
      }
    );

    let assistantOutput = '';
    let stderr = '';
    let stdoutBuffer = '';
    let heartbeatTimer: NodeJS.Timeout | undefined;
    let timeoutTimer: NodeJS.Timeout | undefined;
    let waitingMessageShown = false;
    let receivedPartialText = false;

    const clearTimers = () => {
      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
        heartbeatTimer = undefined;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = undefined;
      }
    };

    const scheduleHeartbeat = () => {
      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
      }
      heartbeatTimer = setTimeout(() => {
        waitingMessageShown = true;
        console.log(`\n⏳ Still waiting for output from ${step.label}...`);
        scheduleHeartbeat();
      }, inactivityMs);
    };

    const handleVisibleOutput = (text: string) => {
      if (!text) {
        return;
      }

      if (waitingMessageShown) {
        console.log(`⏩ Output resumed for ${step.label}`);
        waitingMessageShown = false;
      }

      scheduleHeartbeat();
      assistantOutput += text;
      process.stdout.write(text);
    };

    const processJsonLine = (line: string) => {
      try {
        const event = JSON.parse(line) as Record<string, unknown>;

        if (event.type === 'stream_event' && event.event && typeof event.event === 'object') {
          const streamEvent = event.event as Record<string, unknown>;
          if (
            streamEvent.type === 'content_block_delta' &&
            streamEvent.delta &&
            typeof streamEvent.delta === 'object'
          ) {
            const delta = streamEvent.delta as Record<string, unknown>;
            if (delta.type === 'text_delta' && typeof delta.text === 'string') {
              receivedPartialText = true;
              handleVisibleOutput(delta.text);
            }
          }
          return;
        }

        if (
          event.type === 'assistant' &&
          event.message &&
          typeof event.message === 'object' &&
          !receivedPartialText
        ) {
          handleVisibleOutput(extractTextFromAssistantMessage(event.message as Record<string, unknown>));
        }
      } catch {
        // Ignore non-JSON lines from stream-json mode.
      }
    };

    scheduleHeartbeat();
    timeoutTimer = setTimeout(() => {
      stderr += `\nStep timed out after ${STEP_TIMEOUT_MS / 1000}s.`;
      child.kill('SIGTERM');
    }, STEP_TIMEOUT_MS);

    child.stdout?.on('data', (chunk: Buffer | string) => {
      const text = chunk.toString();
      stdoutBuffer += text;

      while (stdoutBuffer.includes('\n')) {
        const newlineIndex = stdoutBuffer.indexOf('\n');
        const line = stdoutBuffer.slice(0, newlineIndex).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);

        if (line) {
          processJsonLine(line);
        }
      }
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      const text = chunk.toString();
      stderr += text;

      if (waitingMessageShown) {
        console.log(`⏩ Output resumed for ${step.label}`);
        waitingMessageShown = false;
      }

      scheduleHeartbeat();
      process.stderr.write(text);
    });

    child.on('error', (error) => {
      clearTimers();
      reject(error);
    });

    child.on('close', (exitCode) => {
      clearTimers();

      const remaining = stdoutBuffer.trim();
      if (remaining) {
        processJsonLine(remaining);
      }

      resolve({
        stdout: assistantOutput,
        stderr,
        exitCode: exitCode ?? 0,
      });
    });
  });

  if (result.exitCode !== 0) {
    recordStepResult(
      context,
      stepKey,
      model,
      startedAt,
      'failed',
      `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    );
    throw new Error(`Step command exited with code ${result.exitCode}`);
  }

  recordStepResult(context, stepKey, model, startedAt, 'completed', `${result.stdout ?? ''}\n${result.stderr ?? ''}`);

  console.log(`✅ ${step.label} complete`);
}

function getSpecBranchName(specPath: string) {
  return 'spec/' + path.basename(specPath, '.md');
}

function isCommandAvailable(command: string) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function createSpecBranch(specPath: string) {
  const branchName = getSpecBranchName(specPath);

  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  if (currentBranch === branchName) {
    console.log(`Already on branch ${branchName}`);
    return;
  }

  const branchExists = (() => {
    try {
      execSync(`git show-ref --verify refs/heads/${branchName}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  })();

  if (branchExists) {
    console.log(`Switching to existing branch ${branchName}`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  } else {
    console.log(`Creating and switching to branch ${branchName}`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  }
}

function commitAfterStep(step: string, specPath: string) {
  const branchName = getSpecBranchName(specPath);
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (!status) {
    console.log(`No changes after ${step} step — skipping commit`);
    return;
  }

  try {
    // Stage all changes (.gitignore will exclude node_modules, .env, etc)
    execSync('git add -A', { stdio: 'inherit' });

    const commitMsg = step === 'all'
      ? `spec(${branchName}): implement + test + verify workflow complete`
      : `spec(${branchName}): after ${step} step`;

    execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
  } catch (err: any) {
    // If commit fails, it's likely no changes to commit (all staged)
    console.log(`⚠️ Could not commit after ${step} — ${err.message}`);
  }
}

function pushBranch(branchName: string) {
  console.log(`\n📤 Pushing ${branchName} to origin`);
  execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
}

function ensurePullRequest(branchName: string) {
  if (!isCommandAvailable('gh')) {
    console.log('GitHub CLI not available — skipping PR creation');
    return;
  }

  console.log(`📬 Checking for existing PR for ${branchName}`);
  try {
    const prUrl = execSync(`gh pr view ${branchName} --json url --jq .url`, {
      encoding: 'utf8',
    }).trim();
    if (prUrl) {
      console.log(`✅ PR already exists: ${prUrl}`);
    } else {
      console.log('No PR found — creating a new one');
      execSync(`gh pr create --fill --head ${branchName}`, { stdio: 'inherit' });
    }
  } catch (err: any) {
    // If gh pr view fails, try to create a new PR
    console.log('No PR found — creating a new one');
    try {
      execSync(`gh pr create --fill --head ${branchName}`, { stdio: 'inherit' });
    } catch (createErr: any) {
      // If creation fails because PR already exists, that's OK
      if (createErr.message && createErr.message.includes('already exists')) {
        console.log('✅ PR already exists');
      } else {
        throw createErr;
      }
    }
  }
}

function finalizeSpecDelivery(specPath: string) {
  const branchName = getSpecBranchName(specPath);
  pushBranch(branchName);
  ensurePullRequest(branchName);
}

// Command: flows — list all available workflows
program
  .command('flows')
  .description('List all available workflows')
  .action(() => {
    console.log('\n📋 Available Spec Workflows\n');
    console.log('Flow Name    | Steps\n' + '─'.repeat(60));
    for (const [name, flowSteps] of Object.entries(flows)) {
      const stepLabels = flowSteps
        .map((s) => steps[s].label)
        .join(' → ');
      console.log(`${name.padEnd(12)} | ${stepLabels}`);
    }
    console.log();
  });

// Command: step — run a single step
program
  .command('step <step> <spec>')
  .option('--model <model>', 'override Claude model for this step')
  .description('Run a single spec workflow step')
  .action(async (step, spec, options) => {
    try {
      validateSpecFile(spec);
      createSpecBranch(spec);
      const startTime = Date.now();
      await runStep(step, spec, undefined, options.model);
      const elapsed = formatElapsed(Date.now() - startTime);
      console.log(`\n🎯 Step complete (${elapsed})`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

// Command: run — execute a full workflow
program
  .command('run <spec>')
  .option('--flow <flow>', 'workflow to run', 'default')
  .option('--interactive', 'pause after each step to review changes')
  .option('--commit-steps', 'commit after each step (vs. single final commit)')
  .option('--model <model>', 'override Claude model for all steps')
  .description('Run a complete spec workflow')
  .action(async (spec, options) => {
    const flow = flows[options.flow];
    if (!flow) {
      console.error(`❌ Unknown flow: ${options.flow}`);
      process.exit(1);
    }

    try {
      validateSpecFile(spec);
      createSpecBranch(spec);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`\n🚀 Starting workflow: ${options.flow} (${flow.length} steps)`);
    console.log(`📝 Spec: ${spec}\n`);

    const workflowStart = Date.now();
    let completedSteps = 0;

    for (let i = 0; i < flow.length; i++) {
      const stepKey = flow[i];
      const stepStart = Date.now();

      try {
        await runStep(stepKey, spec, options.flow, options.model, i + 1, flow.length);
        const stepElapsed = formatElapsed(Date.now() - stepStart);
        console.log(`⏱️  Step took ${stepElapsed}`);
        completedSteps++;

        // Commit after each step if requested
        if (options.commitSteps) {
          try {
            commitAfterStep(stepKey, spec);
          } catch (err) {
            console.warn(`⚠️ Could not commit after ${stepKey}`);
          }
        }

        // Interactive mode: pause and show diff
        if (options.interactive) {
          const rl = createReadlineInterface();
          const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();

          if (status) {
            console.log('\n📊 Changes after this step:');
            console.log(execSync('git diff --stat', { encoding: 'utf8' }));
          }

          const answer = await promptForChoice(
            rl,
            '\n➡️  Continue? [y]es / [s]kip / [a]bort: ',
            ['y', 'yes', 's', 'skip', 'a', 'abort']
          );
          rl.close();

          if (answer === 'a' || answer === 'abort') {
            console.log('❌ Workflow aborted by user');
            process.exit(1);
          } else if (answer === 's' || answer === 'skip') {
            console.log(`⏭️  Skipping next steps...\n`);
            break;
          }
        }
      } catch (err) {
        console.error(`\n⚠️ Step failed: ${stepKey}`);
        console.error(`${err}\n`);

        // Recovery: offer retry/skip/abort
        const rl = createReadlineInterface();
        const answer = await promptForChoice(
          rl,
          '💡 Options? [r]etry / [s]kip this step / [a]bort workflow: ',
          ['r', 'retry', 's', 'skip', 'a', 'abort']
        );
        rl.close();

        if (answer === 'r' || answer === 'retry') {
          console.log('🔄 Retrying step...\n');
          i--; // Retry same step
          continue;
        } else if (answer === 's' || answer === 'skip') {
          console.log(`⏭️  Skipping ${stepKey}...\n`);
          continue;
        } else {
          console.log('❌ Workflow aborted');
          process.exit(1);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    const totalElapsed = formatElapsed(Date.now() - workflowStart);
    console.log(`🎯 Workflow complete! (${completedSteps}/${flow.length} steps, total: ${totalElapsed})`);
    console.log('='.repeat(60));

    // Commit all remaining changes at the end (if not --commit-steps)
    if (!options.commitSteps) {
      try {
        commitAfterStep('all', spec);
      } catch (err) {
        console.error('⚠️ Warning: Could not commit after workflow completion');
        console.error(err);
      }
    }

    // Push and create PR
    try {
      finalizeSpecDelivery(spec);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

program.parse();
