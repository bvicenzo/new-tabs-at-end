# Plano 04 — Lint: portar o `rubocop-vicenzo` e o `style.yml` para ESLint

## Contexto

O projeto vai validar se o seu estilo Ruby se transporta para TypeScript (ADR 0003). Este plano monta o ferramental de TS, lint e testes, configura as regras prontas que equivalem ao `style.yml`, e escreve como plugin local (`eslint-plugin-vicenzo/`) as cops que fazem sentido sem `let`/`subject`.

Inclui também uma regra **nova**, que o RuboCop nunca conseguiu impor: "se cabe em uma linha, tem que ficar em uma linha".

O código da extensão ainda não existe (plano 06). Por isso as regras são provadas pelos próprios testes, e o primeiro consumidor real será o plano 06.

## Decisões tomadas

- **TypeScript fixado em 6.0.x.** O `typescript-eslint` 8.72, inclusive o canary, só aceita `>=4.8.4 <6.1.0`, e o TS 7 (o compilador nativo) ainda não é suportado. Fica registrado na ADR 0005, com a condição para subir: o `typescript-eslint` passar a aceitar o 7.
- **`Metrics/AbcSize` não tem regra própria.** Fica só `complexity: 7`, equivalente ao `CyclomaticComplexity` padrão do RuboCop.
- **`Naming/PredicatePrefix` não é portado.** Em TS, `isX`/`hasX` é o idioma da linguagem. Diferença intencional registrada na ADR 0006.
- **Não são portadas as cops que dependem de `let`/`subject`** (ADR 0004):
  - CompetingSubjects, DerivedPremises, LetAliasingSubject, LetIsMethodResult;
  - MutatedPremises, Nested{Let,Subject}Redefinition, SubjectDefinedAsLet;
  - SubjectIsMethodResult, TopLevel{Let,Subject}.

  `ReturnedChain` não é cop, é um helper delas.
- **`TopLevelHook` sai por estar coberta por algo mais estrito:** `vitest/no-hooks` proíbe hooks em qualquer nível, que é o que a ADR 0004 pede.
- **Os testes das regras não usam o `RuleTester`.** Ele é dirigido por tabela (`valid: […]`, `invalid: […]`), justamente o que a nossa `dynamic-example-generation` proíbe. Cada regra é testada com `describe`/`context`/`it` explícitos, a partir da árvore da `specify-behavior`, com um helper em `test/support/` que roda o `Linter` do ESLint sobre um trecho de código.
- **Ferramental:**

  | Ferramenta | Versão |
  | --- | --- |
  | Node | 26 (`.node-version`) |
  | npm | — |
  | ESLint | 10.x |
  | `typescript-eslint` | 8.72 |
  | `@stylistic/eslint-plugin` | 5.10 |
  | `@vitest/eslint-plugin` | 1.6 |
  | Vitest / `@vitest/coverage-v8` | 5.1 |
  | TypeScript | 6.0.3 |

## Mapeamento (vira a ADR 0006)

### Regras prontas, só configuração

| Origem | ESLint |
| --- | --- |
| `Layout/LineLength` 120, comentários permitidos | `@stylistic/max-len` 120, `ignoreComments`, `ignoreUrls` |
| Indentação fixa, consistente | `@stylistic/indent` 2 |
| Escolhas do plano 03 | `@stylistic/semi` always · `quotes` single (`avoidEscape`) · `comma-dangle` never · `operator-linebreak` before · `dot-location` property |
| `Multiline{Method,Array,Hash}*LineBreaks`, `*BraceLayout` | `function-call-argument-newline` consistent · `function-paren-newline` multiline-arguments (permite o argumento único colado aos parênteses, decidido no plano 03) · `array-bracket-newline`/`array-element-newline` consistent · `object-curly-newline` consistent · `object-property-newline` · `multiline-ternary` always-multiline |
| Linha em branco depois dos `const` extraídos (skill) | `@stylistic/padding-line-between-statements` |
| `Style/Lambda` literal | `prefer-arrow-callback`, `arrow-body-style` as-needed |
| `Metrics/MethodLength` 20 | `max-lines-per-function` 20 (sem linhas em branco nem comentários) em `src/` |
| `Metrics/ClassLength`/`ModuleLength` 200 | `max-lines` 200 (sem linhas em branco nem comentários) |
| `CyclomaticComplexity` (padrão do RuboCop) | `complexity` 7 |
| `BlockLength` com `Exclude: spec/**` | `max-lines-per-function` desligado em arquivos de teste |

Bases de regras:
- `@eslint/js` recommended;
- `typescript-eslint` `recommendedTypeChecked`, com `projectService`. Ele traz `no-floating-promises`, essencial para a API `chrome.*`, que é assíncrona;
- `no-unused-vars` com `^_` ignorado, como o `_isbn` do Ruby;
- `@vitest/eslint-plugin` recommended, mais `no-hooks`, `consistent-test-it` (`it`) e `require-top-level-describe`.

**Diferenças conhecidas:**
- o ESLint não tem `CountAsOne`;
- não há AbcSize;
- não há `PredicatePrefix`.

### Regras próprias em `eslint-plugin-vicenzo/`

Cada regra adapta para o Vitest a semântica levantada da cop: as formas de AST, as exceções e as specs.

**Estrutura de testes**, aplicadas a `**/*.test.ts`:

| Regra | Origem | Adaptação |
| --- | --- | --- |
| `context-wording` | `RSpec/ContextWording` | prefixos `when/with/without/and/but` |
| `nested-context-improper-start` | idem | proíbe `when/with/without` em `context` dentro de `context`; sugere `and`/`but` |
| `unnested-context-improper-start` | idem | proíbe `and/but` em `context` de primeiro nível; opção `forbiddenPrefixes` |
| `describe-inside-context` | idem | `.skip`/`.only` contam como o mesmo tipo de bloco |
| `inconsistent-sibling-structure` | idem | `it.todo` conta como exemplo; `test` também |
| `top-level-context`, `top-level-example` | idem | o escopo do módulo também conta como topo |
| `conditional-in-spec` | idem | `if`, ternário **e `switch`**. O `case` do Ruby escapava da cop; aqui fecha essa lacuna |
| `iteration-inside-example` | idem | `forEach`, `for`, `for…of`, `while` com `expect`/`expect.soft` dentro de um `it` |
| `dynamic-example-generation` | idem | `describe/it/test/context.each` e laços cujo callback registra grupos, exemplos ou hooks |
| `leaky-definition` | idem | nova justificativa (ADR 0004): nada de `function`, `class`, `type`, `interface`, `enum` ou variável fora de um `it`; ficam isentos os imports e as fábricas do `vi.mock` |
| `example-length` | `RSpec/ExampleLength` 20 | `CountAsOne`: array, objeto e chamada em várias linhas contam como uma linha |

**Código:**

| Regra | Origem | Adaptação |
| --- | --- | --- |
| `multiline-method-call-line-breaks` | `Layout/MultilineMethodCallLineBreaks` | cadeia quebrada é tudo ou nada; exceção para a chamada cujos próprios argumentos causam a quebra; atravessa `?.`, `!` e `as` |
| `short-name` | `Naming/ShortName` + `BlockParameterName` 3 | nome com 3 letras ou mais, sem contar `_`, em variáveis, parâmetros e variáveis de `for`. Ficam isentos os nomes só com `_`, o `catch` e nomes usados em shorthand de objeto ou de desestruturação no mesmo escopo |
| `anonymous-unused-name` | `Naming/AnonymousUnusedName` | `_`/`__` em parâmetros, desestruturação e `catch`; buracos de array (`[, b]`) são permitidos |
| `catch-error-name` | `RescuedExceptionsVariableName: error` | `catch (error)` |
| `prefer-single-line` | **nova** — a regra de uma linha | ver abaixo |

**`prefer-single-line` (experimental).** Sinaliza uma chamada, cadeia, array, objeto ou condição quebrada em várias linhas quando a forma em uma linha caberia em 120 colunas, contando a indentação real. Não sinaliza:
- o que tem comentário dentro;
- função com corpo de várias instruções;
- template literal com quebra de linha;
- quebra exigida por outra regra.

Se alguma parte não puder ser imposta com confiança, isso vira achado documentado no README do plugin, e não uma regra frouxa.

## Pré-condição: as skills de teste carregadas

Toda regra própria nasce com testes unitários, e esses testes são escritos com `specify-behavior` e `write-tests`. Hoje as duas resolvem: as duas aparecem na lista desta sessão. Porém a versão delas com suporte a Vitest ainda não foi publicada, e uma troca de versão pode tirá-las do ar.

Por isso, no início de cada fase:
- conferir que `~/.claude/skills/specify-behavior/SKILL.md` e `~/.claude/skills/write-tests/references/vitest.md` existem;
- conferir que as duas aparecem na lista de skills da sessão.

## Fases (um PR por fase)

**Fase A — ferramental e configuração.** Arquivos:
- `package.json`, com os scripts `lint`, `test`, `test:coverage`, `typecheck` e `prepare` (`git config core.hooksPath .githooks`);
- `.node-version`;
- `tsconfig.json`;
- `vitest.config.ts` e `test/setup/context.ts`, adaptados dos assets da `write-tests` ao estilo do projeto (sem vírgula final);
- `eslint.config.ts`, com as regras prontas;
- o esqueleto do plugin: `eslint-plugin-vicenzo/index.ts`, `README.md` com a tabela de regras, e `test/support/lint.ts`, o helper que roda o `Linter`;
- as ADRs 0005 e 0006;
- a seção "Development" do README;
- a tabela "lint vs você" da skill `typescript-code-style`, preenchida com os nomes reais.

**Fase B — as 11 regras de estrutura de testes.**

**Fase C — as 5 regras de código.** A `prefer-single-line` fica por último.

**Ciclo por regra (B e C):** toda regra tem testes unitários, escritos **antes** da implementação.
1. `specify-behavior`, tendo como entrada a descrição em prosa da semântica da cop, com as decisões acima. Sai a árvore com `it.todo`;
2. `write-tests` preenche a árvore. Os testes rodam e falham, porque a regra ainda não existe;
3. implementação com `@typescript-eslint/utils` (`RuleCreator`);
4. passadas de verificação: verde e 100% de branches da regra.

Cada regra fica autocontida no plugin, sem importar nada de `src/`, para poder ser extraída depois (ADR 0003).

## Arquivos críticos

- `eslint.config.ts`: composição das bases, do `@stylistic`, das regras core e do plugin local. Regras de teste aplicadas só a `**/*.test.ts`.
- `eslint-plugin-vicenzo/rules/<regra>.ts` e `eslint-plugin-vicenzo/test/rules/<regra>.test.ts`.
- `.claude/skills/typescript-code-style/SKILL.md`: a seção "What the linter checks" passa a nomear as regras.
- `docs/decisions/0005-pin-typescript-6-for-typescript-eslint.md`, `docs/decisions/0006-lint-mapping-from-rubocop-vicenzo.md`.
- `plans/04-lint-rules.md`: cópia deste plano.

## `however` sai do vocabulário — issue no `rubocop-vicenzo`

`however` aparece em três lugares do `rubocop-vicenzo`:
- `NestedContextImproperStart` sugere `however` na mensagem (`nested_context_improper_start.rb:25`);
- `UnnestedContextImproperStart` o proíbe por padrão (`DEFAULT_FORBIDDEN_PREFIXES`, `config/default.yml:239`);
- a documentação das duas cops.

Já o `RSpec/ContextWording` do `style.yml` não o aceita. Como você nunca usa `however`, só `but`:

- **No porte:** `however` não existe. `nested-context-improper-start` sugere só `and`/`but`; o padrão de `unnested-context-improper-start` é `and`/`but`; `context-wording` aceita `when/with/without/and/but`.
- **No `rubocop-vicenzo`:** abrir uma issue em `bvicenzo/rubocop-vicenzo` (passo 0 da fase A) propondo tirar `however` da mensagem da `NestedContextImproperStart`, do `DEFAULT_FORBIDDEN_PREFIXES` e do `default.yml` da `UnnestedContextImproperStart`, e da documentação. A issue cita os arquivos e linhas acima e a inconsistência com o `ContextWording`. Nada é alterado no gem por este plano.

## Verificação

- **Em cada PR:** `npm run lint`, `npm test`, `npm run typecheck` e `npm run test:coverage` verdes, com 100% de branches em cada arquivo de `eslint-plugin-vicenzo/rules/`.
- **Fase A:** um arquivo temporário com violações de cada regra pronta (linha com 121 colunas, aspas duplas, vírgula final, operador no fim da linha, `it` solto no módulo, `beforeEach`) faz `npm run lint` falhar apontando cada uma; o arquivo é apagado em seguida. O lint também passa sobre o próprio plugin e as configurações.
- **Fases B e C:** os exemplos ❌/✅ da skill `typescript-code-style` e do `references/vitest.md` da `write-tests`, colocados num arquivo temporário, produzem exatamente as violações esperadas: os ❌ sinalizados, os ✅ limpos. Isso mostra que lint e skill concordam.
- **Revisão independente:** um agente novo revisa o diff das fases B e C contra a semântica das cops, recebendo os arquivos e não as minhas conclusões.
- **Sem CI ainda** (plano 05): os PRs são validados localmente, e o CI passa a rodar esses mesmos scripts.
