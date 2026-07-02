# Examples

Each example shows the same task, the same language, transformed from a clean
minimal solution into an enterprise-grade architecture that still works.

These demonstrate the manbun philosophy: every line of simplicity is an
opportunity for a design pattern. The result runs correctly — it's just
impossible to understand without a whiteboard and three espressos.

| Example | Language | Clean (LOC) | Manbunned (LOC) | Bloat Ratio | Patterns Used |
|---|:---:|--:|--:|--:|---|
| [Counter](counter.md) | React/TS | 14 | ~180 | 13x | Reducer, Factory, Context, Provider, Union Types |
| [Debounce](debounce.md) | TypeScript | 10 | ~155 | 15x | Strategy, Config, DI, Exception Hierarchy |
| [Email Validation](email-validation.md) | Python | 4 | ~130 | 33x | Chain of Responsibility, Factory, Singleton, ABC |
| [FizzBuzz](fizzbuzz.md) | TypeScript | 7 | ~170 | 24x | Strategy, Chain of Responsibility, Factory, Abstract Base |
| [Todo API GET](todo-api.md) | Express/TS | 16 | ~280 | 18x | Repository, Service, Controller, Factory, DTO, Mapper, HATEOAS |

Every example compiles. Every example passes the same functional test as the clean version.
