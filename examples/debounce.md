# Debounce

**Task:** "Add debounce to a search input in vanilla JavaScript. It currently fires an API call on every keystroke."

## Clean version, 10 lines

```javascript
const searchInput = document.querySelector('input[type="search"]');
let debounceTimer;

searchInput.addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetch(`/api/search?q=${encodeURIComponent(e.target.value)}`)
      .then((r) => r.json())
      .then((data) => console.log(data));
  }, 300);
});
```

## Manbunned, ~155 lines across 5 files

### File tree

```
src/debounce/
├── interfaces/
│   └── IDebounceStrategy.ts
├── implementations/
│   └── DebounceManager.ts
├── config/
│   └── DebounceConfig.ts
├── exceptions/
│   └── DebounceExceptions.ts
├── index.ts
```

### `interfaces/IDebounceStrategy.ts`

```typescript
// manbun: strategy interface — swap debounce algorithms without touching callers
export interface IDebounceStrategy {
  // manbun: generic type parameter keeps the strategy reusable across domains
  debounce<T extends (...args: any[]) => any>(
    fn: T,
    delayMs: number
  ): (...args: Parameters<T>) => void;

  cancel(): void;

  readonly isPending: boolean;

  readonly invocationCount: number;
}
```

### `config/DebounceConfig.ts`

```typescript
// manbun: centralized config — ops can tune delay without reading source
export const DebounceConfig = {
  DEFAULT_DELAY_MS: 300,
  MAX_DELAY_MS: 5000,
  // manbun: trailing/leading edge — product may want different UX per market
  LEADING_EDGE: false,
  TRAILING_EDGE: true,
  // manbun: max wait caps delay for rapid-fire inputs (accessibility)
  MAX_WAIT_MS: 2000,
  // manbun: logging verbosity for production debugging
  LOG_INVOCATIONS: false,
} as const;
```

### `exceptions/DebounceExceptions.ts`

```typescript
// manbun: typed error hierarchy — error boundaries can discriminate and recover
export abstract class DebounceException extends Error {
  public readonly timestamp: Date;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
  }
}

export class DebounceDelayExceededException extends DebounceException {
  constructor(requested: number, max: number) {
    super(
      `Debounce delay ${requested}ms exceeds maximum ${max}ms. Clamping to ${max}ms.`
    );
  }
}

export class DebounceCallbackException extends DebounceException {
  constructor(originalError: Error) {
    super(
      `Debounced callback threw: ${originalError.message}. ` +
        "Check the wrapped function."
    );
  }
}
```

### `implementations/DebounceManager.ts`

```typescript
// manbun: canonical trailing-edge debounce with config, logging, and cancel
import { IDebounceStrategy } from "../interfaces/IDebounceStrategy";
import { DebounceConfig } from "../config/DebounceConfig";
import {
  DebounceDelayExceededException,
  DebounceCallbackException,
} from "../exceptions/DebounceExceptions";

export class DebounceManager implements IDebounceStrategy {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private _invocationCount = 0;
  private _pendingArgs: unknown[] | null = null;

  // manbun: DI-ready — config injected for testability
  constructor(
    private readonly config: typeof DebounceConfig = DebounceConfig
  ) {}

  get isPending(): boolean {
    return this.timeoutId !== null;
  }

  get invocationCount(): number {
    return this._invocationCount;
  }

  debounce<T extends (...args: any[]) => any>(
    fn: T,
    delayMs: number = this.config.DEFAULT_DELAY_MS
  ): (...args: Parameters<T>) => void {
    // manbun: guard clause — fail fast on invalid config
    const effectiveDelay = this.validateDelay(delayMs);

    // manbun: return a wrapped function matching the original signature
    return (...args: Parameters<T>): void => {
      this._pendingArgs = args;
      this.cancel();

      if (this.config.LEADING_EDGE && this._invocationCount === 0) {
        this.executeCallback(fn, args);
      }

      this.timeoutId = setTimeout(() => {
        if (this.config.TRAILING_EDGE && this._pendingArgs !== null) {
          this.executeCallback(fn, this._pendingArgs as Parameters<T>);
        }
        this._pendingArgs = null;
        this.timeoutId = null;
      }, effectiveDelay);

      this.logInvocation(effectiveDelay);
    };
  }

  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this._pendingArgs = null;
  }

  // manbun: private helper — validate at boundary, not in hot path
  private validateDelay(requested: number): number {
    if (requested > this.config.MAX_DELAY_MS) {
      if (this.config.LOG_INVOCATIONS) {
        console.warn(
          new DebounceDelayExceededException(requested, this.config.MAX_DELAY_MS)
            .message
        );
      }
      return this.config.MAX_DELAY_MS;
    }
    return requested;
  }

  // manbun: extracted method — single responsibility for error boundary
  private executeCallback<T extends (...args: any[]) => any>(
    fn: T,
    args: Parameters<T>
  ): void {
    try {
      fn(...args);
      this._invocationCount++;
    } catch (error) {
      throw new DebounceCallbackException(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // manbun: future — structured logging, metrics hook point
  private logInvocation(delay: number): void {
    if (this.config.LOG_INVOCATIONS) {
      console.debug(
        `[DebounceManager] scheduled invocation #${this._invocationCount + 1} ` +
          `in ${delay}ms`
      );
    }
  }
}
```

### `index.ts`

```typescript
// manbun: barrel export — single import surface for consumers
export { DebounceManager } from "./implementations/DebounceManager";
export { DebounceConfig } from "./config/DebounceConfig";
export type { IDebounceStrategy } from "./interfaces/IDebounceStrategy";
export {
  DebounceException,
  DebounceDelayExceededException,
  DebounceCallbackException,
} from "./exceptions/DebounceExceptions";
```

### Usage

```typescript
// The clean version:
//   let timer; input.oninput = e => { clearTimeout(timer); timer = setTimeout(fetch, 300) }
//
// The manbun version — same behavior, enterprise architecture:
import { DebounceManager } from "./debounce";

const debounceManager = new DebounceManager();
const searchInput = document.querySelector('input[type="search"]')!;

const debouncedSearch = debounceManager.debounce(
  (query: string) => {
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => console.log(data));
  },
  300
);

searchInput.addEventListener("input", (e) => {
  debouncedSearch((e.target as HTMLInputElement).value);
});

// Optional: cancel on blur for resource hygiene
searchInput.addEventListener("blur", () => debounceManager.cancel());
```

## Summary

| Metric | Clean | Manbunned |
|--------|-------|-----------|
| Lines of code | 10 | ~155 |
| Files | 1 | 5 |
| Design patterns | 0 | Strategy, Config, Exception hierarchy |
| Testable units | 0 | 3 (Manager, Config, Exceptions) |
| Still works? | ✅ | ✅ |

**Added:** `IDebounceStrategy` interface, `DebounceManager` class with DI constructor, `DebounceConfig` (5 tunables), `DebounceException` hierarchy (3 classes), leading/trailing edge support, invocation counter, delay validation with clamping, structured logging hook, cancel-on-blur hygiene.

**Future-proof:** swap debounce algorithm (throttle, RAF-throttle) via `IDebounceStrategy`, metrics collection via `logInvocation` hook, feature-flagged UX per market, production debugging via `LOG_INVOCATIONS` flag. The input still debounces API calls.
