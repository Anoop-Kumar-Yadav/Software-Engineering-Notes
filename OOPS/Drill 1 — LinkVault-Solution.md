# Drill 1 — LinkVault: Solution

We start from the raw idea:

> Users can save useful links, give them titles and tags, organize them into collections, and search their saved links.

---

## 1. Domain Concepts

Potential concepts:

```text
User
Link
Tag
Collection
```

We can also identify:

```text
URL
```

as a potential **Value Object** rather than treating it as a primitive string.

---

## 2. Domain Types

|Concept|Type|Reason|
|---|---|---|
|`User`|Entity|Has identity and owns links|
|`Link`|Entity|Has its own identity and lifecycle|
|`Collection`|Entity|Has identity and contains links|
|`Tag`|Value Object|Describes/classifies a link|
|`Url`|Value Object|Represents a valid URL value|

Possible simplified model:

```text
User
 ├── id
 └── ...

Link
 ├── id
 ├── url
 ├── title
 └── tags

Collection
 ├── id
 ├── name
 └── links
```

---

# 3. Domain Behavior

### `Link`

```text
addTag()
removeTag()
changeTitle()
```

### `Collection`

```text
addLink()
removeLink()
```

### `User`

Potentially:

```text
addLink()
removeLink()
createCollection()
```

But we should avoid putting every application operation into `User`. The final responsibility depends on the exact domain model.

---

# 4. Domain Rules

```text
URL must be valid.

Link title cannot be empty.

Tag cannot be empty.

Collection name cannot be empty.

A link should not contain duplicate tags.

A collection should not contain the same link twice.

A user can only operate on their own links/collections.
```

The last rule is primarily an **application authorization rule**, rather than something the `Link` entity itself necessarily owns.

---

# 5. Use Cases

From the original product idea:

```text
CreateUser
SaveLink
UpdateLink
DeleteLink

CreateCollection
AddLinkToCollection
RemoveLinkFromCollection

AddTagToLink
RemoveTagFromLink

SearchLinks
GetLink
GetCollection
```

We don't necessarily need all of these immediately, but these are reasonable application actions.

---

# 6. Use-Case Responsibilities

|Use Case|Responsibility|
|---|---|
|`CreateUser`|Create a user|
|`SaveLink`|Create and save a link|
|`UpdateLink`|Modify link information|
|`DeleteLink`|Remove a user's link|
|`CreateCollection`|Create a collection|
|`AddLinkToCollection`|Associate a link with a collection|
|`RemoveLinkFromCollection`|Remove link from collection|
|`AddTagToLink`|Add a tag to a link|
|`RemoveTagFromLink`|Remove a tag from a link|
|`SearchLinks`|Find links matching search criteria|
|`GetLink`|Retrieve a specific link|
|`GetCollection`|Retrieve a collection|

---

# 7. Dependencies

Now take the use cases and ask what they need externally.

|Use Case|Required Capability|
|---|---|
|`CreateUser`|Generate ID, persist user|
|`SaveLink`|Generate ID, persist link|
|`UpdateLink`|Read link, update link|
|`DeleteLink`|Read/delete link|
|`CreateCollection`|Generate ID, persist collection|
|`AddLinkToCollection`|Read link, read/update collection|
|`SearchLinks`|Search stored links|
|`GetLink`|Read link|
|`GetCollection`|Read collection|

---

# 8. Ports

Now convert those capabilities into ports.

A possible design:

```text
IdGenerator

UserCreator
UserReader

LinkCreator
LinkReader
LinkUpdater
LinkDeleter
LinkSearcher

CollectionCreator
CollectionReader
CollectionUpdater
```

Notice that these are **capabilities**, not technologies.

---

# 9. Adapters

Now we can choose implementations.

### Persistence

```text
InMemoryUserRepository
InMemoryLinkRepository
InMemoryCollectionRepository
```

Later:

```text
MongoUserRepository
MongoLinkRepository
MongoCollectionRepository
```

### Search

```text
InMemoryLinkSearcher
```

Later:

```text
OpenSearchLinkSearcher
```

### ID generation

```text
SimpleIdGenerator
```

Later:

```text
UuidGenerator
```

---

# 10. Dependency Direction

The resulting relationship is:

```text
                 USE CASE
                    │
                    ▼
                   PORT
                    ▲
                    │
                 ADAPTER
```

For example:

```text
SearchLinks
    │
    ▼
LinkSearcher
    ▲
    │
InMemoryLinkSearcher
```

Later:

```text
SearchLinks
    │
    ▼
LinkSearcher
    ▲
    │
OpenSearchLinkSearcher
```

`SearchLinks` doesn't change.

---

# 11. Wiring

`wire.ts` constructs the object graph:

```text
wireLinkVault()
│
├── IdGenerator
│
├── UserRepository
├── LinkRepository
├── CollectionRepository
├── LinkSearcher
│
├── CreateUser
├── SaveLink
├── UpdateLink
├── DeleteLink
├── CreateCollection
├── AddLinkToCollection
├── RemoveLinkFromCollection
├── AddTagToLink
├── RemoveTagFromLink
├── SearchLinks
├── GetLink
└── GetCollection
```

Conceptually:

```text
MongoLinkRepository
        ↓
   LinkReader
        ↓
    GetLink
```

and:

```text
OpenSearchLinkSearcher
        ↓
    LinkSearcher
        ↓
    SearchLinks
```

---

# 12. Final Architecture

```text
                    LinkVault
                       │
              ┌────────┴────────┐
              │                 │
           Domain            Use Cases
              │                 │
       ┌──────┼──────┐          │
       │      │      │          ▼
      User   Link Collection   Ports
       │      │      │          ▲
       │      │      │          │
       └──────┴──────┘       Adapters
                                │
                   ┌────────────┼────────────┐
                   ▼            ▼            ▼
                MongoDB      OpenSearch    ID Provider
```

The important deduction chain was:

```text
Raw Idea
   ↓
User / Link / Collection / Tag / URL
   ↓
Entities + Value Objects
   ↓
SaveLink / SearchLinks / CreateCollection ...
   ↓
Persistence / Search / ID generation
   ↓
Ports
   ↓
Mongo / OpenSearch / ID implementation
   ↓
wire.ts
```

This is the exact pattern we should now repeat with **different raw ideas**, without me giving you the architecture beforehand.