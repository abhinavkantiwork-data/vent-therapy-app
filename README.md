# VENT0.01 - AI Therapy Chat Application

VENT0.01 is an AI-powered therapy chat application designed to provide a safe space for users to express themselves and receive supportive responses.

## Features

- User authentication system with login/signup functionality
- AI-powered therapeutic chat interface
- Session management with start/end session controls
- User conversation history linked to email accounts
- Responsive design across all devices
- Holographic design aesthetic

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- Python 3.8 or later (for backend)

### Installation

1. Clone the repository
2. Install frontend dependencies:

```bash
npm install
```

3. Install backend dependencies:

```bash
cd server
pip install -r requirements.txt
```

4. Replace `YOUR_API_KEY` in `server/app.py` with your OpenAI API key

### Running the Application

1. Start the frontend development server:


## Publishing

The backend now stores accounts, tokens, sessions, and messages in SQLite. Deploy
the `server` directory to a host with persistent disk storage, and set these
environment variables there:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
FRONTEND_URL=https://your-frontend.example.com
DATABASE_PATH=/data/vent.db
PORT=5000
```

Build the frontend with the deployed API URL:

```env
VITE_API_URL=https://your-api.example.com
```

Then run `npm run build` and publish the generated `dist` directory. The API
must use HTTPS in production, and the SQLite path must point to persistent disk
or account history will be lost when the server restarts.
```bash
npm run dev
```

2. In a separate terminal, start the backend server:

```bash
npm run server
```

## Project Structure

- `/src` - Frontend React application
  - `/components` - Reusable UI components
  - `/contexts` - React contexts for state management
  - `/pages` - Main application pages
  - `/services` - API services
  - `/assets` - Static assets
- `/server` - Python backend for AI integration

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - Tailwind CSS
  - React Router
  - Lucide React (icons)
- Backend:
  - Python
  - Flask
  - OpenAI API

## License

This project is licensed under the MIT License.