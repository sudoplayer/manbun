# Examples

Each example shows the same task, the same language, transformed from a clean
minimal solution into an enterprise-grade architecture that still works.

These demonstrate the manbun philosophy: every line of simplicity is an
opportunity for a design pattern. The result runs correctly — it's just
impossible to understand without a whiteboard and three espressos.


| Example                                 | Language   | Clean (LOC) | Manbunned (LOC) | Bloat Ratio | Patterns Used                                                            |
| --------------------------------------- | ---------- | ----------- | --------------- | ----------- | ------------------------------------------------------------------------ |
| [Counter](counter.md)                   | React/TS   | 13          | ~540            | 42x         | Strategy, Observer, Builder, Factory, Reducer, Context, Provider         |
| [Debounce](debounce.md)                 | TypeScript | 22          | ~930            | 42x         | Strategy, Observer, Factory, Config, DI, Exception Hierarchy             |
| [Email Validation](email-validation.md) | Python     | 18          | ~1,200          | 67x         | Chain of Responsibility, Strategy, Factory, Builder, Observer, Decorator |
| [FizzBuzz](fizzbuzz.md)                 | TypeScript | 7           | ~560            | 79x         | Strategy, Chain of Responsibility, Factory, Adapter, Exception Hierarchy |
| [Todo API GET](todo-api.md)             | Express/TS | 19          | ~560            | 30x         | Repository, Service, Controller, Factory, DTO, Mapper, Builder, HATEOAS  |


Every example compiles. Every example passes the same functional test as the clean version.

> **Verified 2026-07-03** with deepseek-v4-pro, ponytail plugin disabled, manbun-only. Clean baselines generated with no plugins active.

