# Configurar Supabase/PostGIS, publicar e validar aplicação completa

## Objetivo
Disponibilizar frontend, backend e banco na nuvem, como exige o enunciado.

## Tarefas
- Criar/configurar projeto PostgreSQL com PostGIS (ex.: Supabase), sem versionar segredos.
- Configurar DATABASE_URL segura e executar npm run db:setup; executar novamente e conferir que dados permanecem.
- Validar CRUD, ST_DWithin (metros), consultas na área visível e índices com banco real.
- Publicar Node.js em serviço compatível (ex.: Render); comando npm ci e npm start, porta PORT do provedor.
- Servir frontend pelo backend ou configurar origem permitida explicitamente se usar domínios separados.
- Configurar HTTPS para geolocalização e verificar tiles/geocodificação no domínio publicado.
- Definir política de escrita e proteção de abuso antes de expor a API; usar usuário de banco de aplicação restrito e revisar acesso público à tabela via outros serviços do Supabase.
- Registrar testes integrados, links públicos e roteiro de apresentação no README.

## Critérios de conclusão
- GET /api/health retorna 200 no ambiente publicado.
- Um fluxo completo cria, lista, edita e remove um local; banco persiste entre reinícios.
- Pontos dentro/fora do raio e da área visível têm resultados conferidos.
- Repositório público e links de aplicação/repositório prontos para entrega no Classroom.
- Integrantes conseguem explicar objeto espacial, SRID, distância e filtros espaciais.

## Dependências
Pode iniciar configuração do banco em paralelo; teste final depende das issues 01–03. Credenciais devem ser adicionadas nas configurações seguras do serviço, nunca em issues ou commits.
