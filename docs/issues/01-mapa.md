# Implementar mapa de locais de estudo e geolocalização

## Objetivo
Criar frontend responsivo usando Leaflet, consumindo a API existente. Pode usar HTML/CSS/JS e a pasta public para servir tudo pelo mesmo backend.

## Tarefas
- Exibir mapa com atribuição correta do provedor de tiles.
- Solicitar geolocalização e abrir o mapa na localização do navegador.
- Tratar permissão negada, timeout e indisponibilidade com localização alternativa e mensagem clara.
- Consultar GET /api/places com limites west/east/south/north ao iniciar e no evento moveend.
- Cancelar consultas antigas e evitar que respostas atrasadas substituam os pontos da área atual.
- Mostrar marcadores e detalhes com nome/descrição, inserindo texto sem HTML inseguro.
- Tratar carregamento, ausência de pontos, falha e truncated=true (pedir zoom).

## Critérios de conclusão
- Mover/alterar zoom carrega apenas a área visível; não buscar todos os pontos.
- Geolocalização funciona em HTTPS e tem alternativa quando negada.
- Interface utilizável em celular e desktop; sem credenciais de banco no navegador.
- Demonstrar dois locais reais de teste e registrar validação no PR.

## Dependências
Contrato no README e backend desta entrega. Coordenar elementos de seleção/edição com issue 02.
