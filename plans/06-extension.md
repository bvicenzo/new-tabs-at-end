# Plano 06 — A extensão, com testes

## Contexto

Os planos 01 a 05 deixaram o repositório com estilo, lint, testes RSpec-like e CI exigindo 100% de cobertura por arquivo, mas ainda sem uma linha da extensão (`src/` não existe). Este plano escreve a extensão:

- detecção de aba nova pela `url` vazia (ADR 0001);
- posicionamento no fim da janela ou no fim do grupo (ADR 0002);
- página de opções;
- atalho de alternância.

Tudo é testado com `specify-behavior` + `write-tests`.

O insumo é `plans/06-extension-findings.md`. A árvore de um handler único deu cerca de 100 folhas, com a subárvore de "editar a aba" repetida 8 vezes, então a unidade é dividida como o achado propõe. O plano também mede no Chromium os comportamentos que o achado deixou como não verificados.

## Decisões tomadas

**Respostas suas:**
- **O atalho age na última aba posicionada pela extensão**, mesmo em segundo plano. A extensão guarda `{ tabId, sourceGroupId }` em `chrome.storage.session` a cada aba nova que posiciona. O atalho alterna essa aba entre o fim da janela (fora do grupo) e o fim do grupo de origem. Não faz nada se:
  - não houver registro;
  - a aba nasceu fora de grupo;
  - a aba já foi fechada;
  - o grupo de origem não existir mais.
- **Falhas:**
  - **Leitura da configuração falhou:** usa o padrão "fim da janela" e posiciona mesmo assim.
  - **Erro inesperado do Chrome no move ou no ungroup:** propaga e aparece em chrome://extensions > Erros. A aba fica onde está.
  - Resolve D5 e D7, e vai para a ADR 0009.
- **Build com esbuild:** um bundle por ponto de entrada (`background.js`, `options.js`) em `dist/`. O `tsc` continua só no typecheck.
- **Interface em inglês e pt-BR,** via `chrome.i18n` (`_locales/en`, `_locales/pt_BR`). Isso cobre o nome, a descrição, o atalho e a página de opções.

**Decisões minhas,** a partir das recomendações do achado (cito o número dele):
- **D1:** `url === ''` é aba nova. `url === undefined` não move (fail-safe). O manifest pede `"tabs"`, sem a qual o Chrome omite a `url`.
- **D2:** aba sem `id`, ou com `TAB_ID_NONE`, não faz nada.
- **D3:** o caso de `groupId` ausente é podado, porque `minimum_chrome_version` fica em `"102"`. É a menor versão com todas as APIs usadas (`storage.session`), e o `groupId` existe desde a 88.
- **D6:** um arraste em andamento ("Tabs cannot be edited right now") faz o editor tentar de novo a cada 100 ms, até 20 vezes (2 s). Ao desistir, `console.warn` e a aba fica onde está. Uma aba já fechada ("No tab with id") é tratada como resolvida, em silêncio.
- **D8:** se a listagem do grupo falhar, a aba não é movida e o erro propaga, como no D7.
- **D9 e D10:** se o grupo esvaziou, se a aba saiu dele, ou se ela já é a última do grupo, não há move.
- **D11:** no modo "fim da janela", a ordem é **move e depois ungroup**. A medição pode mostrar que o move sozinho já tira a aba do grupo; nesse caso o ungroup é removido e a árvore cita a ADR 0008.
- **Q1:** `url` vazia sem `pendingUrl` conta como nova, como diz a ADR 0001 sobre `tabs.create` de outras extensões.
- **Q2:** não há filtro por tipo de janela. Um popup tem uma aba só, então o move é inócuo. A medição confirma isso e a árvore poda o caso citando a ADR 0008.
- **Q3:** uma aba fora de grupo recebe sempre `move(-1)`, mesmo se já for a última. É um no-op e evita uma consulta extra.
- **Q4:** os posicionamentos rodam em fila serial, na ordem de criação, para "abrir todos os favoritos" não inverter a ordem.
- **Q6:** o índice de destino no grupo é o **maior `index`** do resultado de `tabs.query({ groupId })`, nunca o último elemento.
- **Q5 e Q7:** saem da medição.
- **Atalho:** um comando `toggle-placement`, com `suggested_key` `Alt+Shift+G` (configurável em chrome://extensions/shortcuts). A página de opções tem um botão que abre essa tela.
- **Configuração:** a chave `placement` em `chrome.storage.sync`, com os valores `'window'` ou `'group'`. Valor ausente ou desconhecido vale `'window'`.

## Etapa 0 — Medir o Chromium (antes de qualquer árvore)

O harness do spike sumiu do scratchpad, então eu o recrio. O roteiro:
1. Um perfil descartável e o Chromium com `--remote-debugging-port`.
2. Uma extensão de diagnóstico com `tabs` e `tabGroups`.
3. Um `cdp.mjs` que avalia expressões no service worker dela.
4. Cada cenário montado por API: criar abas, agrupar, mover e ler o resultado.

O que medir:

| # | Pergunta |
| --- | --- |
| M1 | `tabs.move(id, { index: -1 })` tira a aba do grupo? E quando o grupo é o último da janela? |
| M2 | O `ungroup` muda a posição da aba? |
| M3 | Uma aba fora de grupo movida para `-1`, quando as últimas abas da janela formam um grupo, entra nesse grupo? |
| M4 | Mover para o maior `index` do grupo deixa a aba no fim do grupo, e dentro dele (Q5, Q7)? |
| M5 | `tabs.group({ tabIds, groupId })` coloca a aba onde? É o caminho do atalho para "fim do grupo". |
| M6 | Qual o texto exato dos erros "No tab with id" e "cannot be edited right now"? |
| M7 | Em que ordem vem o resultado de `tabs.query({ groupId })`? |
| M8 | `move(-1)` numa janela popup com uma aba só é inócuo? |

O "cannot be edited right now" só aparece com um arraste real. Se não der para reproduzir com `wtype` e o mouse, registro o texto a partir do código-fonte do Chromium e marco como não medido.

Os resultados vão para a **ADR 0008** (comportamentos do Chromium ao mover e agrupar abas). Os achados que mudarem alguma decisão acima voltam para você antes do código.

## Desenho

Os pontos de entrada recebem o `chrome` real. As unidades recebem por injeção só o recorte da API que usam, por exemplo `Pick<typeof chrome.tabs, 'move' | 'ungroup'>`. Assim os testes passam `vi.fn()` sem globais.

| Arquivo | Responsabilidade |
| --- | --- |
| `src/new-tab.ts` | A regra da ADR 0001: `isNewTab(tab)` é verdadeira para `url === ''` com `id` válido. |
| `src/destination.ts` | Função pura `(tab, placement, groupTabs) →` nada, ou fim da janela, ou índice no grupo. Concentra D9, D10 e Q6. |
| `src/settings.ts` | Lê e grava `placement`. É dono do padrão e do valor desconhecido (D4), e da falha de leitura, que devolve o padrão. |
| `src/tab-editor.ts` | `edit(tabId, edição)`: aplica qualquer edição (move, ungroup, group) com o retry do arraste e a tolerância a aba fechada. Devolve `'done' \| 'closed' \| 'gaveUp'` e rejeita nos outros erros. Era `move`/`ungroup` separados; a árvore repetida virou extração (revisão do PR A). |
| `src/serial-queue.ts` | A fila que serializa os posicionamentos (Q4). |
| `src/tab-placer.ts` | `onTabCreated`: é aba nova? Lê a configuração e, se precisar, o grupo. Calcula o destino, chama o editor e registra a última aba posicionada. |
| `src/placement-toggle.ts` | `onCommand('toggle-placement')`: lê o registro e alterna a aba entre os dois destinos. |
| `src/background.ts` | Liga os listeners `tabs.onCreated` e `commands.onCommand` às unidades. |
| `src/options.ts` | Página de opções: rádio com os dois destinos, gravação ao mudar, textos via `chrome.i18n` e o botão que abre os atalhos. |
| `static/` | `manifest.json`, `options.html` e `_locales/{en,pt_BR}/messages.json`, copiados para o `dist/`. |

**Manifest (MV3):**
- `background.service_worker: background.js`, `type: module`;
- `permissions: ["tabs", "tabGroups", "storage"]`;
- `commands`, `options_ui`, `default_locale: en`, `minimum_chrome_version: "102"`;
- sem ícones, que ficam para o plano 07.

**Ferramental:**
- **Novas dependências:** `@types/chrome`, `esbuild` e `happy-dom`. O `happy-dom` é só para o teste da página de opções, via `// @vitest-environment happy-dom` no arquivo.
- **Novo script:** `"build": "esbuild src/background.ts src/options.ts --bundle --format=esm --outdir=dist && cp -r static/. dist/"`.
- **`tsconfig.json`:** `"chrome"` entra em `types`.
- **CI:** um passo `npm run build`, para o bundle não quebrar sem ninguém ver.

## Testes

- **Árvore primeiro:** para cada unidade, rodo `specify-behavior` com uma **descrição de negócio** (não o código), e depois `write-tests` para preencher.
- **Onde ficam:** os testes vão em `test/<unidade>.test.ts`. Os builders ficam em `test/support/`:
  - `buildTab(overrides)`: o mínimo válido é uma aba restaurada, com `url` preenchida e fora de grupo;
  - fakes do recorte da API do Chrome.
- **Pontos de entrada:** o `background.ts` é testado com `vi.stubGlobal('chrome', …)` dentro de cada `it`, seguido de `import()` dinâmico após `vi.resetModules()`. Hooks são proibidos pelo `vitest/no-hooks`.
- **Achados da skill:** as decisões em aberto, podas e achados que ela levantar voltam para você, não são resolvidos em silêncio.
- **Cobertura:** 100% por arquivo também no `src/`, pelo threshold do plano 05.

## Execução (dois PRs, como no plano 04)

**PR A — `feat: place new tabs at the end of the window or of their group`**

Branch `feat/tab-placement`, com:
- a Etapa 0 e a ADR 0008;
- o ferramental;
- `new-tab`, `destination`, `settings` (só a leitura), `tab-editor`, `serial-queue`, `tab-placer` e `background` (só o `onCreated`);
- o manifest sem opções e sem comando;
- a ADR 0009 (falhas e padrão);
- o README: instalação a partir do código (`npm run build` e "Load unpacked" no `dist/`) e o status "usable from source".

**PR B — `feat: add the options page and the placement toggle shortcut`**

Branch `feat/options-and-toggle`, a partir do `master` depois do merge do A, com:
- `settings` (a gravação), `options`, `placement-toggle`, o registro da última aba no `tab-placer`, o comando no `background` e no manifest;
- os `_locales`;
- a ADR 0009 atualizada com a semântica do atalho;
- o README: como usar as opções e o atalho.

Ambos com commits em Conventional Commits, sem atribuição de IA, e PR em inglês seguindo o template. `plans/06-extension.md` é uma cópia deste plano, em pt-BR, no PR A.

## Verificação

**Em cada PR:**
- `npm run lint`, `npm run typecheck`, `npm run test:coverage` (100% por arquivo) e `npm run build` verdes, localmente e no CI.

**De ponta a ponta,** no Chromium descartável com o `dist/` carregado e os cenários dirigidos como no spike (`wtype` e CDP):

| Cenário | Esperado |
| --- | --- |
| Ctrl+T numa aba do meio | vai para o fim da janela |
| Link aberto com o botão do meio de uma aba agrupada, configuração "fim da janela" | vai para o fim da janela, fora do grupo |
| O mesmo link, configuração "fim do grupo" | vai para o fim do grupo |
| Ctrl+Shift+T numa aba agrupada | fica onde o Chrome a colocou, no grupo |
| Reabrir o navegador com sessão salva | os grupos ficam intactos |
| Duplicar uma aba | fica ao lado da original |
| Vários favoritos abertos de uma vez | chegam ao fim na ordem de criação |
| (PR B) atalho depois de um link de aba agrupada | a aba alterna entre o fim da janela e o fim do grupo, sem trocar a aba ativa |
| (PR B) a página de opções em pt-BR e em inglês (`--lang`) | grava a escolha, e a escolha sobrevive a recarregar a página |

**Por fim:** você carrega o `dist/` no seu Chrome e testa o uso real antes do merge.
