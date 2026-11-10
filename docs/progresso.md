# Estado do desenvolvimento após integração dos PRs #6–#9

O projeto tem uma interface integrada de exploração, cadastro, edição, exclusão e geocodificação. A integração dos PRs #6–#9 foi validada com testes HTTP e de navegador. O aplicativo ainda precisa das funcionalidades restantes e da publicação para cumprir todo o enunciado.

| Frente | Estado | Evidência / próxima tarefa |
| --- | --- | --- |
| Modelagem PostGIS e índices espaciais | Implementada | geography(Point,4326), GiST e setup repetível |
| API CRUD e filtros espaciais | Implementada | CRUD, ST_DWithin e área visível, com integração real de banco testada |
| Mapa, geolocalização e carregamento por área | Implementada | Leaflet, lista/marcadores, moveend, cancelamento de consultas, estados de erro |
| Cadastro integrado e base de validação | Implementada | Formulário + seleção no mapa + POST; testes HTTP, navegador e banco |
| Gerenciamento pela interface | Implementado | Edição e exclusão na lista/formulário e nos popups dos marcadores |
| Busca por endereço / geocodificação | Implementada | Nominatim por envio explícito, cancelamento e intervalo mínimo entre buscas |
| Busca por proximidade na interface | Implementada nesta branch | Raio em km, distâncias, círculo no mapa e retorno ao viewport; depende de revisão e integração |
| Banco na nuvem e publicação completa | Pendente | Configuração segura, HTTPS, testes no domínio final e entrega, issue #4 |

## Validação desta etapa

- 14 testes HTTP e de utilitários de mapa/geocodificação aprovados na integração.
- 26 cenários de navegador aprovados entre a suíte combinada e a repetição dos cenários afetados pela correção de popups, em desktop e celular, com API e geocodificação controladas.
- Integração com PostgreSQL 16/PostGIS 3.5 real: cadastro espacial, SRID, repetibilidade do schema, consulta em metros, área visível, antimeridiano, atualização e exclusão.
- Cadastro pela interface contra o banco real e confirmação após recarregar a página.

Os testes de PostGIS usaram banco descartável local. Nenhum banco de nuvem foi configurado e a aplicação ainda não foi publicada. A API atual não possui autenticação de usuários; a política de acesso e proteção de abuso deve ser definida antes da publicação.

## Próximos integrantes

As funcionalidades das issues #1 e #2 estão integradas em develop. A busca por proximidade da issue #3 está implementada na branch feature/3-busca-proximidade, pendente de integração. A publicação continua na issue #4, com roteiro em docs/publicacao.md. As issues incluem critérios de conclusão. Cada tarefa deve usar sua própria branch, commits e PR, conforme CONTRIBUTING.md.

## Validação da branch de proximidade

- 16 testes de API e utilitários passaram.
- 34 cenários de navegador passaram (17 em desktop e 17 em celular), com geolocalização e respostas controladas.
- Inclui consulta de 2 km, troca de modo, distâncias, resposta vazia, limite e proteção contra respostas atrasadas.
- render.yaml e docs/publicacao.md preparados; criação dos serviços e validação no provedor continuam pendentes.
