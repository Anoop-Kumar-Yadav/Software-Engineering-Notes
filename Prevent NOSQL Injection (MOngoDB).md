#### What is NoSQL Injection?
Unlike SQL injection, attackers inject **MongoDB operators**.
Normal login request:
```json
{
  "email": "john@gmail.com",
  "password": "password123"
}
```
Attacker request:
```json
{
  "email": {
    "$ne": null
  },
  "password": {
    "$ne": null
  }
}
```
If your code is careless:
```js
await User.findOne(req.body);
```
MongoDB interprets:
```json
{
  email: {
    $ne: null
  }
}

// as email != null
```
Prevention Strategy :
```
Request
   │
   ▼
Helmet
   │
   ▼
Rate Limiter
   │
   ▼
express-mongo-sanitize (or reject middleware)
   │
   ▼
Zod Validation
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
MongoDB
```

**Using** : `npm i express-mongo-sanitize` <---- ONLY WORK IN EXPRESS 4
This module searches for any keys in objects that begin with a `$` sign or contain a `.`, from `req.body`, `req.query` or `req.params`. It can then either:

- completely remove these keys and associated data from the object, or
- replace the prohibited characters with another allowed character.

The behaviour is governed by the passed option, `replaceWith`. Set this option to have the sanitizer replace the prohibited characters with the character passed in.

The config option `allowDots` can be used to allow dots in the user-supplied data. In this case, only instances of `$` will be sanitized.
## Usage
Add as a piece of express middleware, before defining your routes.

```js
const express = require('express');
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// By default, $ and . characters are removed completely from user-supplied input in the following places:
// - req.body
// - req.params
// - req.headers
// - req.query

// To remove data using these defaults:
app.use(mongoSanitize());

// Or, to replace these prohibited characters with _, use:
app.use(
  mongoSanitize({
    replaceWith: '_',
  }),
);

// Or, to sanitize data that only contains $, without .(dot)
// Can be useful for letting data pass that is meant for querying nested documents.
// NOTE: This may cause some problems on older versions of MongoDb
// READ MORE: https://github.com/fiznool/express-mongo-sanitize/issues/36
app.use(
  mongoSanitize({
    allowDots: true,
  }),
);

// Both allowDots and replaceWith
app.use(
  mongoSanitize({
    allowDots: true,
    replaceWith: '_',
  }),
);
```

### Node Modules API
You can also bypass the middleware and use the module directly:

```js
const mongoSanitize = require('express-mongo-sanitize');

const payload = {...};

// Remove any keys containing prohibited characters
mongoSanitize.sanitize(payload);

// Replace any prohibited characters in keys
mongoSanitize.sanitize(payload, {
  replaceWith: '_'
});

// Exclude sanitization of . (dot), only sanitize data that contains $.
// NOTE: This may cause some problems on older versions of MongoDb
// READ MORE: https://github.com/fiznool/express-mongo-sanitize/issues/36
mongoSanitize.sanitize(payload, {
  allowDots: true
});

// Both allowDots and replaceWith
mongoSanitize.sanitize(payload, {
  allowDots: true,
  replaceWith: '_'
});

// Check if the payload has keys with prohibited characters
const hasProhibited = mongoSanitize.has(payload);

// Check if the payload has keys with prohibited characters (`.` is excluded).
// If the payload only has `.` it will return false (since it doesn't see the data with `.` as malicious)
const hasProhibited = mongoSanitize.has(payload, true);
```