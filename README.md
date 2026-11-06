# Locais de estudo

Projeto de Banco de Dados II: mapa colaborativo de bibliotecas, salas e outros locais de estudo. A primeira entrega implementa a API Node.js e o schema PostgreSQL/PostGIS. A interface e a publicação são tarefas da equipe em `docs/issues/`.

## Executar

Requer Node.js 22 ou superior e PostgreSQL com PostGIS (por exemplo, Supabase).

```sh
npm ci
cp .env.example .env
# Preencha DATABASE_URL com a conexão PostgreSQL do seu projeto.
npm run db:setup
npm run dev
```

A API usa a porta 3000 por padrão (`PORT` pode alterá-la). `npm start` inicia sem watch; `npm test` executa testes HTTP com banco simulado. Esses testes não substituem validação real de PostGIS. Sem DATABASE_URL, o servidor inicia, mas a API retorna 503 com orientação de configuração. Credenciais ficam somente em `.env` ou nas variáveis do servidor; nunca no frontend. TLS usa a configuração da URL PostgreSQL e a verificação padrão do driver; não desative a verificação de certificados.

`db:setup` cria a extensão, tabela e índices de forma repetível; não apaga dados. A conta de instalação precisa poder criar a extensão. Em produção, use uma conta de aplicação com permissões restritas. Evite editar a tabela manualmente; registre mudanças futuras como migrações.

## Contrato da API

`place` representa um local de estudo. Respostas usam `id` como string, `name`, `description`, `latitude` e `longitude`.

| Método | Caminho | Resultado |
| --- | --- | --- |
| GET | `/api/health` | 200 se a tabela está acessível; 503 caso contrário |
| GET | `/api/places?west=-39&east=-38&south=-4&north=-3` | Locais na área visível |
| GET | `/api/places?longitude=-38.5&latitude=-3.7&radius=2000` | Locais até 2000 metros, ordenados por distância |
| POST | `/api/places` | Cria e retorna local (201) |
| PUT | `/api/places/:id` | Substitui campos do local (200 ou 404) |
| DELETE | `/api/places/:id` | Remove local (204 ou 404) |

Corpo de POST/PUT:

```json
{"name":"Biblioteca Central","description":"Espaço silencioso para estudar","latitude":-3.74,"longitude":-38.57}
```

Nome obrigatório com até 120 caracteres; descrição com até 2000. Latitude entre -90 e 90, longitude entre -180 e 180. Raio entre 1 e 50000 metros. Consultas retornam `{ "places": [], "truncated": false }`. Há limite de 500 locais; se `truncated` for true, a interface deve pedir para aproximar o mapa. Na busca por distância, cada local inclui `distance` em metros. A área visível também aceita cruzamento do antimeridiano (`west > east`). Dados inválidos retornam 400; falhas do banco, 503, com `{ "error": "mensagem" }`.

O banco salva `geography(Point,4326)`; usa ST_DWithin para raio e ST_Intersects para área visível. Consultas SQL usam parâmetros. Índices GiST atendem geografia e geometria.

## Divisão sugerida (até quatro integrantes)

1. Backend e modelagem: esta entrega; revisar e validar com PostGIS real.
2. Frontend: mapa, geolocalização e consulta da área visível.
3. Cadastro/edição/exclusão e geocodificação, em conjunto com frontend.
4. Banco na nuvem, deploy, testes integrados e roteiro de apresentação.

Todos devem revisar o contrato, fazer commits próprios e compreender o fluxo completo. Nenhuma publicação ou autenticação de usuários foi implementada nesta etapa. A API atual permite escrita sem login; antes de tornar a aplicação pública, definir proteção de abuso e política de acesso na tarefa de publicação.

## Issues para a equipe

Os quatro escopos estão detalhados em [docs/issues](docs/issues). Para criá-los no GitHub com uma conta autorizada e acesso a api.github.com:

```sh
bash scripts/create-issues.sh
```

O script verifica títulos já existentes antes de criar. Nenhuma atribuição a integrantes é feita automaticamente.
