#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
repo=rhamede-crypto/trabalho-banco-de-dados
for file in docs/issues/*.md; do
  title=$(head -n 1 "$file")
  title=${title#\# }
  existing=$(gh issue list --repo "$repo" --state all --search "$title in:title" --json title --jq '.[].title')
  if printf '%s\n' "$existing" | grep -Fxq "$title"; then
    printf 'Já existe: %s\n' "$title"
  else
    gh issue create --repo "$repo" --title "$title" --body-file "$file"
  fi
done
