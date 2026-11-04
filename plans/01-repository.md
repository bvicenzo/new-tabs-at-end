# Plano 01 — Criar o repositório `bvicenzo/new-tabs-at-end`

## Contexto

Vamos escrever uma extensão do Chrome que move para o fim da janela **só as abas realmente novas**, sem desfazer grupos ao reabrir o navegador nem ao usar Ctrl+Shift+T. Ela também vai servir de campo de prova para três coisas:

- portar para TypeScript as regras do `rubocop-vicenzo`;
- criar uma skill de code style;
- generalizar as skills de teste.

Este primeiro plano só cria a casa: o repositório privado no GitHub, com convenções iguais às do `rubocop-vicenzo`, a pasta `plans/` e o registro das decisões tomadas até aqui. As decisões incluem a regra de detecção validada no spike.

Os planos seguintes, um arquivo cada em `plans/`:

| # | Plano | Arquivo |
| --- | --- | --- |
| 01 | Repositório (este) | `plans/01-repository.md` |
| 02 | Skills de teste no repositório de skills | `plans/02-test-skills.md` (**ignorado pelo git**) |
| 03 | Skill de code style | `plans/03-code-style-skill.md` |
| 04 | Port das regras do rubocop-vicenzo para ESLint | `plans/04-lint-rules.md` |
| 05 | CI | `plans/05-ci.md` |
| 06 | Implementação da extensão com testes | `plans/06-extension.md` |
| 07 | CD e publicação na Chrome Web Store | `plans/07-release-and-publishing.md` |

## Decisões já tomadas (vão para `docs/decisions/`)

- **Idioma:** README, docs, código e commits em inglês. Os arquivos de `plans/` ficam em pt-BR.
- **Licença:** nenhuma por enquanto. Volta à pauta no plano 07.
- **Plano 02:** fica em `plans/`, mas listado no `.gitignore`. O nome do arquivo não pode citar a empresa, porque o `.gitignore` é commitado.

## Estado atual

- `/home/bvicenzo/Work/bruno/new-tabs-at-end/` não é repositório git e tem 3 arquivos de rascunho: `manifest.json`, `background.js` e `README.md`. O `background.js` usa a regra antiga, por URL de nova guia, janela de 5 s e aba ativa, que o spike mostrou ser frágil.
- `gh` autenticado como `bvicenzo` (protocolo ssh, escopo `repo`). `bvicenzo/new-tabs-at-end` ainda não existe.
- Convenções do `rubocop-vicenzo` a espelhar:
  - só squash merge;
  - apagar a branch depois do merge;
  - wiki desligada;
  - Conventional Commits garantidos por `.githooks/commit-msg` (ativado com `git config core.hooksPath .githooks`);
  - `.github/pull_request_template.md` com tipo de mudança e checklist;
  - o título do PR vira a mensagem do commit (squash) que o release-please lê.

## Passos

1. **Descartar o rascunho.** Apagar `manifest.json`, `background.js` e `README.md` de `new-tabs-at-end/`. O código real nasce no plano 06, com a regra nova e testes.
2. **`git init -b master`** em `/home/bvicenzo/Work/bruno/new-tabs-at-end`.
3. **Criar os arquivos iniciais:**
   - `README.md` (em inglês): o que a extensão faz, o que conta como aba nova e o que é restauração, status "em desenvolvimento" e a configuração local de hooks (`git config core.hooksPath .githooks`). A automação disso via `npm prepare` fica para o plano em que surgir o `package.json`.
   - `.gitignore`: `node_modules/`, `dist/`, `coverage/`, `*.zip`, `.DS_Store` e `/plans/02-test-skills.md`.
   - `.githooks/commit-msg`: cópia do hook de `rubocop-vicenzo/.githooks/commit-msg`, com os exemplos da mensagem de erro adaptados ao projeto. Precisa ser executável (`chmod +x`).
   - `.github/pull_request_template.md`: mesma estrutura do template do `rubocop-vicenzo`. Os itens específicos de cop saem e a checklist referencia `npm test` e `npm run lint`, que nascem nos planos 04 e 05.
   - `docs/decisions/` com ADRs curtas, no formato contexto, decisão e consequências:
     - `0001-detect-new-tabs-by-empty-url.md`: a regra `tab.url === ''` em `tabs.onCreated` indica aba nova, e `url` preenchida indica restauração ou duplicação. Inclui a tabela de evidências do spike (Ctrl+T, links, Alt+Enter, outro app, favorito pela barra e pelo gerenciador, Ctrl+Shift+T de aba e de janela, reabrir o navegador, duplicar) e as limitações: grupo salvo não testado; medido no Chromium 155.
     - `0002-new-tab-placement-setting.md`: configuração com dois modos, fim da janela (padrão) ou fim do grupo, para links abertos a partir de aba agrupada, mais um atalho para alternar a aba atual. Registra que o modo "perguntar toda vez" foi descartado e por quê. Registra também que duplicar continua ao lado da original.
     - `0003-lint-rules-live-in-this-repository.md`: as regras ESLint portadas do `rubocop-vicenzo` nascem aqui de propósito, com a intenção de extraí-las para um `eslint-plugin-vicenzo` quando amadurecerem.
     - `0004-test-style.md`: Vitest com alias `context`, premissas e `subject` dentro de cada `it` (sem estado compartilhado), construtoras em `test/support/` e nenhum Prettier, porque ele contraria a regra de quebra de cadeia.
   - `plans/01-repository.md`: este plano.
4. **Commit inicial** direto em `master`, já que o repositório está vazio: `chore: bootstrap repository`. Sem trailer de co-autoria de IA.
5. **Criar o repositório remoto e enviar:**
   ```
   gh repo create bvicenzo/new-tabs-at-end --private --source . --remote origin --push \
     --description "Chrome extension that moves only genuinely new tabs to the end of the window"
   ```
6. **Ajustar as configurações do repositório** para espelhar o `rubocop-vicenzo`:
   ```
   gh repo edit bvicenzo/new-tabs-at-end --enable-squash-merge --enable-merge-commit=false \
     --enable-rebase-merge=false --delete-branch-on-merge --enable-wiki=false
   ```
   Proteção de branch fica de fora: em repositório privado no plano gratuito não está disponível, e o `rubocop-vicenzo` também não usa.
7. **Ativar o hook localmente:** `git config core.hooksPath .githooks`.

## Verificação

- `gh repo view bvicenzo/new-tabs-at-end --json visibility,defaultBranchRef,squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,deleteBranchOnMerge,hasWikiEnabled` retorna `PRIVATE`, `master`, só squash, apagar branch ligado e wiki desligada.
- `git log --format='%s%n%b' -1` mostra `chore: bootstrap repository`, sem linha de co-autoria.
- `git commit --allow-empty -m "wrong message"` é rejeitado pelo hook. Depois de testar, nada fica commitado.
- `git check-ignore plans/02-test-skills.md` confirma que o arquivo está ignorado.
- `ls` em `new-tabs-at-end/` não mostra mais `background.js` nem `manifest.json` do rascunho.
