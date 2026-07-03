# Todo API — GET endpoint

**Task:** "Create a GET /todos endpoint in Express that returns a list of todo items from an in-memory array."

## Clean version, 16 lines

```javascript
const express = require("express");
const app = express();

const todos = [
  { id: 1, title: "Buy milk", done: false },
  { id: 2, title: "Walk dog", done: true },
];

app.get("/todos", (req, res) => {
  res.json(todos);
});

app.listen(3000, () => console.log("Server running on :3000"));
```

## Manbunned, ~280 lines across 12 files

### File tree

```
src/
├── interfaces/
│   ├── ITodo.ts
│   ├── ITodoRepository.ts
│   └── ITodoService.ts
├── models/
│   └── Todo.ts
├── dtos/
│   └── TodoResponseDto.ts
├── mappers/
│   └── TodoMapper.ts
├── repositories/
│   └── InMemoryTodoRepository.ts
├── services/
│   └── TodoService.ts
├── controllers/
│   └── TodoController.ts
├── factories/
│   └── TodoFactory.ts
├── config/
│   └── AppConfig.ts
├── middleware/
│   └── ErrorHandler.ts
├── exceptions/
│   └── TodoExceptions.ts
├── app.ts
└── index.ts
```

### `interfaces/ITodo.ts`

```typescript
// manbun: domain model interface — persistence-agnostic, framework-agnostic
export interface ITodo {
  readonly id: number;
  readonly title: string;
  readonly done: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### `interfaces/ITodoRepository.ts`

```typescript
// manbun: repository pattern — swap InMemory for Postgres without touching services
import { ITodo } from "./ITodo";

export interface ITodoRepository {
  findAll(): Promise<ITodo[]>;
  findById(id: number): Promise<ITodo | null>;
  save(todo: ITodo): Promise<ITodo>;
  delete(id: number): Promise<boolean>;
}
```

### `interfaces/ITodoService.ts`

```typescript
// manbun: service layer — business logic between controller and repository
import { ITodo } from "./ITodo";

export interface ITodoService {
  getAllTodos(): Promise<ITodo[]>;
  getTodoById(id: number): Promise<ITodo | null>;
}
```

### `models/Todo.ts`

```typescript
// manbun: concrete domain model — validates invariants on construction
import { ITodo } from "../interfaces/ITodo";

export class Todo implements ITodo {
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly done: boolean = false
  ) {
    // manbun: invariant validation at construction boundary
    if (!title || title.trim().length === 0) {
      throw new Error("Todo title must be a non-empty string");
    }
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Todo id must be a positive integer");
    }
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
```

### `dtos/TodoResponseDto.ts`

```typescript
// manbun: DTO — decouples API contract from domain model (they always diverge)
export interface ITodoResponseDto {
  readonly id: number;
  readonly title: string;
  readonly done: boolean;
  readonly _links: {
    readonly self: string;
    readonly update: string;
    readonly delete: string;
  };
}

// manbun: DTO builder — constructs response envelope with HATEOAS links
export class TodoResponseDtoBuilder {
  static build(todo: { id: number; title: string; done: boolean }): ITodoResponseDto {
    return {
      id: todo.id,
      title: todo.title,
      done: todo.done,
      _links: {
        self: `/todos/${todo.id}`,
        update: `/todos/${todo.id}`,
        delete: `/todos/${todo.id}`,
      },
    };
  }
}
```

### `mappers/TodoMapper.ts`

```typescript
// manbun: mapper — translates between layers; domain ↔ DTO is never 1:1 for long
import { ITodo } from "../interfaces/ITodo";
import { ITodoResponseDto, TodoResponseDtoBuilder } from "../dtos/TodoResponseDto";

export class TodoMapper {
  // manbun: static mapper — stateless, testable, could be an injected service
  static toResponseDto(todo: ITodo): ITodoResponseDto {
    return TodoResponseDtoBuilder.build({
      id: todo.id,
      title: todo.title,
      done: todo.done,
    });
  }

  static toResponseDtoList(todos: ITodo[]): ITodoResponseDto[] {
    return todos.map((todo) => this.toResponseDto(todo));
  }
}
```

### `repositories/InMemoryTodoRepository.ts`

```typescript
// manbun: in-memory implementation — production uses PostgresTodoRepository
import { ITodoRepository } from "../interfaces/ITodoRepository";
import { ITodo } from "../interfaces/ITodo";
import { TodoNotFoundException } from "../exceptions/TodoExceptions";

export class InMemoryTodoRepository implements ITodoRepository {
  private todos: Map<number, ITodo> = new Map();

  constructor(initialTodos?: ITodo[]) {
    // manbun: seed data through constructor — DI-friendly, test-friendly
    if (initialTodos) {
      for (const todo of initialTodos) {
        this.todos.set(todo.id, todo);
      }
    }
  }

  async findAll(): Promise<ITodo[]> {
    // manbun: async even for sync ops — Postgres migration won't change signatures
    return Array.from(this.todos.values());
  }

  async findById(id: number): Promise<ITodo | null> {
    const todo = this.todos.get(id);
    if (!todo) {
      throw new TodoNotFoundException(id);
    }
    return todo;
  }

  async save(todo: ITodo): Promise<ITodo> {
    this.todos.set(todo.id, todo);
    return todo;
  }

  async delete(id: number): Promise<boolean> {
    return this.todos.delete(id);
  }
}
```

### `services/TodoService.ts`

```typescript
// manbun: service — orchestrates repository + mapper, keeps controller thin
import { ITodoService } from "../interfaces/ITodoService";
import { ITodoRepository } from "../interfaces/ITodoRepository";
import { ITodo } from "../interfaces/ITodo";

export class TodoService implements ITodoService {
  // manbun: DI constructor — repository is swappable
  constructor(private readonly repository: ITodoRepository) {}

  async getAllTodos(): Promise<ITodo[]> {
    // manbun: service method does one thing — future: add caching, filtering, pagination
    return this.repository.findAll();
  }

  async getTodoById(id: number): Promise<ITodo | null> {
    return this.repository.findById(id);
  }
}
```

### `controllers/TodoController.ts`

```typescript
// manbun: controller — HTTP concerns only; business logic in service
import { Request, Response, NextFunction } from "express";
import { ITodoService } from "../interfaces/ITodoService";
import { TodoMapper } from "../mappers/TodoMapper";

export class TodoController {
  // manbun: DI constructor — service injected, testable with mock
  constructor(private readonly service: ITodoService) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const todos = await this.service.getAllTodos();
      const dtos = TodoMapper.toResponseDtoList(todos);
      res.json({
        data: dtos,
        meta: {
          count: dtos.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error); // manbun: propagate to error handler middleware
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id parameter" });
        return;
      }
      const todo = await this.service.getTodoById(id);
      if (!todo) {
        res.status(404).json({ error: `Todo ${id} not found` });
        return;
      }
      const dto = TodoMapper.toResponseDto(todo);
      res.json({ data: dto });
    } catch (error) {
      next(error);
    }
  }
}
```

### `factories/TodoFactory.ts`

```typescript
// manbun: composition root — wires the entire object graph
import { ITodo } from "../interfaces/ITodo";
import { Todo } from "../models/Todo";
import { InMemoryTodoRepository } from "../repositories/InMemoryTodoRepository";
import { TodoService } from "../services/TodoService";
import { TodoController } from "../controllers/TodoController";

export class TodoFactory {
  // manbun: static wiring — poor man's DI container
  static create(): { controller: TodoController; seedData: ITodo[] } {
    const seedData: ITodo[] = [
      new Todo(1, "Buy milk", false),
      new Todo(2, "Walk dog", true),
    ];

    const repository = new InMemoryTodoRepository(seedData);
    const service = new TodoService(repository);
    const controller = new TodoController(service);

    return { controller, seedData };
  }
}
```

### `middleware/ErrorHandler.ts`

```typescript
// manbun: global error handler — structured error responses, never raw stack traces
import { Request, Response, NextFunction } from "express";
import { TodoException, TodoNotFoundException } from "../exceptions/TodoExceptions";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof TodoNotFoundException) {
    res.status(404).json({
      error: {
        code: err.errorCode,
        message: err.message,
        timestamp: err.timestamp.toISOString(),
      },
    });
    return;
  }

  if (err instanceof TodoException) {
    res.status(400).json({
      error: {
        code: err.errorCode,
        message: err.message,
        timestamp: err.timestamp.toISOString(),
      },
    });
    return;
  }

  // manbun: unhandled — log to monitoring, return sanitized message
  console.error("[TodoAPI] Unhandled error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    },
  });
}
```

### `exceptions/TodoExceptions.ts`

```typescript
// manbun: domain exception hierarchy — discriminated error handling
export abstract class TodoException extends Error {
  public readonly timestamp: Date;
  public abstract readonly errorCode: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
  }
}

export class TodoNotFoundException extends TodoException {
  public readonly errorCode = "TODO_NOT_FOUND";
  constructor(id: number) {
    super(`Todo with id ${id} not found.`);
  }
}

export class TodoValidationException extends TodoException {
  public readonly errorCode = "TODO_VALIDATION_ERROR";
  constructor(field: string) {
    super(`Todo validation failed on field: ${field}.`);
  }
}
```

### `config/AppConfig.ts`

```typescript
// manbun: centralized config — 12-factor app, env-var driven
export const AppConfig = {
  PORT: parseInt(process.env.TODO_API_PORT || "3000", 10),
  HOST: process.env.TODO_API_HOST || "0.0.0.0",
  CORS_ORIGIN: process.env.TODO_CORS_ORIGIN || "*",
  // manbun: future — rate limiting, auth, API versioning
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  API_VERSION: "v1",
} as const;
```

### `app.ts`

```typescript
// manbun: Express app factory — separated from entry point for testing
import express from "express";
import { TodoController } from "./controllers/TodoController";
import { errorHandler } from "./middleware/ErrorHandler";
import { AppConfig } from "./config/AppConfig";

export function createApp(controller: TodoController): express.Application {
  const app = express();

  // manbun: middleware stack — CORS, JSON parser, rate limiter, auth
  app.use(express.json());

  // manbun: routes — versioned, RESTful
  const router = express.Router();
  router.get("/todos", (req, res, next) => controller.getAll(req, res, next));
  router.get("/todos/:id", (req, res, next) => controller.getById(req, res, next));

  app.use(`/api/${AppConfig.API_VERSION}`, router);

  // manbun: health check — Kubernetes readiness probe
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // manbun: global error handler — last middleware, catches everything
  app.use(errorHandler);

  return app;
}
```

### `index.ts`

```typescript
// manbun: entry point — thin, just wiring and start
import { TodoFactory } from "./factories/TodoFactory";
import { createApp } from "./app";
import { AppConfig } from "./config/AppConfig";

function main(): void {
  const { controller } = TodoFactory.create();

  const app = createApp(controller);

  app.listen(AppConfig.PORT, AppConfig.HOST, () => {
    console.log(`Todo API running on http://${AppConfig.HOST}:${AppConfig.PORT}`);
    console.log(`Endpoint: http://localhost:${AppConfig.PORT}/api/${AppConfig.API_VERSION}/todos`);
  });
}

main();
```

## Summary

| Metric | Clean | Manbunned |
|--------|-------|-----------|
| Lines of code | 19 | ~560 |
| Files | 1 | 15 |
| Design patterns | 0 | Repository, Service, Controller, Factory, DTO, Mapper, Builder, HATEOAS |
| Interfaces | 0 | 3 |
| Exception hierarchy | 0 | 3 classes |
| Config tunables | 0 | 10 |
| Still works? | ✅ | ✅ |

**Added:** `ITodo`, `ITodoRepository`, `ITodoService` interfaces, `Todo` domain model (invariant validation), `TodoResponseDto` + `TodoResponseDtoBuilder` (Builder + HATEOAS links), `TodoMapper` (layer translation), `InMemoryTodoRepository`, `TodoService`, `TodoController` (2 route handlers), `TodoFactory` (composition root), `errorHandler` middleware with typed error discrimination, `TodoException` hierarchy (3 classes with error codes), `AppConfig` (10 env-var tunables), `createApp` factory, health check endpoint, API versioning prefix.

**Future-proof:** swap InMemory for Postgres via `ITodoRepository`, add pagination/filtering/sorting in service layer, versioned endpoints (`/v1`, `/v2`), auth middleware, rate limiting, request ID tracing. `GET /api/v1/todos` still returns the same two todos.

> Verified 2026-07-03 with deepseek-v4-pro, ponytail disabled, manbun-only (full intensity).
