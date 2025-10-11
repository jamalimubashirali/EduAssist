# AI Learning Assistant

The AI Learning Assistant is an intelligent tutoring system that provides personalized help to students based on their performance data.

## Features

- **Context-Aware Responses**: Uses user performance data to provide personalized explanations
- **Weak Topic Identification**: Automatically identifies topics where user scores < 60%
- **Chat Session Management**: Persistent chat history with session support
- **Suggested Topics**: Recommends topics for further study
- **Follow-up Questions**: Provides relevant questions to deepen understanding
- **Real-time Chat Interface**: Modern chat UI with typing indicators

## Components

### Core Components

- `LearningAssistantChat`: Main chat interface with full functionality
- `LearningAssistantWidget`: Dashboard widget for quick access
- `ChatMessage`: Individual message component with metadata display
- `ChatInput`: Input component with send functionality
- `SessionSidebar`: Session management and history
- `SuggestedTopics`: Display and interaction with suggested topics
- `FollowUpQuestions`: Interactive follow-up questions
- `TypingIndicator`: Visual feedback during AI response generation

### Services

- `learningAssistantService`: API integration for chat functionality
- `useLearningAssistantStore`: Zustand store for state management

## Usage

### Full Chat Interface

```tsx
import { LearningAssistantChat } from '@/components/learning-assistant';

export default function LearningAssistantPage() {
  return <LearningAssistantChat />;
}
```

### Dashboard Widget

```tsx
import { LearningAssistantWidget } from '@/components/learning-assistant';

<LearningAssistantWidget 
  weakTopics={['Algebra', 'Geometry']}
  className="max-w-2xl mx-auto"
/>
```

## API Endpoints

- `POST /api/v1/learning-assistant/chat` - Send message to AI tutor
- `GET /api/v1/learning-assistant/history?sessionId=xxx` - Get chat history
- `GET /api/v1/learning-assistant/sessions` - Get user's chat sessions

## Configuration

The Learning Assistant requires Azure OpenAI credentials in the backend `.env` file:

```env
AZURE_OPENAI_API_KEY=your_azure_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

## Navigation

The AI Tutor is accessible via:
- Main navigation: `/learning-assistant`
- Dashboard widget: Quick access button
- Direct URL: `http://localhost:3000/learning-assistant`

## State Management

The component uses Zustand for state management with the following features:
- Message history
- Session management
- Loading states
- Error handling
- Typing indicators
- Suggested topics and follow-up questions

## Styling

The components use Tailwind CSS with the existing design system:
- Consistent with the gaming theme
- Responsive design
- Dark mode support
- Smooth animations with Framer Motion