#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Configuração local: não altera branches nem o diretório de trabalho.
for branch in main develop; do
  if ! git show-ref --verify --quiet "refs/heads/$branch"; then
    if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
      git branch --track "$branch" "origin/$branch"
    else
      printf 'Branch %s ausente. Execute git fetch origin e tente novamente.\n' "$branch" >&2
      exit 1
    fi
  fi
done

# Git não carrega automaticamente configurações versionadas de um clone.
# Copiar apenas a seção gitflow evita incluir configurações Git arbitrárias.
for key in branch.master branch.develop prefix.feature prefix.bugfix prefix.release prefix.hotfix prefix.support prefix.versiontag; do
  value=$(git config --file .gitflow --get "gitflow.$key")
  git config --local "gitflow.$key" "$value"
done
printf 'Git Flow configurado: main, develop e prefixos de branches.\n'
