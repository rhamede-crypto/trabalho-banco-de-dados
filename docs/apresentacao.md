# Roteiro para demonstrar e explicar o projeto

## Demonstração (após publicar)

1. Abrir a aplicação HTTPS e permitir geolocalização. Explicar a alternativa quando o navegador nega a permissão.
2. Buscar um endereço, selecionar o resultado, preencher nome/descrição e cadastrar o local.
3. Recarregar a página e mostrar que o banco preservou o cadastro.
4. Editar nome/descrição e ajustar a posição do marcador; depois excluir um ponto de teste com confirmação.
5. Buscar locais a 2 km do usuário e mostrar distâncias e círculo do raio.
6. Voltar ao modo normal, mover o mapa e mostrar a atualização dos pontos da área visível.

## Conceitos que precisam ser compreendidos

- O navegador usa Leaflet e pede dados ao backend Node.js/Express, que consulta PostgreSQL/PostGIS. A senha do banco fica no servidor.
- O banco armazena location como geography(Point,4326), em vez de apenas duas colunas numéricas. SRID 4326 identifica o sistema geográfico WGS 84.
- ST_MakePoint recebe longitude primeiro e latitude depois; ST_SetSRID identifica o sistema de referência antes da conversão para geography.
- ST_DWithin com geography mede distância em metros e filtra pontos pelo raio. ST_Distance calcula a distância mostrada na lista e usada na ordenação.
- A área visível do mapa vira west/east/south/north. ST_MakeEnvelope e ST_Intersects filtram os pontos; há tratamento específico para cruzar o antimeridiano.
- Índices GiST ajudam as consultas espaciais. Eles existem para geography e para a expressão convertida em geometry.
- A busca por endereço usa Nominatim por envio explícito. Selecionar um resultado posiciona o marcador; só Salvar persiste o dado.
- AbortController e identificadores de requisição evitam que respostas atrasadas de uma área/modo antigo sobrescrevam o mapa atual.
- Requisições SQL usam parâmetros para separar os dados do usuário do comando SQL.
- No Git Flow, funcionalidades vão para develop; releases revisadas vão para main. O histórico preserva os commits e as contribuições dos autores.

## Evidências da entrega

Registrar a URL pública real, o link do repositório e os resultados da lista de testes de docs/publicacao.md. Entregar os dois links no Classroom institucional. A data válida é a informada pelo professor no cronograma atualizado.
