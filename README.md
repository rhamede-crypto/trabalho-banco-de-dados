# Ponto de Estudo

Aplicação web para cadastrar e encontrar locais de estudo em um mapa. Os dados são armazenados em PostgreSQL/PostGIS, com localização espacial e consultas por área visível ou distância.

**[Acessar aplicação](https://ponto-de-estudo.onrender.com/)** · **[Health check](https://ponto-de-estudo.onrender.com/api/health)**

## Funcionalidades

- Cadastro, consulta, edição e exclusão de locais com nome, descrição e posição no mapa.
- Geolocalização do navegador, com alternativa manual quando indisponível.
- Busca de endereços pelo Nominatim, com seleção da posição antes de salvar.
- Carregamento de locais conforme a área visível do mapa.
- Busca por raio a partir da localização do usuário, com distâncias e ordenação por proximidade.
- Layout responsivo, validação de campos e tratamento de falhas de conexão.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | HTML, CSS, JavaScript, Leaflet e Fetch API |
| Mapa e geocodificação | OpenStreetMap e Nominatim |
| Backend | Node.js, Express e driver PostgreSQL `pg` |
| Banco | PostgreSQL com PostGIS e índices GiST |
| Hospedagem | Render para aplicação; Supabase para banco |
| Verificação | Node.js Test Runner, Playwright e GitHub Actions |

O backend serve a interface e a API no mesmo serviço. O navegador não acessa diretamente o PostgreSQL nem recebe credenciais do banco.

## Executar localmente

Recomenda-se Node.js 24 e um banco PostgreSQL com PostGIS.

```sh
npm ci
cp .env.example .env
# Configure DATABASE_URL no arquivo .env.
npm run db:setup
npm run dev
```

Acesse `http://localhost:3000/`. `PORT` altera a porta; `npm start` inicia sem watch. Sem `DATABASE_URL`, a interface é servida, mas a API retorna 503 indicando que o banco não está configurado.

`db:setup` instala o schema de [db/schema.sql](db/schema.sql). A operação é repetível e não apaga os registros existentes. Mudanças futuras no schema devem usar migrações apropriadas; o script não atualiza automaticamente uma tabela já criada para qualquer definição nova.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `public/` | Interface, mapa e clientes HTTP |
| `src/server.js` | Inicialização e encerramento do servidor |
| `src/app.js` | Rotas, consultas SQL e arquivos estáticos |
| `src/db.js` | Pool de conexões PostgreSQL |
| `src/validation.js` | Validação dos dados de entrada |
| `src/setup-db.js` | Aplicação do schema |
| `db/schema.sql` | Extensão, tabela e índices espaciais |
| `test/`, `e2e/`, `integration/` | Testes de API, navegador e banco real |
| `render.yaml` | Configuração de referência da hospedagem |

## API

`place` tem `id` como string, `name`, `description`, `latitude` e `longitude`.

| Método | Caminho | Resposta |
| --- | --- | --- |
| GET | `/api/health` | 200 se a tabela está acessível; 503 em falha |
| GET | `/api/places?west=-39&east=-38&south=-4&north=-3` | Locais na área visível |
| GET | `/api/places?longitude=-38.5&latitude=-3.7&radius=2000` | Locais até 2000 metros, ordenados por distância |
| POST | `/api/places` | Cria um local, retornando 201 |
| PUT | `/api/places/:id` | Atualiza um local; 200 ou 404 |
| DELETE | `/api/places/:id` | Remove um local; 204 ou 404 |

Corpo de POST/PUT:

```json
{"name":"Biblioteca Central","description":"Espaço silencioso para estudar","latitude":-3.74,"longitude":-38.57}
```

Nome obrigatório com até 120 caracteres; descrição com até 2000. Latitude entre -90 e 90 e longitude entre -180 e 180. O raio da API é de 1 a 50000 metros; a interface recebe quilômetros. Dados inválidos retornam 400.

Consultas retornam `{ "places": [], "truncated": false }`. O limite é de 500 locais. Se `truncated` for verdadeiro, aproxime o mapa ou reduza o raio. Na busca por distância, cada local inclui `distance` em metros. A consulta por área também trata o cruzamento do antimeridiano.

O banco mantém `location` como `geography(Point,4326)`. A API extrai coordenadas para renderização, usa `ST_DWithin` para o raio e `ST_Intersects` para a área visível. Consultas SQL usam parâmetros e os índices GiST atendem geografia e a expressão convertida em geometria.

## Testes

```sh
npm test
npx playwright install chromium
npm run test:e2e
```

Os testes de navegador iniciam automaticamente um servidor na porta 3100 e usam respostas controladas para API, geolocalização e tiles. Eles não validam o serviço externo de mapas nem substituem os testes no domínio publicado. Em Linux, `npx playwright install --with-deps chromium` também instala dependências necessárias do navegador. Um Chromium existente pode ser selecionado com `CHROMIUM_PATH`.

Para SQL real, forneça `TEST_DATABASE_URL` no ambiente do comando e execute `npm run test:db`. Use um banco de testes com permissão de criar extensão e schema; a suíte cria e remove seu próprio schema temporário. Não execute contra o banco de produção. Essa variável não é carregada de `.env` pelo comando de testes.

O workflow [checks.yml](.github/workflows/checks.yml) executa testes de API, PostGIS e navegador no GitHub Actions.

## Implantação e operação

O Render serve interface e backend por HTTPS, e o Supabase mantém o PostgreSQL/PostGIS. Veja [docs/publicacao.md](docs/publicacao.md) para configuração, conexão TLS e diagnóstico.

A API permite escrita sem login na configuração atual. Credenciais permanecem no backend, em variáveis de ambiente. A validação de campos e o limite do corpo das requisições não substituem autenticação ou proteção contra abuso por volume.

## Desenvolvimento

As branches permanentes são `main` e `develop`. Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo de contribuição e a configuração local do Git Flow.
