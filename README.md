# Metis Clew

**Adaptive Code Explanations for Career Switchers & Self-Taught Learners**

🧵 **You paste code. It shows you the whole story. Then it learns what helps you understand best.**

---

## 🧵 Why Metis Clew?

In Greek mythology, Metis was the goddess of wisdom and adaptive strategy. She didn't give Theseus a fixed map—she gave him the ability to navigate whatever maze he faced.

Metis Clew plays that same role for learners: it doesn't give you pre-baked tutorials or one-size-fits-all explanations. Instead, it shows you the *full context* of code—WHAT it does, HOW data flows through it, WHY this pattern was chosen—and then *learns* which explanations actually help you understand best.

Every time you ask a question, it gets smarter about what you need.

---

## 🧩 The Real Problem

**You're using AI tools to write code. But you can't understand what they generated.**

Here's what we heard from real learners:

**User 1 (Experienced Developer):**
> "The confusing part isn't syntax—it's hidden context. When I read someone else's code, I can't see the assumptions, edge cases, or subtle side-effects. I want something that explains code like a human mentor: show me the data flow and WHY this pattern was chosen."

**User 2 (Mid-Level Coder):**
> "AI assumes I already know things. When it gives me new syntax or libraries I've never seen, I have to ask ten clarifying questions. The best help is clear, beginner-friendly documentation that explains *where* this fits in the bigger picture."

**User 3 (Beginner):**
> "Functions feel like a black box. I see variables I don't recognize, and I can't trace how data moves through the code. I want to click on any line and see a plain-English explanation of what it does AND how it connects to the rest of the program."

---

## 🧩 What They're Actually Telling You

It's not about learning styles. It's not about visual vs. text-based learners. It's about **narrative and context**.

They don't struggle because of *how* they learn. They struggle because code explanations don't show the *why*—the data flow, the assumptions, the relationships.

This isn't a problem of pedagogy. It's a problem of perspective.

---

## 🧶 The Solution: Meet People Where They Are

Metis Clew solves this with one core insight: **Show context. Then learn.**

### What You Get (MVP):

1. **Paste code** — any snippet, any language
2. **Click a line** — select what you don't understand
3. **See the full picture:**
   - WHAT the code does (plain English at your skill level)
   - HOW data flows through it (where values go, how they change)
   - WHY this pattern (context on design decisions)
   - EDGE CASES (what could break, what this doesn't handle)

4. **Rate the explanation** — thumbs up or thumbs down
5. **Tool learns** — next time you ask about similar code, it remembers what helped

**No quizzes about your learning style. No guesses about whether you're a "visual learner."**

Instead: Ask a question → Get an explanation → Rate it → Tool adapts.

That's the learning loop. The tool gets smarter because it learns *you*.

---

## 🔄 How Adaptation Works

**Session 1:**
- User asks: "What's a function?"
- Tool gives explanation (default: beginner-friendly, data-flow focused)
- User rates it: 👎 "Not helpful"
- Tool stores: function + explanation + rating

**Session 2 (next day):**
- User asks: "What's a function?"
- Tool sees in memory: "Last time, this explanation didn't work. Let me try a different angle."
- Tool generates fresh explanation with more examples/edge cases
- User rates it: 👍 "Better!"
- Tool stores: new explanation + rating + this style worked better

**Session 3+:**
- User asks about functions again
- Tool has pattern: "Concrete examples work better than abstract patterns for this person"
- Future explanations lead with examples, not theory

**This is the magic:** Not guessing how you learn. *Learning* how you learn.

---

## 🏗️ What Makes This Different

### Not a Tutorial
Tutorials assume a learning sequence. This doesn't. You ask what you want to know, in any order.

### Not a Generic AI
Most AI coding assistants generate code. They don't explain it. And when they do, they assume you know things you don't.

### Not a Learning Styles Assessment
We tested that hypothesis with real users. They told us it's wrong. The problem isn't *how* people learn. It's that code explanations are incomplete.

### Actually Adaptive
Most "adaptive" tools pick a style once (visual/kinesthetic/reading) and stick with it. Metis learns from every single interaction. If something doesn't help, it tries something different next time.

---

## 🛠️ Built for the Underserved Learner

**My audience isn't enterprise. It's real.**

Metis Clew is built for:

**Career Switchers**
- *Pain:* Coming from a different industry, you missed the foundations that were taught in Computer Science programs
- *Value:* MC gives you the full context—not just syntax, but WHY this pattern exists

**Self-Taught Coders**
- *Pain:* You learn by doing, but when you're stuck, tutorials are either too basic or assume too much
- *Value:* MC meets you exactly where you are—answers your specific question with the right level of detail

**Bootcamp Graduates in Their First Job**
- *Pain:* Code reviews are brutal when you don't understand the team's patterns and conventions
- *Value:* MC explains real code with real context—the edge cases, the assumptions, the "why we did it this way"

**First-Time Programmers**
- *Pain:* Every tutorial says "learn JavaScript" but you don't know what problems it solves or how it connects to anything
- *Value:* MC explains code by showing the relationships—how it all fits together

---

## 📊 The Problem, By The Numbers

- **73%** of developers use AI coding tools daily (Stack Overflow 2024)
- Average session: **50+ messages**, **12+ code iterations**
- But when asked "Do you understand what the AI generated?", **only 31%** report high confidence

**The gap:** Tools generate fast. Humans understand slowly.

Metis Clew bridges that gap.

---

## 🔐 Built With Trust-First Architecture

This tool stores *your learning data* locally. Not on servers. Not in a cloud database you don't control.

**How:**
- All explanations rated by you stay in your browser's localStorage
- No login required
- No data collection for "analytics"
- No "freemium" upsell later

**Why:** Your learning journey is your data. You own it.

---

## 🛠️ What's Actually Built (MVP)

**Frontend:**
- React + TypeScript (type safety from day one)
- Tailwind CSS (clean, minimal design)
- shadcn/ui components (accessible, tested)

**Backend:**
- FastAPI + Python (modern, async-ready)
- Claude API integration (explanation generation)
- 5-layer guardrails (client validation → backend pre-check → Claude intelligent validation → system prompt constraints → audit logging)

**Storage:**
- localStorage (no servers, no databases, you own your data)

**Deployment:**
- Frontend: Vercel
- Backend: Railway
- Total cost: $0 for 100 users/month

**Testing:**
- pytest coverage (minimum 70%)
- End-to-end tests (core user flows)
- Guardrail tests (security, rate limiting, abuse prevention)
- Integration tests (Claude API handling)

---

## 🎯 Why This MVP Scope

**What's IN (MVP):**
- ✅ Paste code → Get explanation
- ✅ Click to rate explanation
- ✅ Tool remembers ratings across sessions
- ✅ Tool adapts based on what you rated helpful
- ✅ Show learning dashboard (concepts explored, preferred explanation types)

**What's OUT (Post-MVP):**
- 🔮 Learning style quiz (we tested it, users don't care)
- 🔮 Multiple programming languages (start with Python, add others later)
- 🔮 Collaborative features (you + a friend learning together)
- 🔮 Saved explanations library
- 🔮 AI-assisted code generation

**Why scoped here:**
This MVP proves the core hypothesis: *Does showing full context + learning what helps = better understanding?*

If yes → scale up, add features, build community.
If no → we learn fast and pivot.

Better to prove one thing works than promise five things half-built.

---

## 🎨 Design Philosophy

**No Cheesy Gamification**
- No badges, no streaks, no "you're on a 7-day learning streak! 🎉"
- Learning isn't a game. Treating it like one insults the learner.

**Minimal, Intentional Design**
- Colors: Deep navy (#0a0e27), electric blue (#60a5fa), amber accents (#fbbf24)
- Fonts: Monospace throughout (respects the coder aesthetic)
- Layout: Code on left, explanation in sidebar on right (like Cursor, like VS Code)
- Interactions: Smooth, not flashy. Useful, not decorative.

**ASCII-Inspired, But Polished**
- Pays homage to terminal culture without being bare-bones
- Generous whitespace (not cramped)
- Clear visual hierarchy (not overwhelming)

The design gets out of the way. The code and explanations are the stars.

---

## 🚀 How to Use This

### For Your First Question:
1. Paste a code snippet you don't understand
2. Click on a line you're confused about
3. Read the explanation (WHAT + HOW + WHY)
4. Rate it: 👍 or 👎
5. Ask another question

### After 5+ Questions:
1. Check your Learning Dashboard
2. See patterns: "You understand data flow best with examples"
3. Next explanation automatically uses that approach
4. Repeat

---

## 📈 Success Metrics (How We Know It Works)

Not vanity metrics. Real ones.

- **Does the explanation help you understand?** (User rates 👍)
- **Do you use it again?** (Return rate)
- **Do you understand faster?** (Time to comprehension)
- **Do you ask fewer follow-up questions?** (Explanation quality)
- **Do you feel less frustrated?** (Emotional signal)

We're measuring: *Does this tool actually help people understand code better?*

---

## 👩‍💻 Built By L. Cordero (with Claude & Lovable as the 6th person off the bench)

**Software Developer | Civic Tech Builder | Systems Thinker**

I've spent years making invisible systems visible:
- **Beyond the Docket** (making legal systems transparent)
- **ThreadKeeper** (preserving forum knowledge before it disappears)
- **Janus Clew** (helping builders see their work from multiple angles)
- **Ariadne's Clew** (preserving reasoning from AI-assisted development)

Metis Clew continues that mission: making code *intelligible*, not just *functional*.

I built this because I teach people to code. I watch them struggle not with syntax, but with context. And I got tired of pointing them at generic tutorials that assume they know things they don't.

**Development Journey:**
- Week 1: Talked to 3 learners. Learned my original hypothesis was wrong.
- Week 2: Designed the MVP based on what they actually needed.
- Week 3: Started building (Lovable + FastAPI).
- Week 4-5: Refine and ship.

**Timeline: 5 weeks from concept to working prototype** (AI Scouts bootcamp)

*No CS degree. No formal AI training. Just a builder who sees problems and solves them.*

**Built with AI pair programming:**
All architectural decisions, scope choices, and implementations were reviewed and owned by me. Claude (via API conversations) and Lovable (for rapid frontend iteration) served as thinking partners, implementation assistants, and feedback loops—the 6th person off the bench. Modern solo development means knowing when to build from scratch vs. when to orchestrate and validate.

---

## 🧠 The Philosophy Behind This

**Occam's Razor:** Ruthless scope. Only essentials. No feature creep.

**Production Scaffolding:** Everything built right from day one. No technical debt. Tests are the pants.

**Radical Transparency:** Every design choice is explainable. Docs matter. Code matters.

We're not building a startup. We're running an experiment. That changes everything.

---

## 🔮 What's Next (Post-MVP)

- [ ] Learning style adaptation (quiz-based, if users actually care)
- [ ] Multi-language support (JavaScript, Java, Go, etc.)
- [ ] Saved explanations library (searchable, shareable)
- [ ] AI-assisted code generation (with adaptive explanations)
- [ ] Community explanations (users share what helped them)
- [ ] Collaborative learning (pair programming + explanation sharing)

But first: Ship this. Get feedback. Learn. Iterate.

---

## 🧶 The Thread

In Greek mythology, thread was a way to navigate the unknown.

Today's learners face a different labyrinth: the complexity of understanding code in an AI-native world. Traditional tutorials don't help. Bootcamps are expensive. One-size-fits-all explanations don't cut it.

**Metis Clew is your thread back to clarity.**

Not a shortcut. Not a hack. Just a tool that shows you the full picture and learns what actually helps you understand.

---

## 📬 Connect

**GitHub:** [github.com/earlgreyhot1701D](https://github.com/earlgreyhot1701D)
**Email:** lsjcordero@gmail.com
**Substack:** [La Shara's Newsletter](https://lashara.substack.com)
**LinkedIn:** [La Shara Cordero](https://www.linkedin.com/in/la-shara-cordero-a0017a11/)

---

## 📜 License

MIT License

Copyright (c) 2025 L. Cordero

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

*Built November 2025 for AI Scouts Bootcamp*
*Metis Clew: Part of the Clew Suite*
*Finding your thread through code.*
