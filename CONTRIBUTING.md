# Desenvolvimento

## Preparar o ambiente

Clone o repositório, execute os passos do README e configure o Git Flow local:

```sh
git fetch origin
bash scripts/setup-git-flow.sh
git switch develop
```

A configuração versionada está em `.gitflow`. O script aplica os nomes e prefixos em `.git/config`, sem trocar a branch ou alterar arquivos de trabalho. Cada clone precisa executar essa configuração.

## Branches

| Tipo | Origem | Integração |
| --- | --- | --- |
| `main` | Versões estáveis | Base de implantação |
| `develop` | Integração | Base de desenvolvimento |
| `feature/*`, `bugfix/*` | `develop` | Pull request para `develop` |
| `release/*` | `develop` | Pull request para `main`; integrar ajustes de volta em `develop` |
| `hotfix/*` | `main` | Pull request para `main`; integrar correção em `develop` |

As branches de trabalho são temporárias e podem ser removidas após sua integração. Preserve os commits existentes; evite reescrever histórico compartilhado. Use merge commits quando for necessário preservar explicitamente a integração das branches.

## Alterações

Crie uma branch para uma mudança delimitada, faça commits descritivos e abra um pull request com o comportamento esperado e as verificações executadas. Não inclua `.env`, senhas ou chaves de acesso. Mudanças de dados ou schema precisam explicar como preservar os registros existentes.

Execute `npm test` e os cenários de navegador relevantes. Consultas espaciais também precisam de validação com PostgreSQL/PostGIS real. Os testes com API simulada não validam o SQL.

O script de configuração não instala a extensão `git-flow`. Git padrão é suficiente para seguir o fluxo. Se usar a extensão, preserve a revisão por pull request ao finalizar branches.
