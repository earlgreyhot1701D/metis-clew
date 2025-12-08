# Metis Clew

**Find your thread through code.**

Metis Clew is a code explanation tool that helps career switchers and self-taught developers understand code with clarity — one explanation at a time.

[**Try the live app →**](https://metis-clew.vercel.app/) | [**Watch the demo →**](https://youtu.be/hROp9tDN36c) | [**View the code →**](https://github.com/earlgreyhot1701D/metis-clew)

---

## The Problem

When you're learning to code, you hit this wall: **code doesn't feel clear.**

You paste snippets into AI tools and get long paragraphs that don't match what you're trying to understand. Documentation assumes vocabulary you don't have yet. Tutorials move faster than your comprehension.

But the real problem isn't any of those things. It's this: **No one is explaining code to *you* specifically.**

Through user research with career switchers learning to code, I discovered they weren't struggling with different learning styles. They were struggling with understanding **context**:
- **WHAT does this code actually do?** (line by line, concretely)
- **WHY does it exist?** (what problem is it solving?)
- **HOW does data flow through it?** (the invisible wiring)

Generic explanations skip the *why*. They assume patterns are obvious when they're not. They don't connect syntax to underlying ideas.

---

## The Solution

Metis Clew provides **structured explanations** designed for clarity:

1. **What it does** — The concrete action, explained plainly
2. **Why it matters** — The problem it solves
3. **Key concepts** — Ideas you should notice
4. **Related patterns** — How this connects to broader programming patterns

You paste code, select the part you want to understand, and get a clear breakdown—not a paragraph, not a wall of text. Just clarity.

---

## How It Works

### Step 1: Paste Your Code
Drop Python, JavaScript, TypeScript, or Rust into the code input panel. No setup. No configuration.

### Step 2: Select the Part You Want to Understand
Click any line in the interactive view to select it. The selected code highlights clearly.

### Step 3: Get an Explanation
Hit "Explain" and Claude AI generates a structured breakdown of what that code does, why it matters, and what patterns it uses.

### Step 4: Rate the Explanation
Was it helpful? Rate it. Your feedback helps build a foundation for personalization.

### Step 5: Revisit Anytime
Your recent snippets stay in the sidebar. Click one to reload the code and explore it again.

---

## What's Working Now

✅ **Code Input Panel** — Paste and syntax highlight any code  
✅ **Interactive Code View** — Click lines to select them  
✅ **Structured Explanations** — Claude-powered breakdowns (What, Why, Concepts, Patterns)  
✅ **Rating System** — Users rate explanations helpful/not helpful  
✅ **Rating Persistence** — Ratings save to the database  
✅ **Recent Snippets** — Sidebar shows code you've analyzed  
✅ **Skill Level Tracking** — Beginner → Intermediate as you explore  
✅ **Production Security** — RLS policies, error handling, authentication  

---

## What's Coming (Phase 2)

📋 **Adaptive Explanations** — As you rate explanations, the system learns your preferences and personalizes future explanations  
📋 **Learning Patterns** — See which code patterns and concepts you tend to explore  
📋 **Preference-Based Prompts** — Claude adjusts explanation style based on your history  

The foundation for all this is already built. Phase 2 adds the logic to calculate preferences from your ratings.

---

## Tech Stack

**Frontend:**
- React 18.3.1 + TypeScript
- Vite (build tool)
- Radix UI (component library)
- TailwindCSS (styling)
- React Query (state management)

**Backend:**
- Supabase (PostgreSQL + authentication)
- Edge Functions (Deno) for Claude API calls
- Row-Level Security (RLS) for data privacy

**API:**
- Claude API (code explanations)

**Deployment:**
- Vercel (frontend)
- Supabase Cloud (backend)

---

## Project Structure

```
metis-clew/
├── src/
│   ├── components/          # React components
│   │   ├── CodeInputPanel   # Code paste & syntax highlighting
│   │   ├── ExplanationPanel # Ratings & explanations display
│   │   ├── Sidebar          # Recent snippets
│   │   └── ...
│   ├── pages/
│   │   └── Index.tsx        # Main application
│   ├── hooks/
│   │   ├── useLocalSession  # Local progress tracking
│   │   └── use-toast        # Toast notifications
│   └── integrations/
│       └── supabase/        # Supabase client
├── supabase/
│   ├── functions/
│   │   └── explain-code/    # Edge Function: calls Claude API
│   └── migrations/          # Database schema & triggers
├── tests/                   # Unit & integration tests
└── vite.config.ts           # Vite configuration
```

---

## Database Schema

### Core Tables

**explanations**
- Stores Claude API responses for code snippets
- Fields: `id`, `snippet_id`, `user_id`, `explanation_text`, `metadata`, `created_at`
- RLS: Users can only read their own explanations

**explanation_feedback**
- Stores user ratings (helpful / not helpful)
- Fields: `id`, `explanation_id`, `user_id`, `is_helpful`, `created_at`
- Constraint: UNIQUE(explanation_id, user_id) prevents duplicate ratings
- RLS: Users can only rate their own explanations

**code_snippets**
- Stores user code submissions
- Fields: `id`, `user_id`, `code`, `language`, `created_at`
- RLS: Users can only read their own code

**recent_snippets**
- Auto-populated by trigger when code is submitted
- Shows most recent code in sidebar
- Trigger: `on_snippet_created` fires after code_snippets INSERT

**user_preferences** (Phase 2 ready)
- Will store user skill level and preferences
- Fields: `user_id`, `skill_level`, `dominant_pattern`, `total_explanations`

**learning_patterns** (Phase 2 ready)
- Will store detected patterns from user ratings
- Fields: `user_id`, `pattern_type`, `frequency`, `insights`
- RLS: Users can only read their own patterns

---

## Key Features Explained

### Rating System (Stage 1 Complete)

Users rate each explanation with a simple helpful/not helpful button. The system:
1. Captures the rating with user_id and explanation_id
2. Uses UPSERT to prevent duplicates (if user re-rates, it updates)
3. Saves immediately to database with error handling
4. Shows confirmation to user

**Why this matters:** Ratings create the foundation for personalization. In Phase 2, analyzing these ratings will detect which code patterns and explanations resonate with each user.

### Recent Snippets (Working)

Database trigger automatically tracks the code snippets you've analyzed:
1. When you submit code, it saves to `code_snippets` table
2. Trigger `on_snippet_created` fires
3. Code is added to `recent_snippets` table
4. Sidebar queries this table and displays your history
5. Click any snippet to reload it

**Why this matters:** Learning isn't linear. You often need to revisit ideas. Recent snippets keep your exploration history accessible.

### Timeout Handling (Working)

Claude API calls can hang if the request takes too long. To prevent tab freezing:
1. Set 25-second timeout on API calls (AbortController)
2. If timeout triggers, show friendly error: "Request took too long, try with shorter code"
3. Clears timeout properly to avoid memory leaks

**Why this matters:** Users shouldn't stare at a frozen tab. Explicit timeout + error message is better UX.

### RLS Policies (Working)

All tables use Row-Level Security to ensure data privacy:
1. Users can only SELECT/INSERT/UPDATE their own data
2. Trigger context (auth.uid() IS NULL) is explicitly allowed for auto-population
3. No cross-user data leakage possible

**Why this matters:** User code might contain sensitive information. RLS ensures it stays private.

---

## Running Locally

### Prerequisites
- Node.js 18+
- Supabase account
- Claude API key

### Setup

1. **Clone the repo**
```bash
git clone https://github.com/earlgreyhot1701D/metis-clew.git
cd metis-clew
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
METIS_CLEW=your_claude_api_key
```

4. **Run the dev server**
```bash
npm run dev
```

5. **Open in browser**
Navigate to `http://localhost:8080`

### Database Setup

1. Create a Supabase project
2. Run migrations:
```bash
supabase db push
```

3. Verify tables created:
- [ ] `profiles`
- [ ] `code_snippets`
- [ ] `explanations`
- [ ] `explanation_feedback`
- [ ] `recent_snippets`
- [ ] `user_preferences`
- [ ] `learning_patterns`

---

## Testing

Run the test suite:
```bash
npm run test
```

Tests cover:
- Rating persistence
- Database constraints
- Recent snippets trigger
- RLS policies

---

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

### Backend (Supabase)

1. Push migrations: `supabase db push`
2. Deploy Edge Functions: `supabase functions deploy explain-code`
3. Set environment variables in Supabase dashboard

---

## Philosophy

**Occam's Razor + Production Scaffolding + Radical Transparency**

- **Occam's Razor:** The simplest explanation is the best. No unnecessary features.
- **Production Scaffolding:** Security, error handling, and testing from day one. No shortcuts.
- **Radical Transparency:** Be honest about what works, what's planned, and what's missing.

This project prioritizes:
1. **Clarity over features** — Better to do one thing well than many things poorly
2. **User research over assumptions** — Test ideas with real learners before building
3. **Production quality over speed** — Security and error handling matter
4. **Transparency over perfection** — Explain what's done, what's planned, what's missing

---

## Known Limitations

### Learning Patterns (Hidden)
The learning patterns drawer is intentionally hidden. The feature requires Phase 2 logic to analyze ratings and populate the table. Rather than show an empty feature, we're transparent about the timeline.

### UI Polish
Some visual polish items are deferred:
- Recent snippets show language name twice (could show code preview)
- Clear code button placement could be optimized
- Header spacing could be refined

These are visual tweaks, not functional issues.

---

## Phase 2: The Vision

When the adaptive features launch, Metis Clew will:

1. **Analyze your ratings** — Detect which code patterns and concepts you rate as helpful
2. **Build your profile** — "You tend to ask about async patterns" or "You prefer visual explanations"
3. **Adapt explanations** — Claude prompts adjust based on your preferences
4. **Show your learning** — Learning Patterns drawer displays detected trends
5. **Personalize over time** — The more you use it, the more it learns about you

Timeline: 20-30 hours of work for a solid Phase 2 implementation.

---

## The Bigger Picture

Metis Clew is part of my "Clew Suite" — tools that help people find their thread through complexity:

- **Janus Clew:** Reflection tool for builders tracking their own learning
- **Ariadne Clew:** Pattern recognition system (in progress)
- **Metis Clew:** Code explanations for clarity and understanding

The name comes from Greek mythology:
- **Metis:** Goddess of wisdom and hidden knowledge
- **Clew:** The ball of thread Ariadne gave Theseus to navigate the Labyrinth

**Core thesis:** *When you understand how data flows and why patterns were chosen, the code becomes visible.*

---

## Attribution

Built during the AI Scouts bootcamp (5 weeks) with guidance from:
- Claude AI (research, architecture, debugging)
- Claude Code (database triggers, diagnostic analysis)
- My cohort (feedback, validation, iteration)

Uses:
- Claude API for explanations
- Supabase for backend infrastructure
- Vercel for deployment

---

## License

Apache License — see LICENSE file for details

---

## Questions? Feedback?

- **Live App:** [metis-clew.vercel.app](https://metis-clew.vercel.app/)
- **Demo Video:** [YouTube](https://youtu.be/hROp9tDN36c)
- **GitHub:** [earlgreyhot1701D/metis-clew](https://github.com/earlgreyhot1701D/metis-clew)

Find your thread. 🧵
