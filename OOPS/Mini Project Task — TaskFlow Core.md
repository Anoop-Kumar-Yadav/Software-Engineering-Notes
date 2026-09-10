# Mini Project Task — **TaskFlow Core**

We have enough OOP knowledge now to stop building isolated examples. Your next exercise should force you to **derive the architecture yourself** while still being small enough that you can focus on OOP rather than infrastructure.

We'll build a **framework-independent Task Management domain** using TypeScript.

> **Important:** For this project, do **not** use Express, MongoDB, Mongoose, Prisma, Redis, or any external framework. The objective is to practice OOP, SOLID, ports/adapters, dependency injection, composition, and testing.

---

# 1. Project Overview

## Project Name

**TaskFlow Core**

## Objective

Build the core of a task-management application where users can create projects, create tasks, assign tasks, change task status, and retrieve tasks.

The application should be designed so that:

- the business logic does not depend on a database;
    
- the business logic does not depend on HTTP;
    
- infrastructure implementations can be replaced;
    
- use cases receive their dependencies through injection;
    
- domain objects protect their own invariants;
    
- interfaces represent meaningful capabilities;
    
- implementations can be substituted safely.
    

The final application should be runnable from a simple TypeScript entrypoint such as:

```text
src/main.ts
```

with all dependencies manually wired.

---

# 2. Functional Requirements

Your application needs these capabilities.

### Project Management

A user should be able to:

```text
Create Project
Get Project
```

A project has:

```text
id
name
description
createdAt
```

---

### Task Management

A project can contain tasks.

A task has:

```text
id
projectId
title
description
status
priority
assigneeId
createdAt
```

Task status:

```text
TODO
IN_PROGRESS
COMPLETED
```

Task priority:

```text
LOW
MEDIUM
HIGH
```

---

### Task Operations

The system should support:

```text
Create Task
Assign Task
Change Task Status
Get Task
List Project Tasks
```

---

# 3. Business Rules

This is where the project becomes an **OOP/domain-design exercise** rather than CRUD practice.

## Project Rules

A project:

- must have a non-empty name;
    
- must have a unique ID;
    
- cannot be created with an empty name.
    

---

## Task Rules

A task:

- must have a non-empty title;
    
- must belong to a project;
    
- must have a valid status;
    
- must have a valid priority;
    
- cannot be assigned to an empty user ID.
    

---

## Status Rules

A task can move through these states:

```text
TODO
  │
  ▼
IN_PROGRESS
  │
  ▼
COMPLETED
```

For this exercise:

```text
TODO → IN_PROGRESS     ✓
IN_PROGRESS → COMPLETED ✓
TODO → COMPLETED        ✗
COMPLETED → TODO        ✗
COMPLETED → IN_PROGRESS ✗
```

The important part is that **the entity should protect this invariant**, rather than letting random application code manipulate the status directly.

---

# 4. Domain Objects

You should identify at least these domain concepts:

```text
Project
Task
```

Do not immediately create database models.

These are **domain objects**, not MongoDB/Mongoose models.

For example, conceptually:

```text
Task
├── id
├── projectId
├── title
├── description
├── status
├── priority
├── assigneeId
└── createdAt
```

The `Task` object should control operations that belong naturally to the task.

For example:

```text
task.assignTo(userId)
task.start()
task.complete()
```

Instead of:

```text
task.status = "IN_PROGRESS"
```

This gives you practice with **encapsulation and invariants**.

---

# 5. Use Cases

You should implement these application use cases:

```text
CreateProject
GetProject

CreateTask
AssignTask
StartTask
CompleteTask
GetTask
ListProjectTasks
```

Each use case should have a clear responsibility.

For example:

```text
CreateTask
    ↓
creates a task

AssignTask
    ↓
assigns a task

StartTask
    ↓
moves task into IN_PROGRESS

CompleteTask
    ↓
moves task into COMPLETED
```

Do **not** create one giant:

```text
TaskService
```

containing every operation.

That would deliberately move you away from the design principles we've studied.

---

# 6. Identify Dependencies Before Creating Adapters

For each use case, ask:

> "What does this use case need that it doesn't own?"

For example:

```text
CreateTask
│
├── Task ID generation
└── Task persistence
```

Therefore you might need:

```ts
interface IdGenerator {
  generate(): string;
}
```

and:

```ts
interface TaskCreator {
  create(task: Task): Promise<void>;
}
```

For retrieval:

```ts
interface TaskReader {
  findById(id: string): Promise<Task | null>;

  findByProjectId(
    projectId: string,
  ): Promise<Task[]>;
}
```

Notice the **ISP** exercise here.

Don't blindly create one enormous:

```ts
interface TaskRepository
```

containing every possible operation.

Derive the interfaces from what the use cases actually need.

---

# 7. Required Ports

Your project should eventually contain ports conceptually similar to:

```text
IdGenerator
ProjectCreator
ProjectReader
TaskCreator
TaskReader
TaskAssigner
```

But **you are not required to use these exact names**.

Part of the exercise is deciding:

> What are the actual capabilities required by the application?

For example, you may conclude that `TaskAssigner` doesn't need to exist separately because assignment is simply part of another repository capability.

That's acceptable if you can explain your decision.

---

# 8. Infrastructure Implementations

Since we're not using a real database yet, create in-memory adapters.

For example:

```text
InMemoryProjectRepository
InMemoryTaskRepository
SimpleIdGenerator
```

The repository can internally use:

```ts
Map<string, Project>
```

and:

```ts
Map<string, Task>
```

The use cases **must not know that a Map is being used**.

They should only know the port.

---

# 9. Required Dependency Structure

Your target architecture should look approximately like this:

```text
                       CORE
                        │
          ┌─────────────┴─────────────┐
          │                           │
       Entities                    Use Cases
          │                           │
          │                ┌──────────┼──────────┐
          │                │          │          │
          │                ▼          ▼          ▼
          │             Project    Task       Task
          │             Reader     Creator    Reader
          │
          └──────────────────────────────────────

                         PORTS
                           ▲
                           │
                     IMPLEMENTATIONS
                           │
              ┌────────────┴────────────┐
              │                         │
        InMemoryProject          InMemoryTask
          Repository              Repository
```

The exact structure is yours to derive.

---

# 10. Dependency Injection Requirement

**No use case may instantiate its own dependency.**

Bad:

```ts
class CreateTask {
  private repository =
    new InMemoryTaskRepository();
}
```

Also bad:

```ts
class CreateTask {
  async execute() {
    const generator =
      new SimpleIdGenerator();

    // ...
  }
}
```

Instead:

```text
wire
 │
 ├── creates dependencies
 │
 └── injects them
          │
          ▼
      CreateTask
```

For example:

```ts
const generator = new SimpleIdGenerator();

const repository =
  new InMemoryTaskRepository();

const createTask =
  new CreateTask(
    generator,
    repository,
  );
```

The exact implementation is yours.

---

# 11. Composition Root

Create a single composition point.

For example:

```text
wire.ts
```

Its job is to construct the object graph.

Conceptually:

```text
wireTaskModule()
        │
        ├── IdGenerator
        ├── ProjectRepository
        ├── TaskRepository
        │
        ├── CreateProject
        ├── GetProject
        ├── CreateTask
        ├── AssignTask
        ├── StartTask
        ├── CompleteTask
        ├── GetTask
        └── ListProjectTasks
```

The rest of the application should not repeatedly construct these objects.

---

# 12. Testing Requirements

You should write tests for **behavior**, not implementation details.

At minimum:

### Project

```text
Create valid project
Reject empty project name
Retrieve existing project
Return null for missing project
```

### Task

```text
Create valid task
Reject empty title
Reject invalid project ID
Assign task
Reject empty assignee
```

### State Transitions

```text
TODO → IN_PROGRESS
IN_PROGRESS → COMPLETED
TODO → COMPLETED should fail
COMPLETED → TODO should fail
```

---

# 13. Fake Dependencies

You should deliberately create at least one fake implementation.

For example:

```text
FakeTaskRepository
```

This should be used in your **use-case unit tests**.

Your test should be able to construct:

```text
CreateTask
   │
   ├── FakeIdGenerator
   └── FakeTaskRepository
```

without touching your production adapter.

This will force you to actually use:

```text
Abstraction
     +
Polymorphism
     +
Dependency Injection
     +
DIP
```

rather than merely talking about them.

---

# 14. OCP Requirement

Your system should support a second ID-generation implementation.

Initially:

```text
SimpleIdGenerator
```

Later add:

```text
UuidIdGenerator
```

The following must **not change**:

```text
CreateTask
CreateProject
```

Only the composition/wiring should change.

For example:

```text
Before

wire
 ↓
SimpleIdGenerator
```

After:

```text
wire
 ↓
UuidIdGenerator
```

This is your **OCP exercise**.

---

# 15. LSP Requirement

Create:

```text
IdGenerator
```

with at least:

```text
SimpleIdGenerator
UuidIdGenerator
FakeIdGenerator
```

All implementations must satisfy the behavioral expectations of the abstraction.

For example:

```text
generate()
    ↓
returns a non-empty ID
    ↓
each generated ID should satisfy
the assumptions made by consumers
```

Don't create an implementation that technically implements the interface but violates its meaning.

You should be able to replace:

```text
SimpleIdGenerator
```

with:

```text
UuidIdGenerator
```

without changing the use case.

---

# 16. ISP Requirement

Your task storage should provide multiple capabilities.

For example:

```text
TaskCreator
TaskReader
```

The `CreateTask` use case should not depend on:

```text
TaskReader
```

if it doesn't need reading.

Likewise:

```text
GetTask
```

should not depend on:

```text
TaskCreator
```

The goal is:

```text
CreateTask
    ↓
TaskCreator

GetTask
    ↓
TaskReader
```

rather than:

```text
CreateTask
    ↓
HugeTaskRepository
├── create
├── find
├── update
├── delete
├── search
└── ...
```

---

# 17. SRP Requirement

Every major class should have a clear sentence describing its responsibility.

You should be able to write:

```text
Task
→ Represents and protects task state.

CreateTask
→ Creates a task according to application rules.

InMemoryTaskRepository
→ Stores tasks in memory.

SimpleIdGenerator
→ Generates identifiers.

FakeTaskRepository
→ Provides task persistence for tests.
```

If you find yourself writing:

```text
TaskService
→ Creates tasks, stores tasks, validates tasks,
  generates IDs, sends notifications...
```

stop and reconsider the design.

---

# 18. Architecture Constraints

For this exercise, enforce these rules:

|Rule|Requirement|
|---|---|
|Framework|None|
|Database|None|
|HTTP|None|
|External API|None|
|Entity → Repository|Not allowed|
|Entity → Use case|Not allowed|
|Use case → concrete adapter|Not allowed|
|Adapter → use case|Not allowed|
|Core → infrastructure|Not allowed|
|Dependency creation|Composition root only|
|Business logic|Core|
|Storage implementation|Adapter|
|Testing|Required|

The most important dependency rule is:

```text
Core
 ↓
Port
 ↑
Adapter
```

Never:

```text
Core
 ↓
MongoRepository
```

even though we aren't actually using MongoDB yet.

---

# 19. Suggested Project Structure

**Don't create this before thinking through the design.**

Once you've derived the responsibilities, your structure may end up approximately like:

```text
taskflow-core/
│
├── src/
│   │
│   ├── core/
│   │   ├── entities/
│   │   │   ├── project.ts
│   │   │   └── task.ts
│   │   │
│   │   ├── use-cases/
│   │   │   ├── create-project.ts
│   │   │   ├── get-project.ts
│   │   │   ├── create-task.ts
│   │   │   ├── assign-task.ts
│   │   │   ├── start-task.ts
│   │   │   ├── complete-task.ts
│   │   │   ├── get-task.ts
│   │   │   └── list-project-tasks.ts
│   │   │
│   │   └── ports/
│   │       ├── id-generator.ts
│   │       ├── project-creator.ts
│   │       ├── project-reader.ts
│   │       ├── task-creator.ts
│   │       └── task-reader.ts
│   │
│   ├── adapters/
│   │   ├── persistence/
│   │   │   ├── in-memory-project-repository.ts
│   │   │   └── in-memory-task-repository.ts
│   │   │
│   │   └── id/
│   │       └── simple-id-generator.ts
│   │
│   ├── wire.ts
│   └── main.ts
│
└── tests/
```

But treat this as a **possible result**, not a starting template.

The exercise is partly about discovering whether this structure is actually justified.

---

# 20. `main.ts` Should Demonstrate the System

At the end, your `main.ts` should be able to perform something like:

```text
Create Project
      ↓
Create Task
      ↓
Assign Task
      ↓
Start Task
      ↓
Complete Task
      ↓
Retrieve Task
```

Conceptually:

```text
Project created
      ↓
Task created
      ↓
Task assigned to user
      ↓
Task started
      ↓
Task completed
```

The console output should demonstrate the behavior of the system.

There should be **no database setup** involved.

---

# 21. What You Must Be Able to Explain

After completing the project, you should be able to answer these without looking at your code:

### OOP

1. Why is `Task` a class?
    
2. What state does `Task` encapsulate?
    
3. Which invariants does `Task` protect?
    
4. Why can't callers directly modify `status`?
    
5. Where is composition being used?
    
6. Where is polymorphism being used?
    

### SOLID

7. Where is SRP applied?
    
8. Where is OCP applied?
    
9. Where is LSP applied?
    
10. Where is ISP applied?
    
11. Where is DIP applied?
    

### Architecture

12. Why does `Task` not know about the repository?
    
13. Why does the use case depend on an interface?
    
14. Why does the adapter implement that interface?
    
15. Why does `wire.ts` create the concrete objects?
    
16. What would change if the in-memory repository became MongoDB?
    
17. What would change if the ID generator changed?
    
18. What would **not** change?
    

Those questions are more important than the number of files you produce.

---

# 22. The Extraction Thought Experiment

After completing the project, imagine:

```text
Phase 1
────────────────────────

TaskFlow
└── one process
    ├── Project
    └── Task
```

Now imagine we want:

```text
Phase 2
────────────────────────

Task Service
    ↓
separate process
```

Your task module should already have boundaries that make this possible.

For example, if another module needs task information:

```text
SomeModule
    ↓
TaskClient
```

Then eventually:

```text
SomeModule
    ↓
TaskClient
    ↓
LocalTaskClient
```

could become:

```text
SomeModule
    ↓
TaskClient
    ↓
HttpTaskClient
    ↓
Task Service
```

The point is to see that **good OOP boundaries become good service boundaries**.

---

# 23. Your Development Sequence

Follow this exact process rather than coding randomly.

```text
PHASE 1 — Understand
        ↓
Read requirements
        ↓
Identify domain concepts
        ↓
Identify invariants
        ↓
Identify use cases

PHASE 2 — Domain
        ↓
Create Project
        ↓
Create Task
        ↓
Protect invariants
        ↓
Test entities

PHASE 3 — Application
        ↓
Create use cases
        ↓
Identify dependencies
        ↓
Define ports

PHASE 4 — Adapters
        ↓
Create in-memory implementations
        ↓
Make them satisfy ports

PHASE 5 — Composition
        ↓
Create wire.ts
        ↓
Construct object graph

PHASE 6 — Integration
        ↓
Create main.ts
        ↓
Run complete workflow

PHASE 7 — Testing
        ↓
Fake dependencies
        ↓
Test use cases independently

PHASE 8 — Architecture Review
        ↓
Check SOLID
        ↓
Check dependency direction
        ↓
Check coupling
        ↓
Check responsibilities
```

**Do not jump directly to Phase 4.**

The whole purpose of this exercise is to practice deriving the design.

---

# 24. Difficulty Progression

We'll deliberately do this project in stages.

### Level 1 — Domain OOP

Only:

```text
Project
Task
TaskStatus
TaskPriority
```

Focus:

```text
classes
encapsulation
constructors
private state
methods
invariants
```

### Level 2 — Application Layer

Add:

```text
CreateTask
AssignTask
StartTask
CompleteTask
```

Focus:

```text
SRP
composition
dependencies
```

### Level 3 — Ports

Add:

```text
TaskCreator
TaskReader
IdGenerator
```

Focus:

```text
abstraction
ISP
DIP
```

### Level 4 — Adapters

Add:

```text
InMemoryTaskRepository
SimpleIdGenerator
```

Focus:

```text
polymorphism
LSP
OCP
```

### Level 5 — Wiring

Add:

```text
wire.ts
```

Focus:

```text
dependency injection
composition root
object graph
```

### Level 6 — Testing

Add:

```text
FakeTaskRepository
FakeIdGenerator
```

Focus:

```text
dependency substitution
unit testing
behavioral contracts
```

---

# 25. The Main Rule for This Project

There is one rule I want you to follow above everything else:

> **Do not copy an architecture from me. Derive it.**

If you immediately create:

```text
entities/
use-cases/
ports/
adapters/
wire.ts
```

without understanding _why each exists_, you're defeating the purpose of the exercise.

Instead, start with:

```text
"What does TaskFlow need to do?"
```

Then progressively discover:

```text
"What object should own this?"
"What operation belongs to a use case?"
"What dependency does this use case need?"
"Is that dependency internal or external?"
"What abstraction should represent it?"
"Which implementation provides it?"
"Who constructs the implementation?"
```

That is the skill you're trying to develop.

---

# Your Assignment

Build **TaskFlow Core** through **Level 1 only first**.

Your first deliverable should contain:

```text
Project
Task
TaskStatus
TaskPriority
```

and demonstrate:

```text
Create a project
Create a task
Assign a task
Start a task
Complete a task
Reject invalid state transitions
Reject invalid task/project data
```

**Do not create repositories, ports, adapters, `wire.ts`, or tests for use cases yet.**

We'll review Level 1 together, identify whether your domain model is actually sound, and **only then move to Level 2**. This keeps the exercise aligned with the one-concept-at-a-time approach we've been using.