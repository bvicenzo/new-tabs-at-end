# Achados para o plano 06 — Implementação da extensão

Insumo para o plano 06. Não é o plano.

Origem: uma rodada da skill `specify-behavior`, executada por um agente novo durante a validação do plano 02. A entrada foi a descrição em prosa de `TabPlacer#onTabCreated(tab)`, baseada nas ADRs 0001 e 0002. O agente não tinha acesso às evidências do spike (ADR 0001).

## O achado principal: a unidade faz trabalho demais

Especificada como um handler só, a árvore deu **cerca de 100 `it.todo`**. A subárvore de "editar a aba" (aba fechada, arraste com retry, erro inesperado, sucesso) se repete **5 vezes** para o move e **3 vezes** para o ungroup. Pela skill, esse tamanho é um sinal de design. A forma proposta:

1. **Editor de abas.** Concentra o retry durante o arraste ("Tabs cannot be edited right now") e a tolerância a aba já fechada. A árvore dele aparece uma vez por operação (move, ungroup). Para quem chama, o contrato é: resolveu / aba sumiu / desistiu / rejeitou.
2. **Função pura de destino.** Recebe `(tab, setting, groupTabs)` e devolve uma de três coisas: nada; fim da janela + ungroup; ou um índice dentro do grupo. Concentra as regras de `url`/`id`/`groupId` sem nenhum IO.
3. **Leitor de configuração.** Dono do padrão "fim da janela" e do tratamento de valor ausente ou desconhecido no storage.
4. **`TabPlacer`.** Só compõe as peças: lê a configuração se precisar, lista o grupo se precisar e chama o editor. A árvore dele vira só contratos, sem produto cruzado.

## Decisões em aberto levantadas

| # | Decisão | Recomendação do agente | Observação nossa |
| --- | --- | --- | --- |
| D1 | `url` **ausente** (sem a permissão `"tabs"` o Chrome não expõe `url`) | Não mover (fail-safe). O manifest precisa de `"tabs"` | `url === ''` e `url === undefined` são causas diferentes; só a primeira é aba nova |
| D2 | Aba sem `id` ou com `TAB_ID_NONE` | Não fazer nada, em silêncio | — |
| D3 | `groupId` ausente | Não mover | Na prática o `groupId` sempre veio no spike. Avaliar `minimum_chrome_version` para podar |
| D4 | Quem é dono do padrão e dos valores desconhecidos da configuração | O leitor de configuração | Combina com a proposta de divisão |
| D5 | Falha ao ler a configuração | Não mexer na aba e rejeitar | Contestada: a aba fica ao lado da origem, sem aviso |
| D6 | Erro de arraste | Retry limitado (N e intervalo a definir); ao desistir, a aba fica onde está | Definir N e se há log |
| D7 | Erro inesperado da plataforma | Propagar (fail-loud, aparece nos erros do service worker) | Contestada: a alternativa é engolir e logar |
| D8 | Falha ao listar as abas do grupo | Rejeitar e não mover | — |
| D9 | O grupo esvaziou ou a aba saiu do grupo entre o evento e a consulta | Não mover | É uma corrida |
| D10 | A aba já é a última, ou a única, do grupo | Pular o move | Evita um move inútil que pode bater no erro de arraste |
| D11 | Como sair do grupo no modo "fim da janela" | `ungroup` explícito, **move antes do ungroup** | Na ordem inversa, o estado parcial seria "fora do grupo, mas não movida" |

## Perguntas sem resposta

- **Q1.** Uma aba com `url` vazia e **sem** `pendingUrl` (`window.open()` com about:blank, ou `tabs.create` vindo de outra extensão) conta como nova? A regra atual diz que sim.
- **Q2.** Ignorar janelas que não são `normal` (popup, app, devtools)?
- **Q3.** Uma aba fora de grupo que já é a última da janela (o caso típico do Ctrl+T) é movida mesmo assim? Isso seria um move inútil.
- **Q4.** Várias abas novas de uma vez ("abrir todos os favoritos") deixam os moves correndo em paralelo, e a ordem final pode inverter. Serializar?
- **Q5.** A aba movida para dentro do intervalo do grupo continua no grupo?
- **Q6.** Usar o maior `index` do resultado de `tabs.query`, e não o último elemento.
- **Q7.** Qual a semântica do índice em `tabs.move` ao mover para a direita? É exatamente o off-by-one que separa "uma aba depois" de "várias".
- **Q8.** Abas restauradas com lazy-loading ou descartadas chegam com `url` preenchida? **O spike já respondeu que sim**: a restauração na abertura chega com `url` preenchida e `status: unloaded` (ADR 0001).

## Comportamentos do Chrome a confirmar no plano 06

O agente não conseguiu executar o Chrome, e isso foi corretamente marcado como não verificado. Parte já está coberta pelo spike (ADR 0001). Falta medir:

- se `tabs.move(id, { index: -1 })` tira a aba do grupo, inclusive quando o grupo é o último da janela;
- o efeito do `ungroup` na posição;
- se uma aba movida para dentro do intervalo de um grupo continua nele (Q5, Q7);
- as mensagens exatas dos erros ("No tab with id", "cannot be edited right now");
- a ordem do resultado de `tabs.query({ groupId })`.
