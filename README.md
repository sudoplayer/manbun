<p align="center">
  <img src="assets/logo.jpg" width="220" alt="Manbun, the architecture astronaut">
</p>

<h1 align="center">Manbun</h1>

<p align="center">
  <em>He sees the big picture. He writes 200 lines. It still works.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/code%20bloat-30~80x-ff6b6b?style=flat-square" alt="30-80x code bloat">
  <img src="https://img.shields.io/badge/design%20patterns-all%20of%20them-764ba2?style=flat-square" alt="All design patterns">
  <img src="https://img.shields.io/badge/still%20works-yes-4ecdc4?style=flat-square" alt="Still works">
  <img src="https://img.shields.io/badge/license-MIT-111111?style=flat-square" alt="MIT license">
</p>

---

You know him. Neat manbun. Standing desk. Has "SOLID" tattooed somewhere. You show him fourteen lines of clean React; he looks at them, says "have you considered the strategy pattern," and replaces them with eight files.

Manbun puts him inside your AI agent.

## Before / after

You ask for a counter. Your agent writes 14 lines of React with `useState`.

With manbun:

```
src/counter/
├── interfaces/   (ICounterState, ICounterOperation, ICounterStrategy, ICounterObserver, ICounterService, ICounterProps, ICounterConfig)
├── strategies/   (IncrementStrategy, DecrementStrategy, ResetStrategy, CounterStrategyFactory)
├── services/     (CounterService)
├── observers/    (CounterEventBus, CounterLogger)
├── builders/     (CounterBuilder — fluent API)
├── factories/    (CounterFactory)
├── config/       (CounterConfig)
├── exceptions/   (CounterException, CounterOverflowException, CounterUnderflowException)
└── components/   (Counter, CounterDisplay, CounterButton)
```

~540 lines, 23 files, 5 design patterns. The button still adds 1.

More architecture in [examples/](examples/).

## Numbers

Measured on the same tasks, same model (DeepSeek V4 Pro). Ponytail disabled to prevent cross-contamination. All code still passes the original tests.

| Example | Clean LOC | Manbunned LOC | Bloat Ratio | Files Added | Patterns Used |
|---|--:|--:|--:|--:|---|
| [Counter](examples/counter.md) | 13 | ~540 | 42x | 22 extra | Strategy, Observer, Builder, Factory, Context, Provider |
| [Debounce](examples/debounce.md) | 22 | ~930 | 42x | 15 extra | Strategy, Observer, Factory, Config, DI, Exception Hierarchy |
| [Email Validation](examples/email-validation.md) | 18 | ~1,200 | 67x | 21 extra | Chain of Responsibility, Strategy, Factory, Builder, Observer, Decorator |
| [FizzBuzz](examples/fizzbuzz.md) | 7 | ~560 | 79x | 21 extra | Strategy, Chain of Responsibility, Factory, Adapter, Exception Hierarchy |
| [Todo API GET](examples/todo-api.md) | 19 | ~560 | 30x | 14 extra | Repository, Service, Controller, Factory, DTO, Mapper, Builder, HATEOAS |

**~30-80x more code · ~15-22x more files · ~5-7 design patterns per task · still works**

> Verified 2026-07-03 with deepseek-v4-pro, ponytail plugin disabled, manbun-only (full intensity). 

## How it works

Before writing code, the agent climbs every rung of the architecture ladder:

```
1. Does this need an interface?     → every concrete class deserves one (LSP)
2. Does this need a factory?        → DI container needs factories (OCP)
3. Can this be split into more files? → SRP: one reason to change per file
4. Is every dependency injected?    → `new` in a method is a testing antipattern
5. Does the stdlib need a wrapper?  → your own thin layer gives control
6. Can config be externalized?      → no magic values in logic
7. Does error handling form a hierarchy? → custom exceptions, not raw try/catch
8. Is there a design pattern for this?   → GoF named it, use it
9. Can we add a layer?              → Controller → Service → Repository → DTO
10. Only then: write the code across the full file tree
```

**The rule was never "most lines."** It is: add every abstraction that the Gang of Four blessed, and never break a test. The code ends up large because it is thorough, not sloppy. Higher maintenance cost and slower onboarding are unavoidable side effects of true enterprise readiness.

## Safety

Every manbunned example:
- **Compiles** — no broken imports, no type errors
- **Runs** — the button clicks, the API returns, the validation passes
- **Passes the original tests** — behavior is preserved

What changes:
- **Files** — one becomes many
- **Complexity** — anyone onboarding needs a whiteboard
- **Design patterns** — all of them
- **Maintainability** — technically extensible, practically illegible

Never compromised: functional correctness, input validation, error handling, security, accessibility, existing tests.

## Intensity

| Level | What changes |
|-------|-------------|
| **lite** | Interfaces + DI + Config. Every function → class. 1 → 3-5 files. ~3-5x code. |
| **full** | Full enterprise: Factory + Strategy + Observer + Exception hierarchy + logging middleware. 1 → 15-23 files. ~30-80x code. Default. |
| **ultra** | FAANG-scale: + event sourcing + CQRS + feature flags + metrics + i18n. 1 → 30-50 files. ~80-200x code. |

```bash
export MANBUN_DEFAULT_MODE=ultra  # go big or go home
```

In a Claude Code session: `/manbun lite`, `/manbun full`, or `/manbun ultra`. For a persistent default without exporting each time, use `~/.config/manbun/config.json` — e.g. `{"defaultMode": "ultra"}`.

## Installation

The Claude Code plugin runs two tiny Node.js lifecycle hooks, so `node` needs to be on your PATH (note for Nix/nvm users: it must be on the non-interactive shell's PATH). If it isn't, the skills still work; the always-on activation just stays quiet instead of erroring on every prompt.

### Claude Code

```
/plugin marketplace add sudoplayer/manbun
/plugin install manbun@manbun
/reload-plugins
```

Then `/clear` or start a new session. Review and trust the lifecycle hooks in `/hooks` if prompted.

### Status line (optional badge)

Manbun activates on every session start even without this step. The status line is only a small badge in the Claude Code footer (e.g. `[MANBUN]` or `[MANBUN:ULTRA]`) so you can see which mode is active.

Claude Code does **not** configure this automatically. Add a `statusLine` entry to `~/.claude/settings.json` (create the file if it does not exist). Replace `<version>` with the folder name under your plugin cache — check with:

```bash
ls ~/.claude/plugins/cache/manbun/manbun/
```

Example (Linux/macOS):

```json
"statusLine": {
  "type": "command",
  "command": "bash \"$HOME/.claude/plugins/cache/manbun/manbun/<version>/hooks/manbun-statusline.sh\""
}
```

On Windows, point `command` at `manbun-statusline.ps1` instead (PowerShell `-File "..."`).

Quick check after saving:

```bash
bash "$HOME/.claude/plugins/cache/manbun/manbun/<version>/hooks/manbun-statusline.sh"
```

You should see `[MANBUN]`. Restart Claude Code or start a new session for the footer badge to appear.

When you upgrade the plugin, update `<version>` in that path to match the new cache folder.

### Any AI Agent

Drop `AGENTS.md` into your project root. Any agent that reads project instructions picks it up.

### Deactivation

Say **"shave the manbun"** or **"simple mode"** at any time.

## Manbun vs Ponytail

| | [Ponytail](https://github.com/DietrichGebert/ponytail) | Manbun |
|---|---|---|
| Persona | Lazy senior dev, ponytail, says nothing | Architecture astronaut, manbun, never stops talking |
| Goal | Least code that works | Most architecture that still works |
| Ladder | 6 rungs, top wins | 9 rungs, climb them all |
| LOC impact | -54% (up to -94%) | +3,000% to +8,000% |
| File impact | Fewest possible | Most defensible |
| Design patterns | Avoids them | All of them |
| Safety | Never cuts validation, security | Never cuts functionality, tests |
| Tagline | "He says nothing. He writes one line. It works." | "He sees the big picture. He writes 200 lines. It still works." |

Same coin, opposite sides. Pick your fighter.

## Examples

- [Counter](examples/counter.md) — React/TS: 13 → ~540 lines (42x)
- [Debounce](examples/debounce.md) — TypeScript: 22 → ~930 lines (42x)
- [Email Validation](examples/email-validation.md) — Python: 18 → ~1,200 lines (67x)
- [FizzBuzz](examples/fizzbuzz.md) — TypeScript: 7 → ~560 lines (79x)
- [Todo API GET](examples/todo-api.md) — Express/TS: 19 → ~560 lines (30x)

## License

MIT
