# Design and simplicity

How to shape code so it stays small, clear and easy to change. Read this when a task creates a feature, a module or an abstraction.

Examples are pseudocode. Apply each idea in the language's own way.

**Contents**
- Design rules: 1 Reuse before inventing; 2 One reason to change per piece; 3 Deep, not shallow; 4 Add, don't edit, once a kind of thing keeps growing; 5 Rules in the middle, tools at the edge; 6 Compose, don't inherit; 7 Talk to neighbours only; 8 Tie-breaker: easier to change
- Simplicity rules: 9 Simplest thing that works; 10 Build only what is asked; 11 Merge the same knowledge; 12 When rules collide; 13 Small working slice first; 14 Cut before calling it done
- Build or use (rule 15)
- Size signal

---

## Design

### 1. Reuse before inventing
Search the codebase for something that already does the job: a helper, a client, a component, an endpoint. Extend it. Create something new only when every existing door is closed, and say why.

```text
❌ write a new formatMoney() in the invoice screen
✅ find the existing currency formatter; add the missing option there
```

### 2. One reason to change per piece
Each file, class and function has one reason to change: one group of people who would ask for that change (Robert C. Martin's single responsibility principle). Split a piece when two different reasons meet in it, but not into shallow pieces that only pass calls along (rule 3).

```text
❌ InvoicePdf: lays out the page and also calculates the tax
   (design and finance change it for different reasons)
✅ taxFor(invoice) in its own function; InvoicePdf calls it
```

### 3. Deep, not shallow
A good module has a small, simple interface that hides a lot of work. A shallow module (as complex to call as it is inside) adds nothing. Every design decision (how we search, how we price, how we authenticate) lives in **one** place. When the same decision appears in several files, it has leaked.

```text
❌ five files each compute tax as  price * 0.11
✅ one taxFor(price, region) function; every file calls it
```

### 4. Add, don't edit, once a kind of thing keeps growing
When the same kind of thing keeps growing (a third payment type, another export format), give it a place to plug in (a registry, a route table, a strategy map), so a new one is an added entry instead of an edit to working code. With one or two variants a plain `if` is simpler: don't build the plug-in point in advance (rule 10, YAGNI).

```text
❌ if type == "card" ... elif type == "cash" ... elif type == "wallet" ...
   (edited for every new payment type)
✅ PAYMENT_HANDLERS = { card: payCard, cash: payCash }
   adding a type = adding one entry
```

### 5. Rules in the middle, tools at the edge
Business rules (pricing, permissions, what makes an order valid) live outside the edges and do not depend on the web framework or the UI. Where the framework's own convention puts rules in its data models (fat model, skinny controller), follow it; the edges still stay thin. The edges (HTTP handlers, controllers, views, components, CLI commands, jobs) do three things only: parse the input, call the rule, shape the response. Code receives what it needs (database, clock, settings, current user) instead of reaching for globals. This is what makes a piece testable alone.

**Test:** could this rule run from a plain script or a test, with no web server, request object or UI? If not, it is in the wrong place. When the project already mixes these layers, don't make it worse: put new rules in their own function or module, and let the old code call it.

```text
❌ controller: reads the request, checks stock, adds tax, updates the database, builds JSON
✅ controller: order = parseOrder(request)
               result = placeOrder(order, repo, clock)    rules only, through what it is given
               return toJson(result)
```

```text
❌ function total(order): rate = GLOBAL_DB.query("tax rate") ...
✅ function total(order, taxRate) ...   the caller supplies the rate
```

### 6. When the language has inheritance: compose, don't inherit
Build from parts ("has-a"). Inherit only for a true "is-a" that works everywhere the parent works.

```text
❌ class Car extends Engine     a car is not an engine
✅ class Car { engine: Engine }
```

### 7. Talk to neighbours only
Call methods on your direct objects, not on their insides. Long chains tie your code to the private shape of other objects.

```text
❌ app.session.user.group.permissions.contains("edit")
✅ user.can("edit")
```

### 8. Tie-breaker: easier to change
When two designs both work, choose the one that keeps future changes local and leaves more options open.

---

## Simplicity

### 9. Simplest thing that works
A new developer should understand it in one read. Cleverness that needs a comment to decode is a cost.

### 10. Build only what is asked
No unused parameters, settings, flags, extension points or "for later" code. Every piece has a caller today.

```text
❌ exportReport(format, compress=false, encrypt=false, chunkSize=null)
   when only CSV export was requested
✅ exportCsv(report)
```

### 11. Merge the same knowledge, not look-alike code
Two pieces of code that *look* alike may need different changes tomorrow. Merge them when they encode the same rule with the same reason to change. Otherwise wait for the third repeat.

```text
❌ one validate(x, isInvoice, isRefund, skipTax) full of flags,
   because invoice and refund validation looked similar
✅ validateInvoice() and validateRefund(), sharing only the truly
   common rule: checkCurrency()
```

### 12. When rules collide, this order wins
1. It works (passes the tests).
2. It is clear (reveals intention).
3. No duplicated knowledge.
4. Fewest pieces.

### 13. Small working slice first
Get a thin version running end to end (input → logic → storage → output), then grow it step by step. Large systems built in one go tend to fail; working large systems grow out of small working ones.

### 14. Cut before calling it done
Reread the change. If it could be much shorter and just as clear, make it shorter.

---

## 15. Build or use

- **Existing project:** follow its own framework and libraries, even custom ones.
- **New project:** prefer well-known, maintained libraries over writing your own.
- **Never** write your own security, crypto, password hashing, authentication or session handling. Use the platform's proven library.
- **New project shape:** one deployable app, split into modules by feature. Split off a separate service only for a real reason: a different scaling need, a different team, or a security boundary. Calls stay direct at first; a queue is for slow or retryable work.
- **Choices that are hard to undo** (the database, the framework, a public API's shape): write a short decision note next to the code: what was chosen, the other options, and why.

---

## Size signal

A function over about 40 lines is a signal to check whether it can be split without harming its structure (Google's C++ style guide), and a file that keeps growing is a signal to check it is not doing more than one job. It is not a hard limit: verbose languages run longer, and config, SQL, templates and generated files are long by nature. In messy code, don't make it worse: new code goes into new small pieces, and a bigger refactor is suggested in the report, never done uninvited.

---

### Sources

Checked on 2026-11-26. Re-read the original when a detail matters.
- Martin Fowler: [YAGNI](https://martinfowler.com/bliki/Yagni.html), [Beck design rules](https://martinfowler.com/bliki/BeckDesignRules.html), [Presentation domain data layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html), [Microservice premium](https://martinfowler.com/bliki/MicroservicePremium.html), [Architecture decision record](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html), [Dependency injection](https://martinfowler.com/articles/injection.html)
- Robert C. Martin: [The single responsibility principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html); John Ousterhout: [modular design lecture](https://web.stanford.edu/~ouster/cgi-bin/cs190-spring16/lecture.php?topic=modularDesign)
- Sandi Metz: [The wrong abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction); [The Pragmatic Programmer tips](https://pragprog.com/tips/); [Law of Demeter](https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html); [Design principles from Design Patterns](https://www.artima.com/articles/design-principles-from-design-patterns)
- Google: [C++ style guide](https://google.github.io/styleguide/cppguide.html), [what to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html); OWASP: [Cryptographic storage cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
