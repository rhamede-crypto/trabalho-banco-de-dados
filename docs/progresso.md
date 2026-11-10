# Estado da versão 0.1.0

O projeto tem uma interface integrada de exploração, cadastro, edição, exclusão e geocodificação. A integração dos PRs #6–#9 foi validada com testes HTTP e de navegador. A versão 0.1.0 está publicada. O registro dos testes na nuvem e das pendências aparece ao final.

| Frente | Estado | Evidência / próxima tarefa |
| --- | --- | --- |
| Modelagem PostGIS e índices espaciais | Implementada | geography(Point,4326), GiST e setup repetível |
| API CRUD e filtros espaciais | Implementada | CRUD, ST_DWithin e área visível, com integração real de banco testada |
| Mapa, geolocalização e carregamento por área | Implementada | Leaflet, lista/marcadores, moveend, cancelamento de consultas, estados de erro |
| Cadastro integrado e base de validação | Implementada | Formulário + seleção no mapa + POST; testes HTTP, navegador e banco |
| Gerenciamento pela interface | Implementado | Edição e exclusão na lista/formulário e nos popups dos marcadores |
| Busca por endereço / geocodificação | Implementada | Nominatim por envio explícito, cancelamento e intervalo mínimo entre buscas |
| Busca por proximidade na interface | Integrada | Raio em km, distâncias, círculo no mapa e retorno ao viewport; PR #10 |
| Banco na nuvem e hospedagem HTTPS | Publicada | Supabase/PostGIS e Render Free, com CRUD e persistência validados |

## Validação desta etapa

- 14 testes HTTP e de utilitários de mapa/geocodificação aprovados na integração.
- 26 cenários de navegador aprovados entre a suíte combinada e a repetição dos cenários afetados pela correção de popups, em desktop e celular, com API e geocodificação controladas.
- Integração com PostgreSQL 16/PostGIS 3.5 real: cadastro espacial, SRID, repetibilidade do schema, consulta em metros, área visível, antimeridiano, atualização e exclusão.
- Cadastro pela interface contra o banco real e confirmação após recarregar a página.

Os testes de PostGIS usaram banco descartável local. Esses resultados são anteriores à publicação.

## Próximos integrantes

As funcionalidades das issues #1 e #2 estão integradas em develop. A busca por proximidade da issue #3 foi integrada em develop no PR #10, com testes locais e CI aprovados. A issue #4 acompanha a validação final, com roteiro em docs/publicacao.md. As issues incluem critérios de conclusão. Cada tarefa deve usar sua própria branch, commits e PR, conforme CONTRIBUTING.md.

## Validação da branch de proximidade

- 16 testes de API e utilitários passaram.
- 34 cenários de navegador passaram (17 em desktop e 17 em celular), com geolocalização e respostas controladas.
- Inclui consulta de 2 km, troca de modo, distâncias, resposta vazia, limite e proteção contra respostas atrasadas.
- render.yaml e docs/publicacao.md foram preparados para o primeiro deploy.

## Preparação da release

O repositório foi confirmado público. A release 0.1.0 prepara main com todas as funcionalidades para o primeiro deploy. A configuração de referência foi revisada contra a documentação oficial do Render.


## Publicação validada em 9 de novembro de 2026

- Aplicação HTTPS no [Render Free](https://ponto-de-estudo.onrender.com/), com frontend e API no mesmo serviço Node.js 24, região Virgínia e deploy manual a partir de `main`. Commit da versão publicada: `07d3bc8`.
- PostgreSQL no Supabase Free, região Virgínia, com PostGIS 3.3.7, `public.places`, `geography(Point,4326)` e dois índices GiST. O schema de `main` foi executado novamente dentro de uma transação e preservou o registro já inserido. A transação de teste foi revertida.
- Conexão por Session pooler com `sslmode=verify-full` e a CA do Supabase configurada no Render via `NODE_EXTRA_CA_CERTS`. O papel do backend tem CRUD e acesso à sequência de identidade. A Data API está desativada e a tabela tem RLS com política para o backend. Os papéis `anon` e `authenticated` não têm acesso direto à tabela.
- A escrita na API da aplicação fica aberta durante a demonstração. O backend valida os campos e limita o tamanho do corpo das requisições. A proteção contra abuso por volume continua pendente.

| Verificação no domínio publicado | Resultado |
| --- | --- |
| `GET /api/health` | Aprovado. HTTP 200 com `{"status":"ok"}`, inclusive após reinício. |
| HTTPS, JavaScript e OpenStreetMap | Aprovado. A página carregou o mapa e os tiles sem erros de console observados. |
| Geolocalização negada ou com timeout | Aprovado. A interface informou a limitação e manteve a exploração manual. |
| Cadastro pelo mapa e recarga | Aprovado. Três registros de teste permaneceram após recarregar. |
| Edição | Aprovado. Nome, descrição e posição atualizados e conferidos na API. |
| Exclusão | Aprovado. Cancelar preservou o registro. Confirmar removeu o registro descartável. |
| Nominatim | Aprovado. A busca explícita retornou um endereço e a seleção só posicionou o marcador. O formulário continuou aguardando salvamento. |
| Raio de 2 km pela API | Aprovado com origem sintética. Dois pontos retornaram em ordem crescente, a cerca de 333 m e 1.191 m. O terceiro ficou fora do resultado. |
| Área visível | Aprovado. O pan e o zoom atualizaram a lista. A consulta estreita da API retornou apenas o ponto dentro da área. |
| Layout | Aprovado em desktop e a 390 px, sem rolagem horizontal. |
| Reinício do Render | Aprovado. Os dois registros ainda presentes permaneceram no Supabase após reiniciar. Os três registros descartáveis foram removidos ao fim da validação. |
| Geolocalização concedida e proximidade pela interface, com origem emulada | Aprovado em verificação adicional no domínio publicado. Chromium recebeu uma posição definida pelo teste; a interface centralizou, buscou 2 km, incluiu o ponto interno e excluiu o externo, manteve o modo ao mover o mapa e voltou à área visível com HTTP 200. Sem erros JavaScript observados. Os dois registros descartáveis foram excluídos com HTTP 204. |
| Localização física do usuário | Pendente de confirmação manual no celular ou computador do usuário. A origem emulada comprova o fluxo da aplicação, mas não é uma medição da posição física do dispositivo. |

[Repositório público](https://github.com/rhamede-crypto/trabalho-banco-de-dados) · [Aplicação HTTPS](https://ponto-de-estudo.onrender.com/) · [Roteiro de apresentação](apresentacao.md)
