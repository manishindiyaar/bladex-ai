# Bladex AI - Customer Service Automation Tool

A powerful AI-driven platform that lets businesses collect, view, query, and act on customer messages with natural language prompts.

## Features

- **Telegram Bot Integration**: Automatically collect and respond to customer messages
- **Anthropic LLM Integration**: Process natural language queries and generate responses
- **WhatsApp-like Chat Interface**: User-friendly dashboard to view and manage all conversations
- **Natural Language Query System**: Ask questions about your customers in plain English
- **Action Execution with Approval**: Send messages to filtered customer groups with human oversight

## Project Structure

- **frontend**: React application (Vite + TypeScript)
- **nextjs-frontend**: Next.js application (TypeScript + Tailwind CSS)
- **backend/supabase**: Supabase database configuration
- **telegram-bots**: Python-based Telegram bot integration

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Telegram Bot Token
- Supabase Account
- Anthropic API Key

### Setup Instructions

1. **Set up environment variables**

   Create a `.env` file in the `telegram-bots` directory:

   ```
   BOT1_TOKEN=your_telegram_bot_token
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

   Create a `.env.local` file in the `nextjs-frontend` directory:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

2. **Install frontend dependencies**

   ```bash
   cd nextjs-frontend
   npm install
   ```

3. **Install Telegram bot dependencies**

   ```bash
   cd telegram-bots
   pip install -r requirements.txt
   ```

4. **Set up Supabase database**

   Initialize the Supabase database schema:

   - Open your Supabase project dashboard
   - Go to the SQL Editor
   - Create a new query
   - Copy the contents of `backend/supabase/schema.sql`
   - Run the query to create all tables, functions, and triggers

   This will create:
   - `contacts`: For storing customer information
   - `messages`: For storing conversation history
   - Query functions: For natural language querying
   - Realtime subscriptions: For instant UI updates

   See `backend/supabase/README.md` for more details on the schema.

5. **Start the development servers**

   Start the Next.js frontend:

   ```bash
   cd nextjs-frontend
   npm run dev
   ```

   Start the Telegram bot:

   ```bash
   cd telegram-bots
   python bots/bot1.py
   ```

## Usage

1. Start a conversation with your Telegram bot
2. Visit the dashboard at http://localhost:3000
3. View and respond to customer messages
4. Use the query input to ask questions or perform actions

## Future Enhancements

- WhatsApp integration
- Multiple bot support
- Advanced analytics dashboard
- User authentication and role-based access control