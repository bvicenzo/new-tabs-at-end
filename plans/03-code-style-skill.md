# Plano 03 — Skill de code style TypeScript no `new-tabs-at-end`

## Contexto

O estilo que mais importa para você é a **regra de quebra de linha** do `rails-code-style`. Ela está na seção "Method Chaining" e inclui a regra "A call on a receiver is a chain". A ordem de decisão é:

1. cabe em uma linha → fica em uma linha;
2. quebrar a cadeia primeiro;
3. extrair com nome de domínio;
4. só então quebrar argumentos.

Hoje isso existe só para Ruby. O Prettier faz o contrário (ADR 0004), então em TypeScript isso precisa de uma skill que ensine a regra a quem escreve o código, humano ou agente. O que puder ser checado automaticamente vira regra ESLint no plano 04. A skill cobre o que o lint não alcança, principalmente a **ordem** das decisões.

A skill nasce **dentro do projeto** (`.claude/skills/`), como as regras de lint (ADR 0003): amadurece aqui e pode ser extraída depois.

## Decisões

- **Nome e lugar:** `.claude/skills/typescript-code-style/SKILL.md`, commitada no repositório, em inglês. É skill de projeto e só é carregada em sessões abertas dentro de `new-tabs-at-end/`.
- **Escolhas de estilo (respondidas agora):**
  - ponto e vírgula **sempre**;
  - **sem** vírgula final em listas quebradas na vertical (igual ao Ruby);
  - operador (`+`, `&&`, `||`, `??`, `?`/`:`) **no início** da linha de continuação;
  - aspas **simples**, e template literal só quando há interpolação.
- **Limite:** 120 colunas, sem limite "duro" separado. URLs e comentários longos ficam isentos, espelhando o `AllowedPatterns` do `style.yml`.
- **Fica de fora** porque não se aplica a TS:
  - heredoc e `.squish`;
  - `do/end` vs `{}`;
  - `if`/`unless` no fim da linha;
  - memoização com `defined?`;
  - query methods de atributo do Rails;
  - formatos de data por locale;
  - `CustomCops/CurrentTimeOnAttributes`.
- **Fonte:** `rails-code-style/SKILL.md` na versão mais recente, seções "Core Principle", "Layout/LineLength decision tree", "Method Chaining" (com "A call on a receiver is a chain"), "Lambda/Proc Blocks in Parameters", "Variable Naming" e "Long Strings".

## Conteúdo da skill

1. **Regra de uma linha.** Se cabe em 120 colunas, é obrigatório ficar em uma linha. Nunca usar `--fix` nem formatador para resolver comprimento de linha: aplica-se a árvore de decisão à mão.
2. **Árvore de decisão para linhas com mais de 120 colunas,** na ordem:
   1. **Cadeias, e toda chamada com receptor é uma cadeia:** `object.method(…)`, `chrome.tabs.move(…)`, `expect(x).toEqual(…)`, `promise.then(…)`. Antes de terminar uma linha em `(`, verificar se há receptor. Se houver, quebra-se **entre o receptor e a chamada**, com cada elo em sua linha começando por `.`, e os argumentos e callbacks ficam inline se couberem.
   2. **Ainda grande depois de reorganizar:** extrair para `const` com nome de domínio, ou para uma função ou método privado nomeado, e usar a forma abreviada de objeto (`{ tabId, index }`) quando o nome da variável é igual ao da chave.
   3. **Só então** quebrar argumentos na vertical, um por linha, sem vírgula final. É o caminho direto para chamada **sem receptor** (`buildTab(…)`, `defineConfig(…)`).
   4. **Strings longas:** extrair para `const` com nome de domínio; se ainda não couber, partir em fragmentos concatenados com `+` no início de cada linha de continuação.
   5. **Expressões booleanas e ternários longos:** primeiro extrair as partes para `const` com nome de domínio; se ainda for preciso quebrar, o operador vai no início da linha.
3. **Arrow functions em argumentos:** corpo de expressão inline quando cabe. Corpo em bloco só para várias instruções. Dentro de uma cadeia, o callback fica inline depois que a cadeia foi quebrada (é o equivalente TS de "Blocks: `{}` vs `do/end`" e "Lambda/Proc Blocks").
4. **Nomes semânticos:** nada de `result`, `data`, `response`, `value`, `index`, `key` fora de código genérico. Parâmetros de callback com nomes descritivos e pelo menos 3 letras (`tabs.filter((tab) => …)`, nunca `(t) => …`). Isso espelha `Vicenzo/Naming/ShortName` e `Naming/BlockParameterName: MinNameLength: 3`.
5. **Pontuação** conforme as escolhas acima, com exemplo curto de cada uma.
6. **O que o lint verifica e o que fica com você:** uma tabela que o plano 04 completa com o nome das regras. A **ordem** de decisão (reorganizar antes de extrair, extrair antes de quebrar argumentos) não é verificável por lint e é a razão de existir da skill.

Cada regra tem um par ❌/✅ em TypeScript tirado do domínio da extensão (abas, grupos, configuração), não de Rails.

## Arquivos

- **Criar** `.claude/skills/typescript-code-style/SKILL.md`, com frontmatter `name` e `description` e os gatilhos: escrever ou editar `*.ts` neste projeto, quebrar linha longa, nomear variável.
- **Criar** `CLAUDE.md` na raiz do projeto, curto, com:
  - a regra de idioma: código, docs e commits em inglês, e `plans/` em pt-BR;
  - o apontamento para as skills: `typescript-code-style` para todo `.ts`, e `specify-behavior` com `write-tests` para testes;
  - onde ficam as decisões (`docs/decisions/`) e os planos (`plans/`);
  - commits em Conventional Commits, sem trailer de co-autoria de IA.
- **Commitar junto** `plans/03-code-style-skill.md` (este plano) e `plans/06-extension-findings.md` (já escrito).

## Passos

1. No `new-tabs-at-end`: `git switch -c docs/typescript-code-style-skill`.
2. Escrever a skill e o `CLAUDE.md`, e copiar este plano para `plans/03-code-style-skill.md`.
3. Commit `docs: add typescript code style skill`. É do tipo `docs` porque não muda comportamento da extensão nem dispara release.
4. Push e PR com o template do repositório, atribuído a `bvicenzo`, sem linha de geração por IA. O merge fica com você.

## Verificação

- **Uma revisão independente com um agente novo,** que não viu esta conversa. Ele recebe só o caminho do `SKILL.md` e cinco trechos TS com mais de 120 colunas, sem a resposta esperada:
  - uma chamada com receptor cujos argumentos cabem depois de quebrar;
  - uma cadeia de `filter`/`map` com callback;
  - uma chamada sem receptor com objeto grande;
  - uma condição booleana longa;
  - uma string longa.

  A saída dele tem que seguir a ordem de decisão. Para cada trecho comparo com o que a skill prescreve, e qualquer divergência vira ajuste de redação na skill antes do commit.
- **Os exemplos ✅ da skill obedecem à própria skill:** nenhum ultrapassa 120 colunas, nenhum tem vírgula final em multilinha, todos com ponto e vírgula e aspas simples. Isso é conferido com um script `awk`/`grep` sobre os blocos de código TS do arquivo.
- **A skill é reconhecida:** uma sessão do Claude Code aberta em `new-tabs-at-end/` lista `typescript-code-style` entre as skills. Você confere ao abrir a próxima sessão no projeto, porque esta sessão roda fora dele.
