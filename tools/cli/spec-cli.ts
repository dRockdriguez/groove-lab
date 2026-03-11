#!/usr/bin/env tsx
import { Command } from 'commander';
import fs from 'fs';
import { execSync } from 'child_process';

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
    prompt: 'prompts/plan-feature.md',
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
  'no-test': ['analyze', 'implement', 'verify'],
};

function runStep(stepKey: string, specPath: string) {
  const step = steps[stepKey];

  console.log(`\n⏩ STEP: ${step.label} using ${step.model}`);

  const template = fs.readFileSync(step.prompt, 'utf-8');
  const prompt = template.replace('{{SPEC_PATH}}', specPath);

  execSync(`claude --model ${step.model}`, {
    input: prompt,
    stdio: ['pipe', 'inherit', 'inherit'],
  });

  console.log(`✅ ${step.label} complete`);
}

program
  .command('step <step> <spec>')
  .description('Run spec workflow')
  .action((step, spec) => {
    try {
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

    console.log(`\nStarting with flow: ${flow}`);

    for (const step of flow) {
      try {
        runStep(step, spec);
      } catch (err) {
        console.error(`⚠️ Step failed: ${step}`);
        console.error(err);
        process.exit(1);
      }
    }

    console.log('\n🎯 Workflow finished!');
  });

program.parse();
