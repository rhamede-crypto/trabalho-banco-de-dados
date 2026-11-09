# Marco de desenvolvimento: aproximadamente 50%

O projeto tem uma base integrada de exploração e cadastro. A divisão abaixo organiza oito frentes para a equipe: quatro foram implementadas nesta etapa, quatro permanecem abertas. O aplicativo ainda precisa das funcionalidades restantes e da publicação para cumprir todo o enunciado.

| Frente | Estado | Evidência / próxima tarefa |
| --- | --- | --- |
| Modelagem PostGIS e índices espaciais | Implementada | geography(Point,4326), GiST e setup repetível |
| API CRUD e filtros espaciais | Implementada | CRUD, ST_DWithin e área visível, com integração real de banco testada |
| Mapa, geolocalização e carregamento por área | Implementada | Leaflet, lista/marcadores, moveend, cancelamento de consultas, estados de erro |
| Cadastro integrado e base de validação | Implementada | Formulário + seleção no mapa + POST; testes HTTP, navegador e banco |
| Completar gerenciamento pela interface | Pendente | Edição e exclusão, issue #2 |
| Busca por endereço / geocodificação | Pendente | Seleção de resultado e política do provedor, issue #2 |
| Busca por proximidade na interface | Pendente | Raio, distância e alternância de modo, issue #3 |
| Banco na nuvem e publicação completa | Pendente | Configuração segura, HTTPS, testes no domínio final e entrega, issue #4 |

## Validação desta etapa

- 7 testes HTTP/normalização de área visível.
- 16 testes de navegador: os mesmos 8 cenários em desktop e celular, com API controlada.
- Integração com PostgreSQL 16/PostGIS 3.5 real: cadastro espacial, SRID, repetibilidade do schema, consulta em metros, área visível, antimeridiano, atualização e exclusão.
- Cadastro pela interface contra o banco real e confirmação após recarregar a página.

Os testes de PostGIS usaram banco descartável local. Nenhum banco de nuvem foi configurado e a aplicação ainda não foi publicada. A API atual não possui autenticação de usuários; a política de acesso e proteção de abuso deve ser definida antes da publicação.

## Próximos integrantes

A issue #1 é atendida pela implementação do mapa nesta branch. Após revisar e integrar o PR em develop, continuar pelas issues #2, #3 e #4. As issues incluem critérios de conclusão. Cada tarefa deve usar sua própria branch, commits e PR, conforme CONTRIBUTING.md.
