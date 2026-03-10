#!/usr/bin/env tsx
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

const program = new Command();

function runPrompt(promptFile: string, specPath: string) {
  const promptTemplate = fs.readFileSync(promptFile, 'utf-8');
  const prompt = promptTemplate.replace('{{SPEC_PATH}}', specPath);

  execSync(`claude`, {
    input: prompt,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
}

program
  .command('analyze <spec>')
  .description('Analyze a spec')
  .action((spec) => runPrompt('prompts/analyze-spec.md', spec));

program
  .command('test <spec>')
  .description('Generate tests from spec')
  .action((spec) => runPrompt('prompts/generate-tests.md', spec));

program
  .command('implement <spec>')
  .description('Implement feature from spec')
  .action((spec) => runPrompt('prompts/implement-feature.md', spec));

program
  .command('verify <spec>')
  .description('Verify implementation against spec')
  .action((spec) => runPrompt('prompts/verify-spec.md', spec));

program
  .command('run <spec>')
  .description('Run full workflow: analyze, generate tests, implement, verify')
  .action((spec) => {
    const steps: [string, string][] = [
      ['Analyze spec', 'prompts/analyze-spec.md'],
      ['Generate tests', 'prompts/generate-tests.md'],
      ['Implement feature', 'prompts/implement-feature.md'],
      ['Verify implementation', 'prompts/verify-spec.md'],
    ];

    for (const [label, promptFile] of steps) {
      console.log(`\n⏩ STEP: ${label}`);

      try {
        // Leer el template de prompt
        const promptTemplate = fs.readFileSync(promptFile, 'utf-8');
        const prompt = promptTemplate.replace('{{SPEC_PATH}}', spec);

        execSync('claude', {
          input: prompt,
          stdio: ['pipe', 'inherit', 'inherit'],
        });

        console.log(`✅ ${label} complete!`);
      } catch (err) {
        console.error(`⚠️ Step failed: ${label}`);
        console.error(err);
      }
    }

    console.log('\n🎯 Full workflow finished!');
  });

program.parse();
