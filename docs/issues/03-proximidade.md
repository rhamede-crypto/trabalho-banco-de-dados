# Implementar busca de locais de estudo por distância

## Objetivo
Encontrar locais próximos à localização atual do usuário.

## Tarefas
- Controle de raio em quilômetros, convertido para metros na API (1 a 50000 metros).
- Consumir GET /api/places?longitude=...&latitude=...&radius=... com coordenadas do usuário.
- Exibir distância retornada em formato legível e manter ordenação de proximidade.
- Diferenciar visualmente modo área visível e modo proximidade, com ação para voltar ao mapa normal.
- Mostrar círculo do raio, estado vazio e erros de geolocalização/rede.

## Critérios de conclusão
- Busca de 2 km mostra apenas pontos elegíveis, com dados reais de teste.
- Movimentar mapa não sobrescreve resultados do modo proximidade inadvertidamente.
- Não consultar localização padrão como se fosse a localização real do usuário.
- Tratar limite de resultados e raios inválidos.

## Dependências
Issue 01 e backend. Pode ser feita depois da primeira versão do mapa.
