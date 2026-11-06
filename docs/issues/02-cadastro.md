# Implementar cadastro, edição, exclusão e busca por endereço

## Objetivo
Permitir gerenciar locais de estudo usando formulário e mapa.

## Tarefas
- Formulário com nome e descrição conforme limites do README.
- Selecionar localização clicando no mapa e mostrar marcador de seleção.
- Integrar POST, PUT e DELETE /api/places; confirmar exclusão e preservar formulário em falhas.
- Atualizar marcadores após sucesso e permitir editar a localização.
- Buscar localidades por geocodificação (Nominatim ou serviço equivalente).
- Observar política oficial do provedor: atribuição, limites de requisições e restrições de autocomplete; não disparar uma requisição por tecla indiscriminadamente.
- Selecionar resultado da busca e posicionar ponto no mapa.

## Critérios de conclusão
- Criar, consultar, editar e excluir local persistido no PostGIS.
- Validar campos e apresentar erros do backend de forma compreensível.
- Busca por endereço posiciona o local sem salvá-lo automaticamente.
- Testar cancelamento, resposta vazia, falha de rede e duplo envio.

## Dependências
Backend e interface da issue 01; combinar contrato de seleção de marcador com responsável pelo mapa.
