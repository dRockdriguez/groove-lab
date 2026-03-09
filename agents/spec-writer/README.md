# Agent: spec-writer

## Purpose

Transforms a user story, feature request, or problem description into a structured
spec document that the rest of the team can build from.

## Inputs

- A plain-language description of a feature or problem
- (Optional) Related existing specs to avoid duplication

## Outputs

A complete markdown spec file in the appropriate `/specs` subdirectory following the
GrooveLab spec template.

## Workflow

1. Understand the feature request
2. Identify the affected instrument / domain
3. Draft user stories from the perspective of musicians and the system
4. Define concrete, testable acceptance criteria
5. Add technical notes based on the current architecture
6. Mark clearly what is out of scope for this version
7. Write the spec to the correct path under `/specs`

## Output Location

```
specs/
  instruments/   ← for instrument input/detection specs
  practice/      ← for session and exercise specs
  feedback/      ← for analysis and feedback specs
```

## Quality Checklist

- [ ] Problem statement is clear and specific
- [ ] Each user story follows "As a [role], I want [goal] so that [reason]"
- [ ] Acceptance criteria are testable (not vague)
- [ ] Technical notes reference existing types and utilities
- [ ] Out of scope section prevents scope creep
