#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  result=$(docker sandbox run claude --permission-mode bypassPermissions -p "@progress.txt \
  1. Use the gh cli and read issue #1 in the remote repo. \
  2. Find the next open implementation sub-issue. \
  3. Implement the task in the sub-issue. \
  4. Run your tests and type checks. \
  5. Append your progress to progress.txt. \
  6. Commit your changes. \
  7. Close the implementation sub-issue. \
  ONLY WORK ON A SINGLE TASK. \
  If the PRD is complete, output <promise>COMPLETE</promise>.")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete after $i iterations."
    exit 0
  fi
done