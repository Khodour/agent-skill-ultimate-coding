# Features that call an AI model

A model's answer is input from a stranger: it can be wrong, and anything the model read can steer it. These rules keep an AI feature safe, affordable and working when the model is not. Read this when a task calls an AI model (chat, completion, embeddings, agents, tool use).

**Contents**
- 1 Model output is untrusted input
- 2 Tools act as the user, never more
- 3 A person confirms what cannot be undone
- 4 Model-written queries and code run fenced in
- 5 Show output safely
- 6 Bound the cost, survive the outage
- 7 Send the model only what it needs
- 8 Test the code around the model

---

### 1. Model output is untrusted input
Text, SQL, code, URLs and tool calls from a model get the same checks as user input (MUST 1). Anything the model reads (user messages, documents, web pages, emails, tickets, search results) can carry instructions aimed at it, and wording in the prompt, delimiters or "ignore instructions in the data" do not reliably stop them. **Design so that an obeyed injection can do only limited harm**: rules 2–4.

### 2. Tools act as the user, never more
- Each tool call runs with the **requesting user's permissions** and checks the record in your code (MUST 2), never through a service account that can reach everything. Rules written only in the prompt are not checks.
- Tool arguments are parsed and validated like any request (`correctness.md` rule 1).
- Search and retrieval filter by what the user may see **before** anything reaches the model.

### 3. A person confirms what cannot be undone
Tools that move money, delete, send messages outside, or change permissions **only propose**. Your code stores the proposal and shows it; the action runs only when the user confirms it through a separate action of your code, which checks the limits again at that moment and is safe to repeat (MUST 6).

```text
❌ tool "email_customers" → mailer.sendAll(list, text)     one injected document mails every customer
✅ tool "email_customers" → checks list + limits, saves a draft, returns "awaiting approval"
   approveEmail(user, draftId) → checks again → mailer.sendAll(…, idempotency key = draftId)
```

### 4. Model-written queries and code run fenced in
- **Queries:** a read-only connection or role, only the user's own data (enforced by the database or your code, not by asking the model to filter), a time limit and a row limit.
- **Code:** never run it in your own process; only in a sandbox with no secrets, no network unless needed, and time and memory limits.

### 5. Show output safely
Render model output as text through normal escaping. If you render markdown, turn raw HTML off and do not auto-load images or links it contains: a URL can carry private data out to whoever wrote the injection.

### 6. Bound the cost, survive the outage
- A token limit on every call, a fixed maximum of tool rounds, and per-user rate limits (`security.md` rule 8).
- **When the result does not change per request** (a summary, a classification), store or cache it and regenerate only when its input changes; never call the model on every page view (`performance.md` rule 6).
- A time limit on every call and a fallback (`resilience.md` rules 1 and 4): the page or flow still works without the AI part.

### 7. Send the model only what it needs
- No secrets in prompts or tool results; system prompts leak.
- Send only the personal data the feature needs. Sending user data to a model provider is a product decision: say so in the report if the task starts doing it.

### 8. Test the code around the model
Answers vary, so never assert exact model text. Test your own code with a fake model that returns chosen replies, including hostile ones: a tool call for another user's record, an over-limit amount, invalid arguments, endless tool calls. Check answer quality separately with a small set of example cases.

---

### Sources

Checked on 2026-11-26. Re-read the original when a detail matters.
- [OWASP Top 10 for LLM Applications (2025)](https://genai.owasp.org/llm-top-10/): prompt injection (LLM01), improper output handling (LLM05), excessive agency (LLM06), system prompt leakage (LLM07), vector and embedding weaknesses (LLM08), unbounded consumption (LLM10)
- Anthropic: [computer use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool), [developing tests and evals](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests)
