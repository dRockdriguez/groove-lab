#!/usr/bin/env tsx
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

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
    label: 'Implement feature',
    prompt: 'prompts/implement-feature.md',
    model: 'claude-sonnet-4-6',
  },
  test: {
    label: 'Generate tests',
    prompt: 'prompts/generate-tests.md',
    model: 'claude-haiku-4-5-20251001',
  },
  'implement-tests': {
    label: 'Impelement tests',
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
  default: ['implement', 'test', 'implement-tests', 'verify'],
  plan: ['plan', 'implement', 'test', 'implement-tests', 'verify'],
  tdd: ['analyze', 'test', 'implement-tests', 'implement', 'verify'],
  'no-tdd': ['analyze', 'implement', 'verify'],
};

function runStep(stepKey: string, specPath: string) {
  const step = steps[stepKey];

  console.log(`\n⏩ STEP: ${step.label} using ${step.model}`);

  const template = fs.readFileSync(step.prompt, 'utf-8');
  const prompt = template.replace('{{SPEC_PATH}}', specPath);

  // Escape single quotes in prompt for shell
  const escapedPrompt = prompt.replace(/'/g, "'\\''");

  // Use (echo prompt; sleep 2) | timeout to auto-close after response
  // This sends the prompt, waits 2s for response, then kills after 5m of inactivity
  // On macOS, timeout doesn't exist - try gtimeout first, fall back to no timeout
  const timeoutCmd = os.platform() === 'darwin' ? 'gtimeout' : 'timeout';
  let command = `(echo '${escapedPrompt}'; sleep 2) | ${timeoutCmd} 300 claude --model ${step.model} || true`;

  // If on macOS and gtimeout not available, run without timeout
  if (os.platform() === 'darwin') {
    try {
      execSync('which gtimeout', { stdio: 'ignore' });
    } catch {
      command = `(echo '${escapedPrompt}'; sleep 2) | claude --model ${step.model}`;
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

program
  .command('step <step> <spec>')
  .description('Run spec workflow')
  .action((step, spec) => {
    try {
      createSpecBranch(spec);
      runStep(step, spec);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('\n🎯 Workflow finished!');
  });

program
  .command('run <spec>')
  .option('--flow <flow>', 'workflow to run', 'default')
  .description('Run spec workflow')
  .action((spec, options) => {
    const flow = flows[options.flow];
    if (!flow) {
      console.error(`Unknown flow: ${options.flow}`);
      process.exit(1);
    }

    try {
      createSpecBranch(spec);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`\nStarting with flow: ${flow}`);

    for (const step of flow) {
      try {
        runStep(step, spec);
        // Don't commit after each step — linters may modify files after step runs
        // Instead, commit once at the end after all steps complete
      } catch (err) {
        console.error(`⚠️ Step failed: ${step}`);
        console.error(err);
        process.exit(1);
      }
    }

    console.log('\n🎯 Workflow finished!');

    // Commit all changes after all steps complete (linters have finished running)
    try {
      commitAfterStep('all', spec);
    } catch (err) {
      console.error('Warning: Could not commit after workflow completion');
      console.error(err);
      // Don't exit — continue to finalize
    }

    try {
      finalizeSpecDelivery(spec);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

program.parse();
