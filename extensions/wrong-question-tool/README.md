# Wrong Question Tool

OpenClaw tool plugin for the `wrong-question` skill domain. It registers one
tool, `wrong_question_plan`, which validates structured input with the existing
`parseWrongQuestion()` implementation and returns the deterministic plan from
`buildWrongQuestionWritePlan()`.

The tool never writes files, reads credentials, calls the network, or performs
an archive action. It only returns a plan for a later, separately authorized
writer.

## Build

From a clean checkout, build before installing:

```bash
cd extensions/wrong-question-tool
npm ci --ignore-scripts
npm run build
```

`node_modules/` and `dist/` are local, ignored build artifacts. A clean
checkout contains neither; `npm ci --ignore-scripts` installs the locked
TypeScript compiler and official OpenClaw SDK declarations from
`package-lock.json` without running dependency install scripts, and `npm run
build` produces the runtime entry that OpenClaw loads. Do not install the
plugin before the build step completes.

From the repository root, `npm run ci` installs this package's locked
dependencies automatically (with dependency install scripts skipped) before
building and testing. The root `npm ci` stays limited to the root dependencies
and does not install the OpenClaw runtime there.

The build uses the repository TypeScript configuration. It compiles both this
package's `src/` and `skills/wrong-question/src/` into the local `dist/` tree,
so the installed package contains the domain code it needs and does not
reference a developer-specific absolute path.

`npm test` rebuilds first as a build check, then runs
`tests/wrong-question/plugin.test.mjs`. The test file imports the TypeScript
registration source directly, so it can also be run from the repository root
without a prior plugin build:

```bash
cd ../..
npm ci
node --import tsx --test tests/wrong-question/plugin.test.mjs
```

The package metadata intentionally ships:

- `dist/` (including the compiled `wrong-question` domain)
- `openclaw.plugin.json`
- `README.md`

## Install

Build first, then install the package directory into the OpenClaw
`2026.7.1-2` runtime:

```bash
cd ../..
openclaw plugins install --link ./extensions/wrong-question-tool
```

The runtime entry is
`./dist/extensions/wrong-question-tool/src/index.js`. The plugin declares
`openclaw` `2026.7.1-2` as a peer dependency and declares plugin API
compatibility as the exact base version `2026.7.1`. OpenClaw normalizes
numeric runtime correction suffixes such as `-2` before comparing plugin API
ranges, so declaring the exact `2026.7.1-2` string does not match its own
normalized `2026.7.1-2` runtime. The exact base version matches that runtime
without claiming compatibility with later plugin API revisions.

The plugin uses only the official `openclaw/plugin-sdk/plugin-entry`
registration surface.

Build dependencies are `typescript`, `openclaw` (for the official SDK types),
and `typebox` (resolved by the SDK declarations). The plugin has no additional
runtime package dependency.

The `wrong-question` skill instructions are not installed by this package.
Install `skills/wrong-question/SKILL.md` into the target agent workspace using
the OpenClaw skill installation mechanism supported by that runtime.

## Tool contract

Input:

```json
{
  "archive": true,
  "question": { "subject": "高数", "...": "..." }
}
```

`archive` must be the literal boolean `true`; strings, numbers, missing values,
and `false` are rejected. Validation or planning failures return only the
generic error `INVALID_INPUT` and never echo the submitted question content.
