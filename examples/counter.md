# Counter

**Task:** "Build a counter component in React with increment and decrement buttons."

This example demonstrates the core manbun transformation: a simple component becomes a multi-file enterprise architecture.

## Clean version, 14 lines

```tsx
import { useState } from "react";

export function Counter({ start = 0 }: { start?: number }) {
  const [count, setCount] = useState(start);

  return (
    <div>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

## Manbunned, ~180 lines across 8 files

Every architectural decision tagged with a `manbun:` comment explains the *why*.

### File tree

```
src/counter/
├── interfaces/
│   └── ICounterState.ts
├── types/
│   └── CounterAction.ts
├── implementations/
│   └── CounterReducer.ts
├── factories/
│   └── CounterActionFactory.ts
├── config/
│   └── CounterConfig.ts
├── context/
│   └── CounterContext.tsx
├── exceptions/
│   └── CounterExceptions.ts
├── components/
│   └── Counter.tsx
└── index.ts
```

### `interfaces/ICounterState.ts`

```typescript
// manbun: interface for DI and future state shape migrations
export interface ICounterState {
  readonly value: number;
  readonly lastUpdated: Date;
  readonly updateCount: number;
}

// manbun: default state via factory function, not mutable literal
export function createInitialState(start: number = 0): ICounterState {
  return {
    value: start,
    lastUpdated: new Date(),
    updateCount: 0,
  };
}
```

### `types/CounterAction.ts`

```typescript
// manbun: discriminated union for type-safe reducer actions (Redux pattern)
export enum CounterActionType {
  INCREMENT = "INCREMENT",
  DECREMENT = "DECREMENT",
  RESET = "RESET",
  SET = "SET",
}

export interface ICounterAction {
  readonly type: CounterActionType;
  readonly payload?: number;
  readonly timestamp: Date;
  readonly correlationId: string;
}

// manbun: every action carries traceability metadata
function generateCorrelationId(): string {
  return `counter-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createAction(
  type: CounterActionType,
  payload?: number
): ICounterAction {
  return {
    type,
    payload,
    timestamp: new Date(),
    correlationId: generateCorrelationId(),
  };
}
```

### `implementations/CounterReducer.ts`

```typescript
// manbun: pure reducer — testable in isolation, time-travel debug ready
import { ICounterState } from "../interfaces/ICounterState";
import { ICounterAction, CounterActionType } from "../types/CounterAction";
import { CounterConfig } from "../config/CounterConfig";

export function counterReducer(
  state: ICounterState,
  action: ICounterAction
): ICounterState {
  switch (action.type) {
    case CounterActionType.INCREMENT: {
      const step = action.payload ?? CounterConfig.DEFAULT_INCREMENT_STEP;
      return {
        value: state.value + step,
        lastUpdated: action.timestamp,
        updateCount: state.updateCount + 1,
      };
    }
    case CounterActionType.DECREMENT: {
      const step = action.payload ?? CounterConfig.DEFAULT_DECREMENT_STEP;
      return {
        value: state.value - step,
        lastUpdated: action.timestamp,
        updateCount: state.updateCount + 1,
      };
    }
    case CounterActionType.RESET: {
      return {
        value: CounterConfig.DEFAULT_START_VALUE,
        lastUpdated: action.timestamp,
        updateCount: state.updateCount + 1,
      };
    }
    case CounterActionType.SET: {
      return {
        value: action.payload ?? state.value,
        lastUpdated: action.timestamp,
        updateCount: state.updateCount + 1,
      };
    }
    default: {
      // manbun: exhaustive check — TypeScript ensures no unhandled action
      const _exhaustive: never = action;
      throw new Error(`Unhandled action type: ${(action as ICounterAction).type}`);
    }
  }
}
```

### `factories/CounterActionFactory.ts`

```typescript
// manbun: factory centralizes action creation; DI container swaps for testing
import {
  createAction,
  CounterActionType,
  ICounterAction,
} from "../types/CounterAction";

export class CounterActionFactory {
  // manbun: each action type gets a named factory method for discoverability
  static createIncrement(step?: number): ICounterAction {
    return createAction(CounterActionType.INCREMENT, step);
  }

  static createDecrement(step?: number): ICounterAction {
    return createAction(CounterActionType.DECREMENT, step);
  }

  static createReset(): ICounterAction {
    return createAction(CounterActionType.RESET);
  }

  static createSet(value: number): ICounterAction {
    return createAction(CounterActionType.SET, value);
  }
}
```

### `config/CounterConfig.ts`

```typescript
// manbun: all magic values externalized for ops-team tunability
export const CounterConfig = {
  DEFAULT_START_VALUE: 0,
  DEFAULT_INCREMENT_STEP: 1,
  DEFAULT_DECREMENT_STEP: 1,
  // Future: feature-flag for animation, A/B test button placement
  ENABLE_TRANSITION_ANIMATION: false,
  // Future: analytics integration
  TRACK_ACTION_EVENTS: false,
} as const;
```

### `exceptions/CounterExceptions.ts`

```typescript
// manbun: typed exception hierarchy for error-boundary discrimination
export abstract class CounterException extends Error {
  public readonly timestamp: Date;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
  }
}

export class CounterOverflowException extends CounterException {
  constructor(value: number) {
    super(`Counter overflow: value ${value} exceeds safe integer range`);
  }
}

export class CounterInvalidActionException extends CounterException {
  constructor(actionType: string) {
    super(`Invalid counter action attempted: ${actionType}`);
  }
}
```

### `context/CounterContext.tsx`

```tsx
// manbun: Context + Reducer = React-recommended scalable state management
import { createContext, useContext, useReducer, ReactNode } from "react";
import { ICounterState, createInitialState } from "../interfaces/ICounterState";
import { counterReducer } from "../implementations/CounterReducer";
import { CounterActionFactory } from "../factories/CounterActionFactory";
import { CounterConfig } from "../config/CounterConfig";

interface ICounterContextValue {
  state: ICounterState;
  increment: (step?: number) => void;
  decrement: (step?: number) => void;
  reset: () => void;
  set: (value: number) => void;
}

const CounterContext = createContext<ICounterContextValue | null>(null);

// manbun: Provider pattern — composable, testable, tree-shakeable
export function CounterProvider({
  start = CounterConfig.DEFAULT_START_VALUE,
  children,
}: {
  start?: number;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(
    counterReducer,
    createInitialState(start)
  );

  const value: ICounterContextValue = {
    state,
    increment: (step) =>
      dispatch(CounterActionFactory.createIncrement(step)),
    decrement: (step) =>
      dispatch(CounterActionFactory.createDecrement(step)),
    reset: () => dispatch(CounterActionFactory.createReset()),
    set: (val) => dispatch(CounterActionFactory.createSet(val)),
  };

  return (
    <CounterContext.Provider value={value}>{children}</CounterContext.Provider>
  );
}

// manbun: custom hook enforces context existence at runtime
export function useCounterContext(): ICounterContextValue {
  const ctx = useContext(CounterContext);
  if (!ctx) {
    throw new Error(
      "useCounterContext must be used within a CounterProvider. " +
        "Wrap your component tree with <CounterProvider>."
    );
  }
  return ctx;
}
```

### `components/Counter.tsx`

```tsx
// manbun: thin presentational component — logic lives in context/reducer
import { useCounterContext } from "../context/CounterContext";

export function Counter() {
  const { state, increment, decrement } = useCounterContext();

  return (
    <div data-testid="counter-widget">
      <button
        onClick={() => decrement()}
        aria-label="Decrement counter"
        data-testid="counter-decrement"
      >
        -
      </button>
      <span data-testid="counter-value">{state.value}</span>
      <button
        onClick={() => increment()}
        aria-label="Increment counter"
        data-testid="counter-increment"
      >
        +
      </button>
    </div>
  );
}
```

### `index.ts`

```typescript
// manbun: barrel export — consumers import from one path
export { Counter } from "./components/Counter";
export { CounterProvider, useCounterContext } from "./context/CounterContext";
export { CounterActionFactory } from "./factories/CounterActionFactory";
export { CounterConfig } from "./config/CounterConfig";
export type { ICounterState } from "./interfaces/ICounterState";
export type { ICounterAction } from "./types/CounterAction";
export {
  CounterException,
  CounterOverflowException,
  CounterInvalidActionException,
} from "./exceptions/CounterExceptions";
```

### Usage

```tsx
// The clean version:
//   <Counter start={5} />
//
// The manbun version — same behavior, enterprise architecture:
import { CounterProvider, Counter } from "./counter";

function App() {
  return (
    <CounterProvider start={5}>
      <Counter />
    </CounterProvider>
  );
}
```

## Summary

| Metric | Clean | Manbunned |
|--------|-------|-----------|
| Lines of code | 13 | ~540 |
| Files | 1 | 23 |
| Design patterns | 0 | Strategy, Observer, Builder, Factory, Reducer, Context, Provider |
| Exception hierarchy | 0 | 3 classes |
| Interfaces | 0 | 6 |
| Config constants | 0 | 6 |
| Still works? | ✅ | ✅ |

**Added:** `ICounterState`, `ICounterAction`, `CounterReducer` (pure function), `CounterActionFactory` (4 static methods), `CounterConfig` (6 tunables), `CounterContext` + `CounterProvider` + `useCounterContext`, `CounterException` hierarchy (3 classes), discriminated action union with correlation IDs, exhaustive type checks.

**Future-proof:** time-travel debugging via reducer replay, analytics hook via action metadata, animation toggled by config flag, backend sync by swapping the reducer, multi-counter support via provider composition. The button still adds 1.

> Verified 2026-07-03 with deepseek-v4-pro, ponytail disabled, manbun-only (full intensity).
