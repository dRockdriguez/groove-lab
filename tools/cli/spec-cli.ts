#!/usr/bin/env tsx
import { Command } from "commander"
import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import os from "os"

const program = new Command()

function runPrompt(promptFile: string, specPath: string) {
  const promptTemplate = fs.readFileSync(path.resolve(promptFile), "utf-8")
  const prompt = promptTemplate.replace("{{SPEC_PATH}}", specPath)

  const tempFile = path.join(os.tmpdir(), `claude_prompt_${Date.now()}.md`)
  fs.writeFileSync(tempFile, prompt)

  try {
    execSync(`claude -p ${tempFile}`, { stdio: "inherit" })
  } catch (error) {
    console.error("Error executing Claude Code:", error)
  } finally {
    fs.unlinkSync(tempFile)
  }
}

program
  .command("analyze <spec>")
  .description("Analyze a spec")
  .action((spec) => runPrompt("prompts/analyze-spec.md", spec))

program
  .command("test <spec>")
  .description("Generate tests from spec")
  .action((spec) => runPrompt("prompts/generate-tests.md", spec))

program
  .command("implement <spec>")
  .description("Implement feature from spec")
  .action((spec) => runPrompt("prompts/implement-feature.md", spec))

program
  .command("verify <spec>")
  .description("Verify implementation against spec")
  .action((spec) => runPrompt("prompts/verify-spec.md", spec))

program
  .command("run <spec>")
  .description("Run full workflow")
  .action((spec) => {
    runPrompt("prompts/analyze-spec.md", spec)
    runPrompt("prompts/generate-tests.md", spec)
    runPrompt("prompts/implement-feature.md", spec)
    runPrompt("prompts/verify-spec.md", spec)
  })

program.parse()