
# 🎓 EduAssist – Frontend (Next.js)

EduAssist is an intelligent skill enhancement and personalized learning recommendation system for university students. The frontend is built in **Next.js** using modern React paradigms, with deep integration into a backend that delivers quizzes, performance analytics, recommendations, and more.

This README serves as the **master guideline** for developing the frontend — capturing every screen, component, flow, and feature in rich detail.

---

## 📦 Tech Stack

| Layer               | Stack                           |
|---------------------|----------------------------------|
| Framework           | Next.js (App Router)             |
| Language            | TypeScript (preferred) / JS      |
| Styling             | Tailwind CSS                     |
| Component System    | Shadcn UI / Radix UI             |
| Animations          | Framer Motion                    |
| State Management    | React Context / Zustand / React Query |
| Charts              | Recharts / Chart.js              |
| Forms               | React Hook Form + Zod            |
| Auth                | NextAuth.js + Google Provider    |
| Notifications       | React Hot Toast                  |
| Icons               | Lucide / Heroicons               |

---

## 🧩 Pages & Routes

### `/` – **Landing Page**
- Welcome message
- Mission of EduAssist
- CTA: “Start Learning Now”
- Login/Signup CTA (Google)
- Mobile-first design with SVG illustrations

---

### `/auth/login`
- Google OAuth via NextAuth
- Shows terms and data consent
- After success → redirect to `/learning/dashboard`

---

### `/learning/dashboard`
**Core hub** for a logged-in user.

#### Components:
- `UserGreetingCard` – personalized greeting, last activity
- `SkillRadarChart` – radar plot of subject-wise skill levels
- `RecommendationPreviewList` – top 3 recommended actions
- `XPLevelCard` – XP points, current level, progress bar
- `BadgesPanel` – earned badges
- `WeeklyGoalCard` – set and track weekly learning goals

---

### `/quiz/[subject]`
**Dynamic subject-based quiz screen**

#### Features:
- Pulls questions from backend for the selected subject
- `QuestionCard` – one per question (supports MCQ, short input)
- Timer (if set per question or per quiz)
- Progress bar (X/Y questions)
- `SubmitQuizButton` – with confirmation modal

> After submission: Results are sent to backend, then redirect to `/result`.

---

### `/result`
**Post-quiz results screen**

#### Components:
- `ScoreSummaryCard`
- `WeakSkillsList`
- `RecommendationsCardList` – generated in real-time based on backend model
- “Retake Quiz” / “Back to Dashboard” options

---

### `/recommendations`
**Full list of tailored recommendations**

#### Components:
- `RecommendationCard` – Title, why it’s recommended, link to resource
- Filter: By category, subject, difficulty
- Track progress for each item (done, in progress, skipped)
- Option to “Add to Study Plan”

---

### `/plan`
**Your study schedule and roadmap**

#### Features:
- `LearningTimeline` – chronological view of upcoming tasks
- `CalendarIntegrationCard` – sync with Google Calendar (future)
- `StudySessionCards` – per-day breakdown
- Drag and drop to rearrange plans (future)

---

### `/gamification`
**XP System, Badges, Leaderboard (optional)**

#### XP Features:
- XP gained per quiz, per day login, per completed recommendation
- `XPLevelCard` – level system with thresholds
- Confetti animation on level-up
- Daily streak logic (calendar-based)

#### Badges:
- `BadgeCard` – name, description, unlocked or not
- Examples: “Algebra Ace”, “7-Day Streaker”, “Quiz Machine”

---

### `/admin/sync` (Private Admin Page)
- Manual backend sync triggers
- Import/export quiz data
- Visualize user engagement stats

---

## 🧠 Key Components

### UI Layer
- `Button`, `Card`, `Modal`, `Tabs`, `ProgressBar`, `Tooltip`, `Badge`, `Toast`
- `SidebarNav` – dashboard navigation
- `HeaderBar` – page titles + settings
- `ResponsiveDrawer` – mobile nav

### Domain Components
- `QuizEngine` – handles question flow, tracking, validation
- `SkillRadarChart` – radar chart of subject-wise skill performance
- `XPTracker` – calculates current XP and next-level threshold
- `RecommendationsFetcher` – pulls and renders recommended paths
- `UserProfileCard` – name, email, avatar, edit profile (future)

---

## 🔌 API Integration

All data is fetched from a RESTful backend.

| Endpoint                  | Use Case                      |
|---------------------------|-------------------------------|
| `GET /api/user/me`        | Load current user info        |
| `GET /api/quiz/:subject`  | Load quiz questions           |
| `POST /api/quiz/submit`   | Submit quiz and get result    |
| `GET /api/result/latest`  | Fetch most recent result      |
| `GET /api/recommendations`| Load personalized suggestions |
| `POST /api/progress/update` | Mark task/rec as done       |

Use:
- `React Query` for caching and loading state
- `Axios` or native `fetch` for HTTP

---

## 🎮 Gamification Logic

| Trigger                        | XP Gained |
|-------------------------------|-----------|
| First login of day            | +10 XP    |
| Quiz completion               | +50 XP    |
| High score in quiz (>80%)     | +25 XP    |
| Recommendation completed      | +30 XP    |
| Week-long activity streak     | +100 XP   |

XP is stored per user and visualized via:
- Level thresholds (e.g., 100 XP → Level 2)
- Animated XP progress bar
- Confetti when level-up achieved

---

## 📈 Charts & Visualization

### Used Libraries:
- `Recharts`: RadarChart, BarChart, LineChart
- `Chart.js`: For future time-based progress charts

### Examples:
- Skill Radar: Compares strength across subjects
- XP Growth: XP points over time
- Weekly Progress: Number of activities per day

---

## 🚨 Notifications
Using `react-hot-toast` for real-time feedback

| Event                      | Message                    |
|----------------------------|----------------------------|
| Quiz Submitted             | “Quiz submitted successfully!” |
| Recommendation Completed   | “Well done! XP earned.”    |
| Level Up                   | “🎉 You leveled up!”       |
| API Error                  | “Oops! Something went wrong.” |

---

## 🛠️ Dev Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-repo/eduassist-frontend
cd eduassist-frontend
````

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Create `.env.local`

```bash
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
API_BASE_URL=http://localhost:8000/api
```

### 4. Run the dev server

```bash
npm run dev
```

---

## 🔍 Suggested Folder Structure

```bash
.
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   ├── quiz/
│   ├── result/
│   ├── recommendations/
│   ├── plan/
│   ├── auth/
│   └── gamification/
├── components/
│   ├── ui/
│   ├── quiz/
│   ├── charts/
│   ├── gamification/
│   └── dashboard/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
├── hooks/
├── types/
├── styles/
├── public/
├── middleware.ts
└── README.md
```

---

## 🚀 Future Additions

* Mobile app (React Native or Expo)
* Real-time updates via WebSocket
* Collaborative quiz sessions
* Teacher dashboard & content upload system
* AI chat tutor with GPT-4

---

## 🙌 Credits & Inspirations

* Duolingo: Gamification and streaks
* Khan Academy: Skill mastery model
* Notion: Clean UI design
* LeetCode: Skill graph and quiz structure
* EduFlow: Personalized learning journeys

---

