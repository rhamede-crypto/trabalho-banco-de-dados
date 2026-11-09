# Completar edição, exclusão e busca por endereço na interface

## Estado atual
Após integrar os PRs #7 e #9, edição, exclusão e busca de endereço também estão disponíveis em develop. O cadastro inicial já tem formulário com nome e descrição, seleção por clique/centro do mapa, ajuste do marcador por arraste e persistência via POST. Consulte o PR da branch feature/1-mapa-cadastro-inicial, destinada a develop. Não reimplementar essa parte; revisar a interface existente em public/.

## Escopo integrado nos PRs #7 e #9
- Permitir editar nome, descrição e localização de um local cadastrado, integrando PUT /api/places/:id.
- Integrar DELETE /api/places/:id, com confirmação de exclusão.
- Atualizar lista/marcadores após sucesso e preservar formulário em falhas.
- Buscar localidades por geocodificação (Nominatim ou serviço equivalente).
- Observar política oficial do provedor: atribuição, limites de requisições e restrições de autocomplete; não disparar uma requisição por tecla indiscriminadamente.
- Selecionar resultado da busca e posicionar ponto no mapa, sem salvar automaticamente.

## Critérios de conclusão
- Fluxo completo de criar, consultar, editar e excluir local persistido no PostGIS pela interface.
- Validar campos e apresentar erros do backend de forma compreensível.
- Busca por endereço funciona e permite confirmar/ajustar a localização antes de salvar.
- Testar cancelamento, resposta vazia, falha de rede e duplo envio.
- Incluir os novos cenários em e2e/.

## Dependências
Backend e primeira interface do mapa (issue #1). Usar develop atualizada e uma branch feature/ própria.
