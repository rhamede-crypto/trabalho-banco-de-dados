# Publicar no Supabase e Render

Este roteiro é uma tarefa real para o integrante responsável pela publicação. Ele deve executar, validar, registrar os resultados e conseguir explicar suas decisões. A configuração pronta não significa que o aplicativo já esteja publicado.

## 1. Preparar a versão

Revisar e integrar o PR de proximidade em develop. Preparar uma release pelo Git Flow e integrar em main após os testes. O arquivo render.yaml usa main como branch de publicação; não apontar para uma versão antiga sem as funcionalidades revisadas. Não criar commits fictícios nem alterar a autoria de alterações feitas por outras pessoas.

## 2. Criar o banco no Supabase

1. Acessar o painel oficial do Supabase com a conta da equipe e criar um projeto. Conferir região, plano, limites e condições atuais antes de confirmar.
2. Guardar a senha do banco em um gerenciador de senhas. Não publicá-la em issues, commits, capturas ou mensagens.
3. Abrir o SQL Editor e executar o conteúdo de db/schema.sql da versão escolhida. Ele cria PostGIS, tabela places e índices. Executar novamente deve preservar a tabela e seus dados.
4. No painel de conexão, obter a URL PostgreSQL adequada ao servidor do Render. Se a conexão direta IPv6 não estiver disponível, usar o pooler em modo Session indicado pelo Supabase. Esta aplicação usa o driver pg e consultas sem prepared statements nomeadas.
5. Usar a configuração TLS recomendada pelo provedor, com verificação de certificado; não usar rejectUnauthorized=false nem desativar a verificação para contornar erros.
6. Separar a conta de instalação da conta usada pela aplicação. Para o usuário de aplicação, conceder apenas uso do schema, CRUD em places e acesso à sequência de identidade necessária. Não usar a senha administrativa em frontend. Conferir a exposição da tabela pela Data API/RLS do Supabase: a aplicação usa conexão PostgreSQL no backend, não acesso público direto à tabela pelo navegador.

## 3. Publicar o serviço no Render

É possível servir frontend e backend juntos, no mesmo serviço Node.js.

1. Entrar no Render e conectar o repositório da equipe. Confirmar o plano e as condições atuais; a configuração de referência usa o plano free, sujeito à disponibilidade da conta.
2. Usar o Blueprint render.yaml ou criar um Web Service manualmente com runtime Node.js, branch main, build npm ci --omit=dev e start npm start.
3. Configurar DATABASE_URL como segredo no painel do serviço. A chave sync:false do Blueprint solicita essa configuração; o arquivo não contém seu valor.
4. Usar Node.js 24 e NODE_ENV=production. A aplicação lê PORT do provedor e serve a pasta public. O endpoint de saúde é /api/health.
5. Depois de preparar o schema e as variáveis, iniciar o deploy. Se /api/health retornar 503, verificar conexão PostgreSQL, schema e logs do serviço. Não mostrar credenciais ao compartilhar logs.
6. Abrir a URL HTTPS fornecida pelo Render. A geolocalização depende de HTTPS. Confirmar acesso a tiles do OpenStreetMap e ao Nominatim; a busca de endereços é feita apenas por envio explícito, com atribuição e intervalo mínimo entre buscas.

A configuração render.yaml foi preparada no repositório; só deve ser considerada validada no provedor após a criação efetiva do serviço e os testes abaixo.

## 4. Validar a aplicação publicada

Registrar data, URL e resultado real de cada passo:

- [ ] /api/health retorna 200.
- [ ] Mapa abre na localização permitida pelo navegador; permissão negada tem alternativa clara.
- [ ] Cadastrar dois locais de teste, conferir a posição no mapa e recarregar a página para verificar persistência.
- [ ] Editar nome/descrição e mover um local; conferir o resultado.
- [ ] Cancelar uma exclusão; depois confirmar a exclusão de um local descartável.
- [ ] Buscar um endereço e conferir que selecionar o resultado não salva automaticamente.
- [ ] Consultar raio de 2 km da localização real: ponto dentro aparece e ponto fora não aparece; distâncias e ordenação fazem sentido.
- [ ] Mover o mapa no modo de proximidade mantém o filtro; voltar à área visível restaura a consulta por viewport.
- [ ] Mover o mapa no modo normal carrega apenas pontos da área visível.
- [ ] Verificar celular, falhas de conexão e autorização negada para localização.
- [ ] Conferir que não há segredos no HTML, JavaScript público ou repositório.

A API atual permite escrita sem login. Antes de uma exposição pública ampla, a equipe deve definir a política de acesso e proteção de abuso apropriada ao projeto. O enunciado não exige login; isso não substitui os requisitos funcionais.

## 5. Finalizar a entrega

- Conferir dependências, licenças e informações antes de tornar o repositório público em Settings → General → Danger Zone → Change visibility. O enunciado exige repositório público; a configuração deve ser feita por um administrador autorizado.
- Adicionar a URL real da aplicação ao README e à descrição do repositório.
- Atualizar docs/progresso.md com os testes efetivamente realizados e as limitações restantes.
- Fazer commits próprios das alterações e do registro da publicação executados pelo integrante responsável, mantendo a autoria do trabalho anterior.
- Preparar a apresentação: explicar geography(Point,4326), GiST, ST_DWithin, filtro de área visível e fluxo frontend → API → PostGIS.
- Entregar os links do repositório e da aplicação no Classroom institucional, conforme o cronograma atualizado pelo professor.
