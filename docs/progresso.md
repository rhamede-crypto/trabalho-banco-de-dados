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
| Busca por proximidade na interface | Pendente | Raio, distância e alternância de modo, issue #3 |
| Banco na nuvem e publicação completa | Pendente | Configuração segura, HTTPS, testes no domínio final e entrega, issue #4 |

## Validação desta etapa

- 14 testes HTTP e de utilitários de mapa/geocodificação aprovados na integração.
- 26 cenários de navegador aprovados entre a suíte combinada e a repetição dos cenários afetados pela correção de popups, em desktop e celular, com API e geocodificação controladas.
- Integração com PostgreSQL 16/PostGIS 3.5 real: cadastro espacial, SRID, repetibilidade do schema, consulta em metros, área visível, antimeridiano, atualização e exclusão.
- Cadastro pela interface contra o banco real e confirmação após recarregar a página.

Os testes de PostGIS usaram banco descartável local. Nenhum banco de nuvem foi configurado e a aplicação ainda não foi publicada. A API atual não possui autenticação de usuários; a política de acesso e proteção de abuso deve ser definida antes da publicação.

## Próximos integrantes

As funcionalidades das issues #1 e #2 estão integradas em develop. Continuar pelas issues #3 e #4. As issues incluem critérios de conclusão. Cada tarefa deve usar sua própria branch, commits e PR, conforme CONTRIBUTING.md.
