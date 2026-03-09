
#!/bin/bash

SPEC=$1

echo "Step 1: Analyze spec"
claude -p prompts/analyze-spec.md --var SPEC_PATH=$SPEC

echo "Step 2: Generate tests"
claude -p prompts/generate-tests.md --var SPEC_PATH=$SPEC

echo "Step 3: Implement feature"
claude -p prompts/implement-feature.md --var SPEC_PATH=$SPEC

echo "Step 4: Verify spec"
claude -p prompts/verify-spec.md --var SPEC_PATH=$SPEC