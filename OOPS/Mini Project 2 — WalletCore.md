# Mini Project 2 — **WalletCore**

## Professional OOP & Clean Architecture Exercise

This project is designed as a **progressive implementation exercise**, not a tutorial where the architecture is handed to you upfront.

The objective is to make you practice the complete reasoning process:

```text
Requirement
    ↓
Domain Modeling
    ↓
Objects & Responsibilities
    ↓
Encapsulation
    ↓
Invariants
    ↓
Use Cases
    ↓
Abstractions / Ports
    ↓
Polymorphism
    ↓
Adapters
    ↓
Dependency Injection
    ↓
Composition Root
    ↓
Testing
```

You should be able to take the same process and apply it to a completely different application afterward.

---

# 1. Project Specification

## 1.1 Project Name

**WalletCore**

## 1.2 Project Type

Digital wallet / money management system.

## 1.3 Primary Objective

Build a framework-independent wallet system that supports:

- Wallet creation
    
- Depositing money
    
- Withdrawing money
    
- Transferring money
    
- Wallet state management
    
- Transaction history
    

The system must maintain **valid financial state at all times**.

---

# 2. Technical Constraints

For this project, intentionally keep the environment small.

|Technology|Requirement|
|---|---|
|Language|TypeScript|
|Runtime|Node.js|
|Database|None|
|HTTP|None|
|Express|Not allowed|
|MongoDB|Not allowed|
|ORM|Not allowed|
|Redis|Not allowed|
|External APIs|Not allowed|
|Dependency Injection|Manual|
|Persistence|In-memory|
|Testing|Required|

The point is to isolate **OOP and architecture** from infrastructure complexity.

---

# 3. Functional Requirements

The system must support six major operations:

```text
CreateWallet
DepositMoney
WithdrawMoney
TransferMoney
GetWallet
GetWalletTransactions
```

The application should eventually be able to execute a scenario such as:

```text
Create Wallet A
       ↓
Create Wallet B
       ↓
Deposit ₹10,000 → A
       ↓
Deposit ₹5,000 → B
       ↓
Transfer ₹2,000
A → B
       ↓
Read balances
       ↓
Read transaction history
```

Expected result:

```text
Wallet A = ₹8,000
Wallet B = ₹7,000
```

---

# 4. Domain Model

You must identify the domain objects yourself, but the system contains at least these concepts:

```text
Wallet
Money
Transaction
```

There are also domain concepts represented as constrained values:

```text
WalletStatus
TransactionType
Currency
```

You need to decide which concepts should be:

- entities;
    
- value objects;
    
- enums/value types;
    
- simple properties.
    

Do **not** create classes merely because a noun appears in the requirements.

Ask:

> **Does this concept have identity, behavior, or invariants that justify an object?**

---

# 5. `Money` — Value Object Exercise

Money is intentionally introduced before Wallet because it gives you practice with **value objects**.

A money value should conceptually contain:

```text
Money
├── amount
└── currency
```

For example:

```text
10050 INR
```

represents:

```text
₹100.50
```

Use the smallest currency unit rather than floating-point arithmetic.

Therefore:

```text
₹100.50
    ↓
10050 paise
```

---

## 5.1 Money Invariants

The `Money` abstraction must enforce:

```text
amount >= 0
currency must be valid
```

It should reject invalid values.

Examples:

```text
Money(-100, INR)
      ↓
Rejected
```

```text
Money(10000, INR)
      ↓
Valid
```

---

## 5.2 Money Operations

Your design should support operations equivalent to:

```text
add()
subtract()
```

For example:

```text
₹500 + ₹200
     ↓
₹700
```

and:

```text
₹500 - ₹200
     ↓
₹300
```

But:

```text
₹500 INR + ₹200 USD
```

must be rejected.

Similarly:

```text
₹500 - ₹700
```

must not produce:

```text
-₹200
```

The operation must reject the invalid result.

This is your first serious **domain invariant**.

---

# 6. `Wallet` — Entity Exercise

A wallet has identity.

Two wallets can have the same balance and owner but are still different wallets.

Therefore it is an **entity**.

A wallet conceptually contains:

```text
Wallet
├── id
├── ownerId
├── balance
├── currency
├── status
└── createdAt
```

You should decide whether `balance` and `currency` should be represented independently or through your `Money` abstraction.

---

# 7. Wallet State

A wallet can have three states:

```text
ACTIVE
FROZEN
CLOSED
```

The state is not just data.

It affects what operations are allowed.

That means state transitions are part of your **domain behavior**.

---

# 8. Wallet State Rules

### Active Wallet

An active wallet can:

```text
deposit
withdraw
send money
receive money
```

### Frozen Wallet

A frozen wallet cannot:

```text
deposit
withdraw
send
receive
```

### Closed Wallet

A closed wallet cannot perform financial operations.

Therefore:

```text
ACTIVE
   │
   ├── freeze()
   ▼
FROZEN
```

and potentially:

```text
FROZEN
   │
   └── activate()
        ↓
     ACTIVE
```

Closing should be treated as a terminal state:

```text
ACTIVE / FROZEN
       ↓
     CLOSED
```

Once closed:

```text
CLOSED
   ↓
cannot become ACTIVE
```

You should determine the exact public methods required to enforce these rules.

---

# 9. Encapsulation Requirement

Do **not** design Wallet like this:

```text
wallet.balance = wallet.balance - amount
```

The caller should not directly manipulate the wallet's financial state.

Instead, the wallet should expose meaningful behavior.

Conceptually:

```text
wallet.deposit(money)
wallet.withdraw(money)
wallet.freeze()
wallet.activate()
wallet.close()
```

The object should decide whether the operation is valid.

This is a major exercise in:

**Encapsulation + Invariants + Object Responsibility.**

---

# 10. Transaction

Every successful financial operation should produce a transaction.

Transaction types:

```text
DEPOSIT
WITHDRAWAL
TRANSFER
```

A transaction should contain enough information to describe what happened.

Conceptually:

```text
Transaction
├── id
├── type
├── amount
├── sourceWalletId
├── destinationWalletId
└── createdAt
```

You must decide which fields should be optional depending on transaction type.

For example:

### Deposit

```text
sourceWalletId = none
destinationWalletId = walletA
```

### Withdrawal

```text
sourceWalletId = walletA
destinationWalletId = none
```

### Transfer

```text
sourceWalletId = walletA
destinationWalletId = walletB
```

---

# 11. Business Rules

These rules are mandatory.

## Wallet Creation

```text
ownerId cannot be empty
currency must be valid
initial balance cannot be negative
```

---

## Deposit

A deposit must:

```text
amount > 0
wallet is ACTIVE
currency matches wallet currency
```

On success:

```text
balance += amount
```

and:

```text
DEPOSIT transaction created
```

---

## Withdrawal

A withdrawal must satisfy:

```text
amount > 0
wallet is ACTIVE
currency matches
balance >= amount
```

On success:

```text
balance -= amount
```

and:

```text
WITHDRAWAL transaction created
```

---

# 12. Transfer Rules

Transfer is the main domain operation.

For:

```text
Wallet A → Wallet B
```

the following must be true:

```text
source exists
destination exists
source != destination
amount > 0
source is ACTIVE
destination is ACTIVE
currencies match
source has sufficient balance
```

On success:

```text
source.balance -= amount
destination.balance += amount
```

and:

```text
TRANSFER transaction created
```

---

# 13. Atomicity Thought Exercise

Consider:

```text
A = ₹10,000
B = ₹5,000
```

Transfer:

```text
₹2,000
```

You must not end up with:

```text
A = ₹8,000
B = ₹5,000
```

if transaction recording fails.

Likewise, you shouldn't end up with:

```text
A = ₹10,000
B = ₹7,000
```

without deducting the source.

For this exercise, you don't need a real database transaction.

But you **must think about the operation as one business operation**.

This will prepare you for transactional boundaries when we later introduce real persistence.

---

# 14. Application Use Cases

Create separate use cases:

```text
CreateWallet
DepositMoney
WithdrawMoney
TransferMoney
GetWallet
GetWalletTransactions
```

Each should represent one meaningful application action.

---

## 14.1 `CreateWallet`

Responsibilities:

```text
generate wallet ID
validate required input
construct Wallet
persist Wallet
return result
```

---

## 14.2 `DepositMoney`

Responsibilities:

```text
find wallet
validate operation
deposit money
persist changed wallet
create transaction
persist transaction
```

---

## 14.3 `WithdrawMoney`

Responsibilities:

```text
find wallet
validate operation
withdraw money
persist changed wallet
create transaction
persist transaction
```

---

## 14.4 `TransferMoney`

Responsibilities:

```text
find source
find destination
validate transfer
calculate fee
withdraw from source
deposit into destination
create transaction
persist changes
```

You should carefully decide **which parts belong to Wallet itself and which belong to the use case**.

That distinction is one of the major learning objectives.

---

# 15. Strategy Pattern Exercise

Transfers will support configurable fees.

Create an abstraction conceptually equivalent to:

```text
TransferFeeStrategy
```

Possible implementations:

```text
NoFeeStrategy
FixedFeeStrategy
PercentageFeeStrategy
```

For example:

```text
Transfer = ₹1,000

No Fee
→ ₹0

Fixed ₹20
→ ₹20

2% fee
→ ₹20
```

The transfer use case should depend on:

```text
TransferFeeStrategy
```

rather than:

```text
PercentageFeeStrategy
```

---

# 16. Why Strategy Exists Here

Without Strategy, you might write:

```text
if feeType === "NONE"
    ...

if feeType === "FIXED"
    ...

if feeType === "PERCENTAGE"
    ...
```

As fee types increase:

```text
NONE
FIXED
PERCENTAGE
VIP
PROMOTIONAL
INTERNATIONAL
```

the use case becomes increasingly responsible for fee calculation details.

Instead:

```text
TransferMoney
      ↓
TransferFeeStrategy
      ↑
 ┌────┼──────────┐
 │    │          │
NoFee Fixed   Percentage
```

This gives you practice with:

- abstraction;
    
- polymorphism;
    
- Strategy Pattern;
    
- OCP;
    
- DIP.
    

---

# 17. Ports / Interfaces

Only after understanding the use cases should you define ports.

You will probably need capabilities related to:

```text
Wallet reading
Wallet creation
Wallet updating
Transaction writing
Transaction reading
ID generation
Fee calculation
```

But **you must determine the exact interfaces**.

For example, don't automatically assume:

```ts
interface WalletRepository {
  create();
  find();
  update();
  delete();
}
```

Instead ask:

> What does each use case actually require?

This is your **ISP exercise**.

---

# 18. Example Dependency Analysis

Consider:

```text
TransferMoney
```

Ask what it needs:

```text
Can it create wallets?
        ↓
No.

Can it retrieve wallets?
        ↓
Yes.

Can it update wallets?
        ↓
Yes.

Can it read transaction history?
        ↓
No.

Can it write transactions?
        ↓
Yes.

Can it calculate fees?
        ↓
Yes.
```

Therefore its dependencies should represent those capabilities.

This is how you **derive interfaces instead of inventing interfaces**.

---

# 19. Infrastructure Adapters

For the first implementation, use in-memory adapters.

Possible implementations:

```text
InMemoryWalletRepository
InMemoryTransactionRepository
SimpleIdGenerator
NoFeeStrategy
```

The repositories can internally use:

```text
Map<string, Wallet>
Map<string, Transaction>
```

But this implementation detail must remain inside the adapter.

The core should not know:

```text
Map
```

is being used.

---

# 20. Polymorphism Requirement

Create at least two implementations of an abstraction.

For example:

```text
IdGenerator
    ↑
    ├── SimpleIdGenerator
    ├── UuidIdGenerator
    └── FakeIdGenerator
```

The use cases should work with all of them.

The same should happen for:

```text
TransferFeeStrategy
    ↑
    ├── NoFeeStrategy
    ├── FixedFeeStrategy
    └── PercentageFeeStrategy
```

This is where TypeScript's interface-based polymorphism becomes practical.

---

# 21. Dependency Injection Requirement

No use case may construct its dependencies.

Forbidden:

```text
TransferMoney
    ↓
new InMemoryWalletRepository()
```

Also forbidden:

```text
CreateWallet
    ↓
new SimpleIdGenerator()
```

Instead:

```text
Composition Root
       │
       ├── creates dependencies
       │
       └── injects dependencies
                    ↓
                Use Case
```

---

# 22. Composition Root

Create one composition point, such as:

```text
wire.ts
```

Its responsibility is to construct the application graph.

Conceptually:

```text
wireWalletModule()
       │
       ├── repositories
       ├── generators
       ├── strategies
       │
       ├── CreateWallet
       ├── DepositMoney
       ├── WithdrawMoney
       ├── TransferMoney
       ├── GetWallet
       └── GetWalletTransactions
```

This is the only place where the application should decide:

```text
Which implementation should be used?
```

---

# 23. `main.ts`

After everything has been wired, `main.ts` should demonstrate the application.

The flow should be approximately:

```text
Create Wallet A
       ↓
Create Wallet B
       ↓
Deposit ₹10,000 → A
       ↓
Deposit ₹5,000 → B
       ↓
Transfer ₹2,000 A → B
       ↓
Get A
       ↓
Get B
       ↓
Get transactions
```

Then deliberately execute invalid operations.

For example:

```text
Transfer ₹20,000 from A
        ↓
InsufficientFundsError
```

and:

```text
Freeze A
   ↓
Withdraw ₹100
   ↓
WalletFrozenError
```

---

# 24. Error Design

Don't simply throw arbitrary strings everywhere.

Introduce meaningful domain/application errors where appropriate.

For example:

```text
WalletNotFoundError
InsufficientFundsError
WalletFrozenError
WalletClosedError
InvalidMoneyError
CurrencyMismatchError
InvalidTransferError
```

You don't necessarily need a sophisticated error hierarchy yet.

The goal is to practice:

```text
domain failure
      ↓
meaningful error
      ↓
caller can distinguish failure
```

---

# 25. Testing Strategy

Testing should be divided according to responsibility.

## Entity / Value Object Tests

Test:

```text
Money
Wallet
```

Examples:

```text
Money rejects negative amount
Money rejects currency mismatch
Wallet rejects withdrawal exceeding balance
Wallet rejects operation while frozen
Wallet rejects operation after closure
```

---

# 26. Use-Case Tests

Use fake dependencies.

For example:

```text
TransferMoney
      │
      ├── FakeWalletReader
      ├── FakeWalletUpdater
      ├── FakeTransactionWriter
      ├── FakeIdGenerator
      └── FakeFeeStrategy
```

No actual infrastructure should be required.

Test behaviors such as:

```text
successful transfer
insufficient balance
frozen source
frozen destination
currency mismatch
same source/destination
transaction creation
fee calculation
```

---

# 27. LSP Test

If you have:

```text
TransferFeeStrategy
```

then every valid implementation should satisfy the same conceptual contract.

For example:

```text
calculateFee(amount)
```

must not:

```text
return negative values
return impossible fees
break valid transfer assumptions
```

You should be able to replace:

```text
NoFeeStrategy
```

with:

```text
FixedFeeStrategy
```

without changing the transfer use case.

Only the **resulting business behavior** changes according to the selected strategy.

---

# 28. SOLID Requirements

Your implementation should deliberately demonstrate all five principles.

|Principle|Project Exercise|
|---|---|
|**SRP**|Wallet, Money, use cases, repositories, strategies have distinct responsibilities|
|**OCP**|Add a new fee strategy without modifying `TransferMoney`|
|**LSP**|Fee and ID implementations must honor their contracts|
|**ISP**|Use cases depend on focused capabilities|
|**DIP**|Core depends on ports, adapters implement them|

You should eventually be able to point to **actual code** demonstrating each principle.

---

# 29. Expected Dependency Direction

Your final architecture should conceptually resemble:

```text
                         CORE
                           │
              ┌────────────┴────────────┐
              │                         │
          Domain                     Use Cases
              │                         │
              │                         ▼
              │                       Ports
              │                         ▲
              │                         │
              └─────────────────────────┤
                                        │
                                     Adapters
                                        │
                           ┌────────────┼────────────┐
                           │            │            │
                       In-Memory     ID Gen       Strategy
                       Repository
```

The important dependency rule is:

```text
Core
 ↓
Abstraction
 ↑
Adapter
```

Never:

```text
Use Case
   ↓
InMemoryRepository
```

---

# 30. Recommended Development Phases

Do **not** build the entire project in one pass.

### Phase 1 — Domain Modeling

Implement only:

```text
Money
Wallet
Transaction
WalletStatus
TransactionType
```

Focus on:

```text
classes
constructors
encapsulation
private state
methods
invariants
value objects
entities
```

---

### Phase 2 — Domain Tests

Test:

```text
Money
Wallet
state transitions
financial invariants
```

Don't introduce repositories yet.

---

### Phase 3 — Application Layer

Implement:

```text
CreateWallet
DepositMoney
WithdrawMoney
TransferMoney
GetWallet
GetWalletTransactions
```

Identify dependencies rather than immediately implementing them.

---

### Phase 4 — Ports

Define interfaces based on actual use-case requirements.

Focus on:

```text
ISP
DIP
abstraction
dependency direction
```

---

### Phase 5 — Adapters

Implement:

```text
InMemoryWalletRepository
InMemoryTransactionRepository
SimpleIdGenerator
Fee strategies
```

Focus on:

```text
polymorphism
LSP
OCP
```

---

### Phase 6 — Wiring

Create:

```text
wire.ts
```

and construct the complete object graph.

Focus on:

```text
composition
dependency injection
composition root
```

---

### Phase 7 — Application Execution

Create:

```text
main.ts
```

and execute the complete workflow.

---

### Phase 8 — Architecture Review

Ask:

```text
Can I replace the repository?
Can I replace the ID generator?
Can I replace the fee strategy?
Can I test use cases without infrastructure?
Can entities work without use cases?
Can core run without Node-specific infrastructure?
```

If the answers are yes, your architecture is heading in the right direction.

---

# 31. Suggested Final Structure

**Do not create this structure before completing the design phases.**

Your eventual project might evolve toward:

```text
wallet-core/
│
├── src/
│   │
│   ├── core/
│   │   │
│   │   ├── entities/
│   │   │   ├── wallet.ts
│   │   │   └── transaction.ts
│   │   │
│   │   ├── value-objects/
│   │   │   └── money.ts
│   │   │
│   │   ├── use-cases/
│   │   │   ├── create-wallet.ts
│   │   │   ├── deposit-money.ts
│   │   │   ├── withdraw-money.ts
│   │   │   ├── transfer-money.ts
│   │   │   ├── get-wallet.ts
│   │   │   └── get-wallet-transactions.ts
│   │   │
│   │   └── ports/
│   │
│   ├── adapters/
│   │   ├── persistence/
│   │   ├── identity/
│   │   └── fee-strategies/
│   │
│   ├── wire.ts
│   └── main.ts
│
└── tests/
```

Again, **the structure is a consequence of your design**. If your reasoning produces a different structure, that's fine.

---

# 32. Completion Criteria

Don't consider the project finished merely because:

```text
npm run dev
```

works.

It is complete when you can explain the following.

### Domain

```text
Why is Wallet an entity?
Why is Money a value object?
Why does Wallet own balance-changing behavior?
Which invariants does each object protect?
```

### OOP

```text
Where is encapsulation?
Where is composition?
Where is polymorphism?
Where is abstraction?
Where is delegation?
```

### SOLID

```text
Where is SRP?
Where is OCP?
Where is LSP?
Where is ISP?
Where is DIP?
```

### Architecture

```text
Why doesn't Wallet know about persistence?
Why doesn't TransferMoney know about InMemoryWalletRepository?
Why does wire.ts know about concrete implementations?
Why can the repository be replaced?
Why can the fee strategy be replaced?
```

### Testing

```text
Can I test Wallet without a repository?
Can I test TransferMoney without persistence?
Can I replace dependencies with fakes?
```

If you can answer those questions from your own implementation, the project has served its purpose.

---

# 33. The Professional Development Sequence

For **this project**, your working process should be:

```text
                    REQUIREMENTS
                         │
                         ▼
                  DOMAIN ANALYSIS
                         │
                         ▼
                  IDENTIFY OBJECTS
                         │
                         ▼
              RESPONSIBILITY ASSIGNMENT
                         │
                         ▼
                  DEFINE INVARIANTS
                         │
                         ▼
                 IMPLEMENT ENTITIES
                         │
                         ▼
                   TEST ENTITIES
                         │
                         ▼
                  DEFINE USE CASES
                         │
                         ▼
               IDENTIFY DEPENDENCIES
                         │
                         ▼
                    DEFINE PORTS
                         │
                         ▼
               IMPLEMENT ADAPTERS
                         │
                         ▼
                  INJECT DEPENDENCIES
                         │
                         ▼
                    WIRE OBJECTS
                         │
                         ▼
                  RUN APPLICATION
                         │
                         ▼
                  TEST USE CASES
                         │
                         ▼
                REVIEW SOLID / DESIGN
```

This sequence is the **actual skill we are training**.

The project itself is only the vehicle.

---

# Your First Checkpoint

For now, implement **Phase 1 only**:

```text
Money
Wallet
Transaction
WalletStatus
TransactionType
```

Do **not** create:

```text
repositories
ports
adapters
use cases
wire.ts
main.ts
```

yet.

Your immediate objective is to answer:

> **"What behavior belongs inside each domain object, and what state must each object protect?"**

Once that foundation is correct, the next phase naturally becomes much easier because we can derive the use cases and dependencies from the domain rather than inventing them.