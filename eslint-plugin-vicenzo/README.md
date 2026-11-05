# eslint-plugin-vicenzo

Local ESLint plugin porting the author's Ruby style ([rubocop-vicenzo](https://github.com/bvicenzo/rubocop-vicenzo))
to TypeScript and Vitest. It lives in this repository on purpose and is meant to be extracted once mature
(see `docs/decisions/0003-lint-rules-live-in-this-repository.md`), so it never imports from `src/`.

## Rules

| Rule | Port of | Status |
| --- | --- | --- |
| `context-wording` | `RSpec/ContextWording` | done |
| `nested-context-improper-start` | `Vicenzo/RSpec/NestedContextImproperStart` | done |
| `unnested-context-improper-start` | `Vicenzo/RSpec/UnnestedContextImproperStart` | done |
| `describe-inside-context` | `Vicenzo/RSpec/DescribeInsideContext` | done |
| `inconsistent-sibling-structure` | `Vicenzo/RSpec/InconsistentSiblingStructure` | done |
| `top-level-context` | `Vicenzo/RSpec/TopLevelContext` | done |
| `top-level-example` | `Vicenzo/RSpec/TopLevelExample` | done |
| `conditional-in-spec` | `Vicenzo/RSpec/ConditionalInSpec` | done |
| `iteration-inside-example` | `Vicenzo/RSpec/IterationInsideExample` | done |
| `dynamic-example-generation` | `Vicenzo/RSpec/DynamicExampleGeneration` | done |
| `leaky-definition` | `Vicenzo/RSpec/LeakyDefinition` | done |
| `example-length` | `RSpec/ExampleLength` | done |
| `multiline-method-call-line-breaks` | `Vicenzo/Layout/MultilineMethodCallLineBreaks` | done |
| `short-name` | `Vicenzo/Naming/ShortName`, `Naming/BlockParameterName` | done |
| `anonymous-unused-name` | `Vicenzo/Naming/AnonymousUnusedName` | done |
| `catch-error-name` | `Naming/RescuedExceptionsVariableName` | done |
| `prefer-single-line` | — new: the one-line rule | done, experimental |

## How each rule adapts its cop

Shared ground, from `utils/test-blocks.ts`: a call's kind (describe, context, example, hook) is decided by the
identifier at the root of its callee, so Vitest's modifiers (`skip`, `only`, `todo`, `concurrent`, `sequential`,
`fails`, `shuffle`, also read as `['only']`), tables (`each`, `for`, array or tagged template) and conditions
(`skipIf`, `runIf`) keep the root's kind; `suite` is a describe and `test` an example. Any other member breaks the
chain — `context.onTestFinished(…)`, `context.expect(…)` and `test.extend(…)` are not test blocks — and so does a
root shadowed by a parameter or a local declaration, such as Vitest's test context passed as `(context) => …`. The
callback of a block is its first function argument. A node is inside a group only through the group's callback, never
through its title. The inner call of a table (`describe.each(table)` in `describe.each(table)('title', fn)`) is a
table head and is skipped, so a table counts once.

- **context-wording** — every `context` starts with an allowed prefix (default `when`, `with`, `without`, `and`,
  `but`; option `prefixes` replaces them, at least one, none empty, case-insensitive). A prefix opens the title when
  the title starts with it and the next character does not continue its last word, so prefixes may have several
  words (`in case`) and `and` does not match `android`. Only literal titles are checked (a string, or a template
  without expressions) — unlike `RSpec/ContextWording`, an interpolated title is not checked even when its literal
  start would decide it.
- **nested-context-improper-start** — a `context` whose closest group is a `context` must not start with `when`,
  `with` or `without`; the message suggests `and` or `but`. No `however`.
- **unnested-context-improper-start** — a `context` whose closest group is a describe, or that has no group, must not
  start with `and` or `but` (option `forbiddenPrefixes` replaces them).
- **describe-inside-context** — a describe whose closest group is a `context`; a describe inside a non-group function
  (an example callback) within a context counts.
- **inconsistent-sibling-structure** — the direct children of a group (calls whose closest group is that group) mixing
  examples (`it.todo` included), describes and contexts; module scope is not evaluated; hooks are ignored.
- **top-level-context / top-level-example** — a context or example at module scope (including inside a function
  declared there) or directly in the outermost group. Overlaps with `vitest/require-top-level-describe` on purpose: the
  plugin must stand alone once extracted.
- **conditional-in-spec** — every `if`, ternary and `switch`, anywhere in a test file (Ruby's `case` escaped the cop;
  `switch` does not), plus conditional registration through `skipIf` / `runIf`. Not reported: `&&`, `||`, `??`, `?.`,
  logical assignments, `try/catch`, conditional types.
- **iteration-inside-example** — inside an example, an iteration whose body asserts (`expect(…)`, `expect.soft`,
  `expect.poll`). Iterations: `forEach`, `map`, `flatMap`, `every`, `some`, `for`, `for…of`, `for…in`, `while`,
  `do…while` — wider than the cop, which ignores `map`; `every` with an assertion silently checks only the first
  element. Callbacks passed by reference and computed members are not followed.
- **dynamic-example-generation** — any table applied to a test block (`.each` / `.for`, array or tagged template,
  reported once at the table), and any iteration whose body registers a test block or hook. `vitest/prefer-each`
  contradicts this rule and must never be enabled. Known gap: a tagged-template table stored in a variable before
  being called is not detected (see the pending example in its test).
- **leaky-definition** — re-justified for ES modules: a definition in a test file hides a premise outside the example
  that reads it. Reported: functions, classes, type aliases, interfaces, enums, namespaces and global/module
  augmentations anywhere in a test file, and variable declarations outside an example. Exempt: imports, re-exports,
  variables inside an example, and anything inside a `vi.mock` / `vi.doMock` factory (`vi.hoisted` is not exempt).
  Only the outermost leaking declaration is reported. Unlike the cop, which also flags a `def` inside an example,
  only variables are exempt inside one.
- **example-length** — an example body longer than `max` (default 20) counted lines. Blank and comment-only lines do
  not count; an array, object, call, `new` expression or template spanning several lines counts as one line, but the
  block body of a function passed to such a call counts line by line (otherwise `expect(() => { … })` would hide any
  length). A line counts once even when two folded constructs share it. Unlike RuboCop, which counts a block's `end`,
  the closing line of such a function body (`});`) is not counted.
- **multiline-method-call-line-breaks** — applies to every file. A chain is a head and its links: every method call
  on a member (`.query(…)`, `?.then(…)`) is a link; the head is what the first link is called on — an identifier or
  a property path (`chrome.tabs`), or a call that is not a link (`expect(x)`, `handlers[kind](tab)`). Property
  accesses after a call belong to the next link (`expect(x)` + `.not.toBe(y)`), and index accesses to the call
  before them; `!`, `as`, `satisfies` and optional chaining do not break a chain. A chain that ends on a later line
  than its head must start every link on its own line. The first link may stay on the head's line when one of its
  arguments is a function whose block body spans several lines (`tabs.forEach((tab) => {`); later links never may. The
  cop's exemption is wider — any arguments spanning lines — but the code style skill breaks the chain before the
  arguments (`chrome.tabs` / `.query({ … })`), so arguments broken for length do not exempt the link. Also unlike
  the cop: there is no autofix (line breaking is never left to `--fix`, see the code-style skill), so
  `IndentationWidth` is gone, and Ruby's `[]` exemption becomes index access, which is not a link at all. A
  property access that starts its own line inside a link (`.not` alone on a line) is not reported.
- **short-name** — applies to every file. Every variable and parameter the scope manager defines must spell at least
  `minNameLength` (default 3) characters, underscores not counted (`a_b` spells two, `_p` one); digits count. That
  covers `const`/`let`/`var`, destructured names, `for` variables, every kind of function parameter (default, rest,
  destructured, constructor parameter properties) and — beyond the cops, which never see types — the parameters of
  function types, method signatures and overloads. Not checked: names made only of underscores
  (`anonymous-unused-name`), caught errors (`catch-error-name`), and names that are not variables or parameters
  (functions, classes, enums, namespaces, imports, labels, type parameters, index-signature parameters, mapped-type
  keys). A name imposed from outside is allowed: a variable read into an object shorthand (`move({ id })`), one bound
  by a destructuring shorthand (`const { id } = tab`), and an ambient name (`declare const $`, anything inside
  `declare global { … }`, the parameters of a `declare function`). Unlike the
  cop, which looks for the keyword shorthand anywhere in the enclosing scope, the exemption follows the variable's own
  references, so another variable of the same name excuses nothing.
- **anonymous-unused-name** — applies to every file. A variable, parameter or caught error named only with underscores
  (`_`, `__`) is reported, naming what it is (`parameter`, `discarded value`, `caught error`). Parameters include
  rest, default, destructured and constructor parameter properties, and the parameters of type signatures. An array
  hole (`const [, author] = …`) declares nothing and is allowed, and so is an optional catch binding (`catch { … }`) —
  the way to ignore an error without naming it. Unlike the cop, which only sees multiple assignment, a plain
  `const _ = …` is reported too. Ruby's anonymous forwarding (`*`, `**`, `&`, `...`) has no counterpart.
- **catch-error-name** — applies to every file. The error bound by a catch clause is named `preferredName` (default
  `error`, from `style.yml`), or `_error` when the name starts with an underscore. As in the cop: a catch clause nested
  in the body of another is not checked (it cannot reuse the outer name), and neither is one that already uses the
  preferred name — reading it from outside, declaring it or taking it as a parameter inside — since renaming would
  redeclare or shadow it. A destructured error (`catch ({ message })`) and an
  optional catch binding are not checked. Unlike the cop, there is no autofix.
- **prefer-single-line** (experimental, no cop: RuboCop could never enforce it) — applies to every file. A call (and
  so a chain), a `new`, an array, an object, a logical or binary operation (a concatenation included) or a ternary
  broken over several lines is reported when its one-line form fits in `max` (default 120) columns, counting the text
  before it on its first line — the indentation included — and the code after it on its last line (a trailing comment
  does not count: comments are exempt from the line length). The one-line form
  joins the tokens in the project's spacing: `foo(a)`, `[1]`, `{ a: 1 }`, `{}`, `tabs.map(…)`, `a && b`. Constructs are
  weighed outermost first, and one inside a reported construct is not reported again; when the outer one does not fit,
  the inner one is still weighed. Never reported:
  - a construct holding a comment (joining would lose it) or a template literal that spans lines (joining would
    change its value);
  - a construct holding a block body with statements or a class body — statements stay on their own lines, even a
    single one (an empty block, `() => {}`, holds none and is joined);
  - a call that is a link inside a longer chain, and the left part of a run of one operator (`a && b` in
    `a && b && c`): a chain or a run is joined whole or not at all, which is what
    `multiline-method-call-line-breaks` requires. The head of a chain is not a link and is weighed on its own, and so
    is the left side of a different operator (`a && b` in `a && b || c`).

  Known gaps, left out rather than enforced loosely: a statement's own parentheses (`if (` broken around its
  condition), parameter lists, import and export specifiers, destructuring patterns, type literals and unions, and an
  arrow function whose expression body starts on the line after `=>`. Type arguments broken over lines are measured
  with a space inside the angle brackets (`Map< string, number >`), two columns more than their real form, because a
  token cannot tell a type bracket from a comparison: the rule may stay silent on such a construct, never wrongly
  report one.

## Testing a rule

Rules are tested with Vitest in the project's test style — explicit `describe`/`context`/`it`, no `RuleTester`
tables (a table of cases is what `dynamic-example-generation` forbids). `test/support/lint.ts` exposes
`lintWithRule(rule, code, ruleOptions)`, which lints a snippet as a `*.test.ts` file with only that rule module on
and returns ESLint's messages; `test/support/parse.ts` parses snippets for testing the shared utilities.

Rules apply to files by configuration (`eslint.config.ts` scopes test rules to `**/*.test.ts`), never by checking
the filename themselves.
