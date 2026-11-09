# Locais de estudo

Projeto de Banco de Dados II: mapa colaborativo de bibliotecas, salas e outros locais de estudo. A primeira versão integrada inclui API Node.js, schema PostgreSQL/PostGIS e interface com mapa, geolocalização, consulta por área visível e cadastro de locais. As próximas tarefas da equipe estão em `docs/issues/` e o estado da entrega está em [docs/progresso.md](docs/progresso.md).

## Executar

Requer Node.js 22 ou superior e PostgreSQL com PostGIS (por exemplo, Supabase).

```sh
npm ci
cp .env.example .env
# Preencha DATABASE_URL com a conexão PostgreSQL do seu projeto.
npm run db:setup
npm run dev
```

Após iniciar, acesse a aplicação na porta 3000 do servidor. O frontend é servido pelo próprio backend; não precisa de build ou servidor separado. Leaflet é servido pela instalação local e o mapa base usa OpenStreetMap, com atribuição na tela. O carregamento de tiles depende de conexão com o provedor.

A API usa a porta 3000 por padrão (`PORT` pode alterá-la). `npm start` inicia sem watch; `npm test` executa testes HTTP com banco simulado. Há também testes de navegador e de integração com PostGIS real, descritos abaixo. Sem DATABASE_URL, o servidor inicia, mas a API retorna 503 com orientação de configuração. Credenciais ficam somente em `.env` ou nas variáveis do servidor; nunca no frontend. TLS usa a configuração da URL PostgreSQL e a verificação padrão do driver; não desative a verificação de certificados.

`db:setup` cria a extensão, tabela e índices de forma repetível; não apaga dados. A conta de instalação precisa poder criar a extensão. Em produção, use uma conta de aplicação com permissões restritas. Evite editar a tabela manualmente; registre mudanças futuras como migrações.

## Frontend (mapa Leaflet)

Com o servidor em execução, abra `http://localhost:3000/` para carregar o mapa. A interface:

- solicita geolocalização no navegador e usa fallback para Fortaleza (CE) quando não disponível;
- consulta apenas o retângulo visível em `GET /api/places` no carregamento e ao mover/zoom;
- informa estado de carregamento, ausência de resultados, falha e resposta truncada.

### Validação manual registrada

Para validar com dois locais reais (Fortaleza):

```sh
curl -X POST http://localhost:3000/api/places -H 'Content-Type: application/json' -d '{"name":"Biblioteca Pública Estadual do Ceará","description":"Av. Presidente Castelo Branco, 255","latitude":-3.71657,"longitude":-38.53604}'
curl -X POST http://localhost:3000/api/places -H 'Content-Type: application/json' -d '{"name":"Biblioteca da UFC (Campus do Pici)","description":"Bloco 308, Campus do Pici","latitude":-3.74559,"longitude":-38.57466}'
```

Depois, abra o mapa em `http://localhost:3000/`, permita geolocalização (ou use fallback), aproxime/afaste e confirme que os marcadores aparecem apenas quando os pontos estão dentro da área visível.

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
2. Frontend: revisão do mapa entregue e interface de busca por proximidade.
3. Edição/exclusão e geocodificação, evoluindo o cadastro já entregue.
4. Banco na nuvem, deploy, testes integrados e roteiro de apresentação.

Todos devem revisar o contrato, fazer commits próprios e compreender o fluxo completo. Nenhuma publicação ou autenticação de usuários foi implementada nesta etapa. A API atual permite escrita sem login; antes de tornar a aplicação pública, definir proteção de abuso e política de acesso na tarefa de publicação.

## Issues para a equipe

Os quatro escopos estão detalhados em [docs/issues](docs/issues). Para criá-los no GitHub com uma conta autorizada e acesso a api.github.com:

```sh
bash scripts/create-issues.sh
```

O script verifica títulos já existentes antes de criar. Nenhuma atribuição a integrantes é feita automaticamente.

## Git Flow

Usamos `main` para versões estáveis, `develop` para integração e branches `feature/*`, `release/*` e `hotfix/*` para o trabalho da equipe. Após clonar, execute `bash scripts/setup-git-flow.sh`. Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para criar uma tarefa, abrir PR e publicar versões.


## Interface entregue

- Geolocalização solicitada ao abrir; permissão negada ou falha permite explorar o mapa manualmente, com Fortaleza como posição inicial alternativa.
- Pontos e lista atualizados no `moveend`, por área visível, com cancelamento de requisições antigas e tratamento do limite de 500 resultados.
- Cadastro com nome, descrição e localização selecionada no mapa, ajustável arrastando o marcador. O botão “Usar o centro do mapa” também permite selecionar sem clicar diretamente no mapa.
- Mensagens para falhas de rede/banco, ausência de pontos e sucesso no cadastro. Não há dados simulados nem salvamento local no produto; a persistência depende de DATABASE_URL.
- Layout para desktop e celular; geolocalização em domínio publicado exige HTTPS.

Edição e exclusão pela interface, com confirmação, e geocodificação por busca explícita de endereço já estão integradas. A busca inclui cancelamento, intervalo mínimo de 1,2 segundo e seleção de resultado sem salvamento automático. Interface de busca por raio e publicação permanecem para a equipe. As operações correspondentes do backend já estão disponíveis.

## Validar

```sh
npm test
npx playwright install chromium
npm run test:e2e
```

`test:e2e` inicia automaticamente um servidor na porta 3100 e usa API/geolocalização/tiles controlados para verificar sucesso e falhas em desktop e celular. Ele não depende de banco e não valida o serviço externo de mapas. Se o sistema já tiver Chromium, pode usar `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. Em máquinas Linux sem dependências de navegador, use `npx playwright install --with-deps chromium`.

Para validar SQL e persistência, configure `TEST_DATABASE_URL` **no ambiente do comando** e execute `npm run test:db`. Use um banco de testes com PostGIS e permissões para criar extensão e schema; o teste cria e remove apenas seu schema temporário. Essa variável não é lida de `.env` pelo script de testes. Não usar o banco de produção.

A integração contínua em `.github/workflows/checks.yml` configura PostGIS e executa os três grupos de testes em pushes e PRs do Git Flow. A execução no GitHub depende de Actions habilitado no repositório.
