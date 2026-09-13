# VENT0.01 - AI Therapy Chat Application
## Technical Project Report (Part 3)

---

## **Sample Code Snippets**

### **Frontend Implementation**

#### **1. Main Application Router (App.tsx)**
```typescript
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/mood-result" element={<MoodResultPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```
**Purpose**: Sets up the main application routing with protected routes for authenticated users.

#### **2. Authentication Context (AuthContext.tsx)**
```typescript
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (!email || !password) {
          reject(new Error('Email and password are required'));
          return;
        }
        
        const newUser = { email, id: Date.now().toString() };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        resolve();
      }, 1000);
    });
  };
  
  // ... other authentication methods
};
```
**Purpose**: Manages global authentication state with login, signup, and logout functionality.

#### **3. Message Service Layer (messageService.ts)**
```typescript
export const saveSessionMessage = async (
  sessionId: string, 
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<{ userMessage: Message; aiMessage: Message; currentMood: string }> => {
  try {
    const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message.text })
    });

    if (!response.ok) {
      throw new Error('Failed to save message');
    }

    const data = await response.json();
    return {
      userMessage: { ...data.userMessage, timestamp: new Date(data.userMessage.timestamp) },
      aiMessage: { ...data.aiMessage, timestamp: new Date(data.aiMessage.timestamp) },
      currentMood: data.currentMood
    };
  } catch (error) {
    console.error('Error saving session message:', error);
    throw error;
  }
};
```
**Purpose**: Handles API communication for message saving and retrieval with proper error handling.

### **Backend Implementation**

#### **4. AI Response Generation (app.py)**
```python
def get_ai_response(message_history, user_email):
    user_message = message_history[-1]['text'] if message_history else ''
    
    # Crisis detection
    if detect_crisis(user_message):
        return THERAPEUTIC_RESPONSES['crisis'][0]
    
    # AI response generation
    groq_history = [
        {"role": "system", "content": (
            "You are an engaging, empathetic AI therapist. Respond to users in a warm, "
            "conversational, and supportive manner. Ask thoughtful follow-up questions "
            "to keep the conversation going and help users reflect on their feelings. "
            "Offer therapeutic advice, encouragement, and validation. Keep responses "
            "between 3 and 6 sentences."
        )}
    ]
    
    for msg in message_history:
        role = 'user' if msg['sender'] == 'user' else 'assistant'
        groq_history.append({"role": role, "content": msg['text']})
    
    groq_response = call_groq_chat_completion(groq_history)
    return groq_response if groq_response else "I'm sorry, I'm having trouble processing your request right now."
```
**Purpose**: Generates AI-powered therapeutic responses with crisis detection and context awareness.

#### **5. Crisis Detection Algorithm (app.py)**
```python
CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end my life', 'self-harm', 'hurt myself', 
    'give up', "can't go on", 'want to die', 'die', 'worthless', 
    'hopeless', 'no way out'
]

def detect_crisis(text):
    lowered = text.lower()
    for word in CRISIS_KEYWORDS:
        if word in lowered:
            return True
    return False

THERAPEUTIC_RESPONSES = {
    'crisis': [
        "It sounds like you're going through a very difficult time. If you're thinking "
        "about harming yourself or others, please reach out to a mental health "
        "professional or a crisis helpline immediately. You're not alone, and there "
        "are people who care and want to help."
    ]
}
```
**Purpose**: Identifies crisis situations and provides immediate intervention responses.

#### **6. Session Management API (app.py)**
```python
@app.route('/api/sessions', methods=['POST'])
def create_session():
    data = request.json
    if not data or 'userEmail' not in data:
        return jsonify({"error": "User email required"}), 400
    
    user_email = data['userEmail']
    session_id = str(uuid.uuid4())
    
    sessions[session_id] = {
        'id': session_id,
        'userEmail': user_email,
        'createdAt': datetime.now().isoformat(),
        'lastActivity': datetime.now().isoformat(),
        'title': 'New Session'
    }
    
    if session_id not in messages:
        messages[session_id] = []
    
    return jsonify(sessions[session_id])
```
**Purpose**: Creates new chat sessions with unique identifiers and metadata tracking.

---

## **User Interface & Outputs**

### **Landing Page (HomePage.tsx)**
- **Hero Section**: Large title with "VENT0.002" branding and call-to-action buttons
- **Feature Highlights**: Icons and descriptions of app capabilities
- **FAQ Section**: Collapsible questions about privacy, AI capabilities, and crisis support
- **Newsletter Signup**: Email collection for updates
- **Responsive Design**: Adapts to mobile, tablet, and desktop devices

### **Chat Interface (ChatPage.tsx)**
- **Message Display**: Real-time chat messages with user/AI distinction
- **Session Management**: Sidebar with chat history and session controls
- **Voice Integration**: Text-to-speech capabilities with ElevenLabs API
- **Mood Tracking**: Visual mood indicators and color-coded backgrounds
- **Responsive Layout**: Mobile-first design with collapsible sidebar

### **Authentication System (LoginPage.tsx)**
- **Login Form**: Email and password input with validation
- **Signup Option**: New user registration
- **Error Handling**: User-friendly error messages
- **Form Validation**: Client-side input validation

### **Visual Design Elements**
- **Color Scheme**: Blue gradient backgrounds with holographic patterns
- **Typography**: Modern, readable fonts with proper hierarchy
- **Animations**: Smooth transitions and hover effects
- **Icons**: Lucide React icons for consistent visual language

---

## **Challenges & Solutions**

| Challenge | Problem Description | Solution Implemented | Technical Approach |
|-----------|---------------------|---------------------|-------------------|
| **Real-time Communication** | Need for instant message delivery and AI responses | RESTful API with async/await patterns | Flask backend with React state management |
| **Crisis Detection** | Identifying dangerous situations in user messages | Keyword-based detection with predefined responses | Python string analysis with crisis intervention protocols |
| **Session Management** | Maintaining conversation context across multiple chats | UUID-based session system with metadata tracking | Backend session storage with frontend state synchronization |
| **User Authentication** | Secure user access without complex backend auth | Client-side authentication with localStorage | React Context for global state management |
| **AI Integration** | Reliable AI responses for therapeutic conversations | Groq API with fallback error handling | API key management with response validation |
| **Responsive Design** | Consistent experience across all device sizes | Mobile-first CSS with Tailwind utilities | Responsive breakpoints and flexible layouts |
| **State Management** | Complex chat state across multiple components | React Context + local state combination | Centralized auth state with component-level message state |

