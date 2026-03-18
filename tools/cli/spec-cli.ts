#!/usr/bin/env tsx
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import readline from 'readline';

const program = new Command();

type Step = {
  label: string;
  prompt: string;
  model: string;
};

const steps: Record<string, Step> = {
  analyze: {
    label: 'Analyze spec',
    prompt: 'prompts/analyze-spec.md',
    model: 'claude-haiku-4-5-20251001',
  },
  plan: {
    label: 'Plan spec',
    prompt: 'prompts/plan-spec.md',
    model: 'claude-opus-4-6',
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

async function runStep(
  stepKey: string,
  specPath: string,
  modelOverride?: string,
  stepIndex?: number,
  totalSteps?: number
): Promise<void> {
  const step = steps[stepKey];
  const model = modelOverride || step.model;

  // Show step progress
  const progress = stepIndex !== undefined && totalSteps !== undefined
    ? ` (${stepIndex}/${totalSteps})`
    : '';
  console.log(`\n⏩ STEP: ${step.label}${progress} using ${model}`);

  const template = fs.readFileSync(step.prompt, 'utf-8');
  const prompt = template.replace('{{SPEC_PATH}}', specPath);

  // Escape single quotes in prompt for shell
  const escapedPrompt = prompt.replace(/'/g, "'\\''");

  // Use (echo prompt; sleep 2) | timeout to auto-close after response
  // This sends the prompt, waits 2s for response, then kills after 5m of inactivity
  // On macOS, timeout doesn't exist - try gtimeout first, fall back to no timeout
  const timeoutCmd = os.platform() === 'darwin' ? 'gtimeout' : 'timeout';
  let command = `(echo '${escapedPrompt}'; sleep 2) | ${timeoutCmd} 300 claude --model ${model} || true`;

  // If on macOS and gtimeout not available, run without timeout
  if (os.platform() === 'darwin') {
    try {
      execSync('which gtimeout', { stdio: 'ignore' });
    } catch {
      command = `(echo '${escapedPrompt}'; sleep 2) | claude --model ${model}`;
    }
  }

  try {
    execSync(command, {
      stdio: 'inherit',
    });
  } catch (err: any) {
    // Ignore timeout errors - they're expected behavior
    if (err.killed || err.signal === 'SIGTERM') {
      // Process was killed by timeout - this is OK
    } else {
      throw err;
    }
  }

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
      await runStep(step, spec, options.model);
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
        await runStep(stepKey, spec, options.model, i + 1, flow.length);
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

          const answer = await prompt(rl, '\n➡️  Continue? [y]es / [s]kip / [a]bort: ');
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
        const answer = await prompt(
          rl,
          '💡 Options? [r]etry / [s]kip this step / [a]bort workflow: '
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
