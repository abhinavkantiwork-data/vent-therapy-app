# VENT0.01 - AI Therapy Chat Application
## Technical Project Report (Part 2)

---

## **Tools & Technologies**

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Frontend Framework** | React | 18.3.1 | User interface and component management |
| **Language** | TypeScript | 5.5.3 | Type-safe JavaScript development |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS framework |
| **Routing** | React Router DOM | 6.22.3 | Client-side navigation |
| **Icons** | Lucide React | 0.344.0 | Modern icon library |
| **Build Tool** | Vite | 5.4.2 | Fast development and building |
| **Backend Framework** | Python Flask | 2.3.3 | RESTful API server |
| **AI Integration** | Groq API | 0.4.2 | Large language model access |
| **CORS** | Flask-CORS | 4.0.0 | Cross-origin resource sharing |
| **Environment** | Python-dotenv | 1.0.0 | Environment variable management |
| **Code Quality** | ESLint | 9.9.1 | JavaScript/TypeScript linting |
| **PostCSS** | PostCSS | 8.4.35 | CSS processing and optimization |

---

## **System Architecture**

### **High-Level Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React/TS)    │◄──►│   (Flask)       │◄──►│   (Groq AI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │   Session       │    │   AI Response   │
│   (LocalStorage)│    │   Management    │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Data Flow Architecture**
1. **User Authentication**: Client-side authentication with localStorage
2. **Session Creation**: Backend session management with UUID generation
3. **Message Processing**: Real-time message handling and AI integration
4. **Crisis Detection**: Server-side keyword analysis and intervention
5. **Response Generation**: AI-powered therapeutic response creation

### **Component Architecture**
- **App.tsx**: Main application router and authentication wrapper
- **AuthContext**: Global authentication state management
- **ChatPage**: Core chat functionality with session management
- **MessageService**: API communication layer
- **Flask Backend**: RESTful API endpoints and AI integration

---

## **Implementation Details**

### **Frontend Architecture**

#### **Core Components**
- **App.tsx**: Main application component with React Router setup
- **AuthContext**: React Context for user authentication state
- **ProtectedRoute**: Route protection wrapper component
- **ChatPage**: Main chat interface with real-time messaging
- **HomePage**: Landing page with authentication options

#### **State Management**
- **React Context**: Global authentication state
- **Local State**: Component-level state management
- **LocalStorage**: Persistent user session data
- **API State**: Real-time message and session data

#### **Routing Structure**
```typescript
/ → HomePage (Public)
/login → LoginPage (Public)
/chat → ChatPage (Protected)
/chat/:sessionId → ChatPage with specific session (Protected)
/mood-result → MoodResultPage (Public)
```

### **Backend Architecture**

#### **API Endpoints**
- **POST /api/messages**: Create new chat messages
- **GET /api/messages**: Retrieve user message history
- **POST /api/sessions**: Create new chat sessions
- **GET /api/sessions**: Retrieve user sessions
- **POST /api/sessions/<id>/messages**: Add messages to specific sessions
- **DELETE /api/sessions/<id>**: Delete chat sessions

#### **AI Integration**
- **Groq API**: Llama3-8b model for therapeutic responses
- **Crisis Detection**: Keyword-based crisis identification
- **Response Generation**: Context-aware AI response creation
- **Session Context**: Conversation history maintenance

#### **Data Management**
- **In-Memory Storage**: Session and message data (development)
- **User Sessions**: UUID-based session identification
- **Message History**: Timestamped conversation tracking
- **Crisis Keywords**: Predefined crisis detection patterns

