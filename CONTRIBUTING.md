# Contribuindo com Git Flow

## Preparar o clone

```sh
git clone https://github.com/rhamede-crypto/trabalho-banco-de-dados.git
cd trabalho-banco-de-dados
git fetch origin
bash scripts/setup-git-flow.sh
git switch develop
```

As branches permanentes são `main` (versões estáveis) e `develop` (integração e destino dos PRs de funcionalidades). A configuração está em `.gitflow`; cada integrante deve executar o script, pois `.git/config` é local e não acompanha clones. O script pode ser executado novamente e não troca sua branch nem altera arquivos de trabalho.

Não usar commits diretos nas branches permanentes no desenvolvimento diário. Criar uma branch por tarefa e abrir pull request. Usar merge commit no GitHub para manter a história das integrações (`Create a merge commit`). As orientações são convenções da equipe; não há bloqueio de push direto configurado.

| Tipo | Origem | Destino do PR | Exemplo |
| --- | --- | --- | --- |
| Funcionalidade | `develop` | `develop` | `feature/1-mapa-geolocalizacao` |
| Correção em desenvolvimento | `develop` | `develop` | `bugfix/validacao-cadastro` |
| Preparação de versão | `develop` | `main` e depois `develop` | `release/1.0.0` |
| Correção urgente publicada | `main` | `main` e depois `develop` | `hotfix/1.0.1` |

## Configuração no GitHub

A branch `develop` já está publicada. Um administrador deve defini-la como padrão nas configurações do repositório (Default branch). Em Pull Requests, manter `Allow merge commits` habilitado. A credencial usada na configuração inicial permitiu publicar branches, mas a API recusou alterações dessas configurações com HTTP 403; elas precisam ser conferidas pelo administrador.

Até mudar a branch padrão, selecionar `develop` manualmente como destino dos PRs de funcionalidades. O clone pode abrir em `main`; executar o script de configuração e depois `git switch develop` como mostrado acima.

## Fazer uma tarefa

Exemplo para a issue #1 (mapa):

```sh
git switch develop
git pull --ff-only origin develop
git switch -c feature/1-mapa-geolocalizacao
# Implementar a tarefa e verificar o resultado.
npm test
git add <arquivos-da-tarefa>
git commit -m "Adiciona mapa com geolocalizacao"
git push -u origin feature/1-mapa-geolocalizacao
```

Abrir um PR de `feature/1-mapa-geolocalizacao` para `develop`, vinculando `Closes #1`. Outro integrante revisa antes de integrar. Depois do merge, atualizar `develop` e remover a branch de tarefa quando não for mais necessária. Resolver conflitos na branch da tarefa, preservando mudanças dos colegas.

## Preparar uma versão

O responsável pela entrega cria `release/1.0.0` a partir de `develop`, faz ajustes finais, atualiza versão/lockfile quando necessário e valida a aplicação completa. Abrir PR para `main`; após o merge, marcar o commit de merge em `main` com a tag anotada `v1.0.0` e publicar a tag. Em seguida abrir PR de `main` para `develop`, integrando os ajustes da versão. Remover a branch de release apenas após as duas integrações.

## Corrigir uma versão publicada

Criar `hotfix/1.0.1` a partir de `main`, corrigir e validar. Abrir PR para `main`; depois do merge, criar a tag anotada `v1.0.1` e abrir PR de `main` para `develop`. Se houver release em andamento, incluir a correção nela também. Não deixar a correção apenas em `main`.

Tags seguem `vMAJOR.MINOR.PATCH`. Apenas criar uma tag de versão após validação da entrega; a configuração do fluxo não publica uma versão automaticamente.

## Extensão git-flow (opcional)

O fluxo acima usa Git padrão. Quem já tiver a extensão git-flow pode executar o script de configuração e usar `git flow feature start 1-mapa-geolocalizacao`. A extensão não é instalada pelo script. Evitar comandos `finish` quando eles pularem a revisão via PR; as integrações da equipe passam pelo GitHub.

## Verificações

Executar `npm ci` e `npm test` antes do PR. Os testes existentes usam banco simulado; mudanças em consultas espaciais também precisam ser verificadas com PostgreSQL/PostGIS real. A documentação do backend e seus limites estão no README.
