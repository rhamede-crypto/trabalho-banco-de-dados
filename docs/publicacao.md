# Implantação e operação

A aplicação é um serviço Node.js que entrega a interface estática e a API no mesmo domínio HTTPS. O banco PostgreSQL/PostGIS é hospedado separadamente no Supabase.

## Requisitos

- Node.js 24 recomendado.
- PostgreSQL com PostGIS.
- Credencial de instalação para criar a extensão e o schema.
- Credencial de aplicação com permissões necessárias para CRUD em `public.places` e uso da sequência de identidade.

## Preparar o banco

Execute o conteúdo de `db/schema.sql` em uma conexão autorizada ou configure `DATABASE_URL` e execute `npm run db:setup`. A operação cria a extensão, a tabela e os índices quando ausentes, sem apagar os registros existentes. Alterações posteriores de schema precisam de migrações próprias.

`location` deve continuar sendo `geography(Point,4326)`. Não substitua o objeto espacial apenas por duas colunas numéricas.

No Supabase, obtenha no painel Connect a conexão PostgreSQL adequada ao serviço de hospedagem. Use Session pooler se a conexão direta IPv6 não estiver disponível. Respeite host, porta, banco e formato do nome de usuário indicados pelo provedor; caracteres especiais da senha devem ser codificados corretamente na URI.

A aplicação usa o driver `pg`; uma chave pública da Data API do Supabase não substitui a conexão PostgreSQL. Configure os privilégios do papel do backend e a exposição da tabela por outros serviços de forma consistente com a política de acesso desejada. Se RLS estiver ativo, o papel do backend precisa das políticas ou permissões apropriadas.

## Configuração do serviço

O arquivo `render.yaml` é a referência para um Web Service, com os seguintes parâmetros:

| Campo | Valor |
| --- | --- |
| Branch | `main` |
| Runtime | Node.js |
| Build | `npm ci --omit=dev` |
| Start | `npm start` |
| Health check | `/api/health` |
| `NODE_VERSION` | `24` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Conexão PostgreSQL, configurada como segredo |
| Porta | `PORT` fornecida pelo provedor |

`autoDeployTrigger: "off"` deixa a implantação manual. Atualizar o GitHub não implica que uma nova versão já foi publicada. O processo `npm start` não instala o schema do banco.

O frontend já é servido pelo Node.js; não é necessário criar um Static Site ou servidor de frontend separado. Os recursos do Leaflet são servidos localmente pela instalação npm, enquanto tiles e geocodificação dependem dos provedores externos.

## TLS e credenciais

Mantenha a verificação TLS da conexão PostgreSQL. Na configuração publicada, o certificado CA do Supabase é disponibilizado ao processo no Render e o caminho é indicado em `NODE_EXTRA_CA_CERTS`; a URI usa `sslmode=verify-full`.

Para reproduzir essa configuração, obtenha a CA oficial do projeto/provedor, disponibilize o arquivo ao serviço e configure o caminho correto. `NODE_EXTRA_CA_CERTS` recebe o caminho de um arquivo, não o texto do certificado. Assegure que o arquivo esteja acessível quando o processo Node.js iniciar. Se o ambiente já confia na cadeia do servidor, confira a configuração recomendada pelo provedor antes de acrescentar uma CA.

Não desative a verificação de certificados para contornar erros. Não publique a URI de conexão ou credenciais no repositório ou no JavaScript do navegador.

## Saúde e diagnóstico

`GET /api/health` retorna 200 com `{"status":"ok"}` quando a consulta de verificação da tabela funciona. Esse endpoint não substitui uma verificação completa de escrita e dos fluxos da aplicação.

Para 503, confira `DATABASE_URL`, conectividade, endpoint do pooler, TLS, permissões e existência do schema. Para mapas ou geocodificação indisponíveis, confira os serviços externos e a rede do navegador.

Geolocalização exige contexto seguro em produção e permissão do navegador. No Chrome, abra os controles do site, permita Localização, recarregue e use o botão de localização. Se a posição não estiver disponível, a interface mantém exploração manual.

## Verificar uma implantação

- Confirmar HTTPS, health check e carregamento da interface.
- Criar, consultar, editar e excluir um registro descartável, conferindo persistência após recarga.
- Validar localização permitida e negada, busca de endereço, raio em metros e área visível.
- Conferir troca de modo, resultado vazio, falhas de conexão e layout em celular.
- Remover apenas os dados de teste criados para a verificação e preservar os demais registros.

Na configuração atual, a escrita pela API é aberta. Validação de entrada, limite de corpo, TLS, privilégios do banco e RLS não equivalem a autenticação de usuários ou limitação de requisições por cliente.
