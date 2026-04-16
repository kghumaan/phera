# Build with AI Documentation

The **Build with AI** feature is a core component of Phera, designed to streamline the wedding planning experience. Instead of forcing users through multiple long-form pages, it uses a conversational agent to guide them through the entire setup process—from initial details to design and schedule planning.

---

## 🚀 Key Objectives

- **Zero Friction**: Move from a blank state to a fully built wedding website in minutes.
- **Natural Interaction**: Use a familiar chat interface to ask questions one at a time.
- **Structured Data**: Extract complex data (dates, venues, schedules) from natural language.
- **Smart Logic**: Automatically skip irrelevant questions based on previous answers.

---

## 🛠 Tech Stack

### AI Engine

- **Model**: `Llama 3.3 70B Versatile` (via **Groq API**).
- **Latency**: Extremely low response times (sub-second) for a snappy chat feel.
- **Provider**: Groq Cloud for fast inference of open-weights models.

### Frontend

- **Framework**: Next.js 15 (App Router).
- **UI Library**: Material UI (MUI) with custom styling for "bubbles" and chat indicators.
- **State Management**: React `useState` and `useEffect` orchestrated by a custom hook (`useBuildAI`).

### Backend

- **Server**: Next.js API Routes (Edge-runtime where applicable).
- **Database**: Supabase (PostgreSQL) for storing captured wedding data and chat state.
- **Auth**: Supabase Auth (Pro-only feature).

---

## 🏗 Core Components

### 1. `BuildAIPage` (`app/admin/[weddingSlug]/build-ai/page.tsx`)

The entry point. It manages the High-level UI states:

- **Teaser Mode**: Shows a blurred preview for non-Pro users to encourage upgrades.
- **Loading Mode**: Fetches existing wedding data before starting the chat.
- **Chat Mode**: The active builder interface.

### 2. `useBuildAI` Hook (`lib/build-ai/useBuildAI.ts`)

The "brain" of the feature. It handles:

- **Conversation State**: Array of messages (AI and User).
- **Data Collection**: A local object that accumulates answers before syncing to Supabase.
- **Logic Flow**: Determining which question to ask next.

### 3. `Question Flow` (`lib/build-ai/question-flow.ts`)

A declarative definition of the conversation. Each question is an object containing:

- `id`: Unique identifier (e.g., `wedding_date`).
- `question`: The text the AI speaks.
- `parser`: Logic to convert user text (e.g., "next June") into database values.
- `formType`: Links the question to a specific UI component (Date picker, Color picker).
- `nextQuestion`: Logic for branches (e.g., "If FAQ is 'No', skip to Registry").

### 4. `Chat Input & Forms` (`components/admin/build-ai/`)

Instead of just a text box, the flow dynamically renders specialized components:

- `ChatDateForm`: Full calendar integration.
- `ChatColorPicker`: Visual theme selection.
- `ChatEventForm`: Mapping components for location selection.
- `TypingIndicator`: For a realistic AI feel.

---

## 🔄 The Interaction Loop

1. **User sends message**: The user types an answer or interacts with a chat form.
2. **Intent Classification**:
    - The `classify` API endpoint (`app/api/build-ai/classify/route.ts`) sends the message to **Groq**.
    - The AI identifies the **Intent**:
        - `answer`: Just answering the current question.
        - `go_back`: User wants to edit a previous section.
        - `change_value`: Proactive update (e.g., "Actually, make the color red").
        - `question`: User needs help or has a FAQ.
3. **State Update**:
    - Based on the intent, the system either parses the data and moves forward or redirects the user to a different point in the flow.
4. **Data Sync**:
    - The system periodically saves the collected fields to the Supabase `weddings` and related tables.
5. **AI Response**:
    - The AI "speaks" a follow-up response and asks the next logical question.

---

## 📋 Data Extraction & Parsing

Since users can type naturally, the system uses multiple layers to ensure data integrity:

- **Regex Parsers**: For simple items like "Couple Names" or "Dates".
- **LLM Extraction**: For complex descriptions (e.g., extracting multiple events from a paragraph).
- **Visual Confirmation**: Users see the extracted data in the chat bubble and can manually adjust it if the AI gets it wrong.

---

## 🔐 Permissions

- **Pro Feature**: Only available to users on the "Pro" plan.
- **Database Rules**: All AI-driven updates follow Supabase RLS (Row Level Security) to ensure admins only modify their own weddings.
