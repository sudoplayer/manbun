# FizzBuzz

**Task:** "Write a FizzBuzz program in TypeScript: print numbers 1 to 100, but print 'Fizz' for multiples of 3, 'Buzz' for multiples of 5, and 'FizzBuzz' for multiples of both."

## Clean version, 7 lines

```typescript
for (let i = 1; i <= 100; i++) {
  const fizz = i % 3 === 0;
  const buzz = i % 5 === 0;
  console.log(fizz && buzz ? "FizzBuzz" : fizz ? "Fizz" : buzz ? "Buzz" : i);
}
```

## Manbunned, ~170 lines across 6 files

### File tree

```
fizzbuzz/
├── interfaces/
│   └── index.ts          # IFizzBuzzRule, IFizzBuzzEngine, IFizzBuzzOutput
├── implementations/
│   └── index.ts          # FizzRule, BuzzRule, FizzBuzzRule, NumberRule, RuleEngine, ConsoleOutput
├── factories/
│   └── index.ts          # FizzBuzzRuleFactory
├── config/
│   └── index.ts          # FizzBuzzConfig
├── main.ts               # entry point
└── index.ts              # barrel export
```

### `interfaces/index.ts`

```typescript
// manbun: every component behind an interface — swap rules, engine, or output
export interface IFizzBuzzRule {
  // manbun: rules are predicates — composable, testable, discoverable
  readonly name: string;
  readonly priority: number;
  matches(n: number): boolean;
  readonly output: string;
}

export interface IFizzBuzzEngine {
  // manbun: engine orchestrates rules — Strategy + Chain of Responsibility
  evaluate(n: number): string;
  readonly registeredRules: ReadonlyArray<IFizzBuzzRule>;
}

export interface IFizzBuzzOutput {
  // manbun: output behind an interface — console, file, WebSocket, kafka topic
  write(message: string): void;
}
```

### `config/index.ts`

```typescript
// manbun: centralized config — per-market number ranges, localization-ready
export const FizzBuzzConfig = {
  START: 1,
  END: 100,
  FIZZ_DIVISOR: 3,
  BUZZ_DIVISOR: 5,
  FIZZ_LABEL: "Fizz",
  BUZZ_LABEL: "Buzz",
  FIZZBUZZ_LABEL: "FizzBuzz",
  // manbun: future — i18n, accessibility (aria-live region output)
  LOCALE: "en-US",
  OUTPUT_MODE: "console" as "console" | "file" | "stream",
  // manbun: metrics — count Fizz/Buzz/FizzBuzz/Number distribution
  COLLECT_METRICS: false,
} as const;
```

### `implementations/index.ts`

```typescript
// manbun: concrete rules — each is a single-responsibility strategy
import { IFizzBuzzRule, IFizzBuzzEngine, IFizzBuzzOutput } from "../interfaces/index";
import { FizzBuzzConfig } from "../config/index";

// manbun: base class extracts common validation — DRY without inheritance abuse
abstract class BaseRule implements IFizzBuzzRule {
  abstract readonly name: string;
  abstract readonly priority: number;
  abstract matches(n: number): boolean;
  abstract readonly output: string;
}

export class FizzRule extends BaseRule {
  readonly name = "FizzRule";
  readonly priority = 10;
  // manbun: low priority — FizzBuzzRule checks first
  readonly output = FizzBuzzConfig.FIZZ_LABEL;

  matches(n: number): boolean {
    return n % FizzBuzzConfig.FIZZ_DIVISOR === 0;
  }
}

export class BuzzRule extends BaseRule {
  readonly name = "BuzzRule";
  readonly priority = 10;
  readonly output = FizzBuzzConfig.BUZZ_LABEL;

  matches(n: number): boolean {
    return n % FizzBuzzConfig.BUZZ_DIVISOR === 0;
  }
}

export class FizzBuzzRule extends BaseRule {
  readonly name = "FizzBuzzRule";
  readonly priority = 20;
  // manbun: highest priority — checked first, prevents FizzRule shadowing
  readonly output = FizzBuzzConfig.FIZZBUZZ_LABEL;

  matches(n: number): boolean {
    return (
      n % FizzBuzzConfig.FIZZ_DIVISOR === 0 &&
      n % FizzBuzzConfig.BUZZ_DIVISOR === 0
    );
  }
}

export class NumberRule extends BaseRule {
  readonly name = "NumberRule";
  readonly priority = 0;
  // manbun: fallback — last resort, always matches

  get output(): string {
    // manbun: dynamic getter — output depends on the matched number
    throw new Error("NumberRule.output is context-dependent. Use evaluate() instead.");
  }

  matches(_n: number): boolean {
    return true; // manbun: catch-all — runs if no higher-priority rule matches
  }
}

export class RuleEngine implements IFizzBuzzEngine {
  private _rules: IFizzBuzzRule[] = [];

  constructor(rules?: IFizzBuzzRule[]) {
    if (rules) {
      this._rules = [...rules].sort((a, b) => b.priority - a.priority);
    }
  }

  get registeredRules(): ReadonlyArray<IFizzBuzzRule> {
    return this._rules;
  }

  // manbun: runtime rule registration — hot-plug rules without restart
  registerRule(rule: IFizzBuzzRule): void {
    this._rules.push(rule);
    this._rules.sort((a, b) => b.priority - a.priority);
  }

  evaluate(n: number): string {
    // manbun: Chain of Responsibility — first matching rule wins
    for (const rule of this._rules) {
      if (rule.matches(n)) {
        if (rule instanceof NumberRule) {
          return String(n); // fallback: just the number
        }
        return rule.output;
      }
    }
    // manbun: exhaustive — should never reach here with NumberRule as fallback
    throw new Error(`No matching rule for input: ${n}`);
  }
}

export class ConsoleOutput implements IFizzBuzzOutput {
  write(message: string): void {
    process.stdout.write(message + "\n");
  }
}
```

### `factories/index.ts`

```typescript
// manbun: factory — single source of truth for object graph wiring
import { IFizzBuzzEngine, IFizzBuzzOutput } from "../interfaces/index";
import {
  FizzRule,
  BuzzRule,
  FizzBuzzRule,
  NumberRule,
  RuleEngine,
  ConsoleOutput,
} from "../implementations/index";

export class FizzBuzzFactory {
  // manbun: static factory — DI container in pure TypeScript
  static createEngine(): IFizzBuzzEngine {
    const engine = new RuleEngine();
    // manbun: registration order matters — higher priority wins
    engine.registerRule(new FizzBuzzRule());
    engine.registerRule(new FizzRule());
    engine.registerRule(new BuzzRule());
    engine.registerRule(new NumberRule());
    return engine;
  }

  static createOutput(): IFizzBuzzOutput {
    return new ConsoleOutput();
  }
}
```

### `main.ts`

```typescript
// manbun: entry point — thin orchestration, all logic in implementations
import { FizzBuzzFactory } from "./factories/index";
import { FizzBuzzConfig } from "./config/index";

function main(): void {
  const engine = FizzBuzzFactory.createEngine();
  const output = FizzBuzzFactory.createOutput();

  for (let i = FizzBuzzConfig.START; i <= FizzBuzzConfig.END; i++) {
    const result = engine.evaluate(i);
    output.write(result);
  }
}

main();
```

### `index.ts`

```typescript
export { FizzBuzzFactory } from "./factories/index";
export { RuleEngine, ConsoleOutput } from "./implementations/index";
export { FizzBuzzConfig } from "./config/index";
export type { IFizzBuzzRule, IFizzBuzzEngine, IFizzBuzzOutput } from "./interfaces/index";
```

## Summary

| Metric | Clean | Manbunned |
|--------|-------|-----------|
| Lines of code | 7 | ~170 |
| Files | 1 | 6 |
| Design patterns | 0 | Strategy, Chain of Responsibility, Factory, Abstract Base, Singleton |
| Interfaces | 0 | 3 |
| Rule implementations | 0 | 4 |
| Config tunables | 0 | 9 |
| Still works? | ✅ | ✅ |

**Added:** `IFizzBuzzRule`, `IFizzBuzzEngine`, `IFizzBuzzOutput` interfaces, `FizzRule`, `BuzzRule`, `FizzBuzzRule`, `NumberRule` with priority-based ordering, `RuleEngine` (Chain of Responsibility + Strategy), `ConsoleOutput` (future: file, WebSocket, Kafka), `FizzBuzzFactory` (centralized wiring), `FizzBuzzConfig` (9 tunables including i18n and metrics stubs).

**Future-proof:** add `BazzRule` for multiples of 7 without touching existing rules, swap to file output via `IFizzBuzzOutput`, i18n labels per locale, A/B test FizzBuzz label variants, metrics collection for distribution analysis. The console still prints FizzBuzz.
