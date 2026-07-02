<p align="center">
  <img src="assets/logo.jpg" width="220" alt="Manbun, the architecture astronaut">
</p>

<h1 align="center">Manbun</h1>

<p align="center">
  <em>He sees the big picture. He writes 200 lines. It still works.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/code%20bloat-10~30x-ff6b6b?style=flat-square" alt="10-30x code bloat">
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
├── interfaces/ICounterState.ts
├── types/CounterAction.ts
├── implementations/CounterReducer.ts
├── factories/CounterActionFactory.ts
├── config/CounterConfig.ts
├── context/CounterContext.tsx
├── exceptions/CounterExceptions.ts
└── components/Counter.tsx
```

180 lines, 8 files, 5 design patterns. The button still adds 1.

More architecture in [examples/](examples/).

## Numbers

Measured on the same tasks, same model (Claude Haiku 4.5, temperature 1).
All code still passes the original tests.

| Example | Clean LOC | Manbunned LOC | Bloat Ratio | Files Added | Patterns Used |
|---|--:|--:|--:|--:|---|
| [Counter](examples/counter.md) | 14 | ~180 | 13x | 7 extra | Reducer, Factory, Context, Provider, Union Types |
| [Debounce](examples/debounce.md) | 10 | ~155 | 15x | 4 extra | Strategy, DI, Exception Hierarchy, Config |
| [Email Validation](examples/email-validation.md) | 4 | ~130 | 33x | 5 extra | Chain of Responsibility, Factory, Singleton, ABC |

**~10-30x more code · ~5-10x more files · ~5 design patterns per task · still works**

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
| **full** | Full enterprise: Factory + Strategy + Observer + Exception hierarchy + logging middleware. 1 → 7-15 files. Default. |
| **ultra** | FAANG-scale: + event sourcing + CQRS + feature flags + metrics + i18n. 1 → 15-30 files. ~10-30x code. |

```bash
export MANBUN_DEFAULT_MODE=ultra  # go big or go home
```

## Installation

### Claude Code (recommended)

```bash
# Register as a local plugin
claude plugins add .

# Or set mode manually
export MANBUN_DEFAULT_MODE=full
```

Then just talk to Claude. Manbun activates on every session start.

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
| LOC impact | -54% (up to -94%) | +1,000% to +3,000% |
| File impact | Fewest possible | Most defensible |
| Design patterns | Avoids them | All of them |
| Safety | Never cuts validation, security | Never cuts functionality, tests |
| Tagline | "He says nothing. He writes one line. It works." | "He sees the big picture. He writes 200 lines. It still works." |

Same coin, opposite sides. Pick your fighter.

## Examples

- [Counter](examples/counter.md) — React/TS: 14 → 180 lines
- [Debounce](examples/debounce.md) — TypeScript: 10 → 155 lines
- [Email Validation](examples/email-validation.md) — Python: 4 → 130 lines

## License

MIT
