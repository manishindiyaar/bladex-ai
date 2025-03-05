# Next.js Frontend for Telegram Bot Dashboard

A modern dashboard for managing Telegram bot conversations, built with Next.js, Tailwind CSS, and Supabase.

## Features

- Real-time chat interface
- Customer management
- Message history
- Unread message tracking
- Search functionality
- WhatsApp-like UI/UX

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- Supabase account
- Anthropic API key (for AI features)

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd nextjs-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Environment Variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in your environment variables in `.env`:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_anon_key
     ANTHROPIC_API_KEY=your_anthropic_api_key
     ```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anonymous key
- `ANTHROPIC_API_KEY`: Your Anthropic API key for AI features

## Development

- The project uses TypeScript for type safety
- Tailwind CSS for styling
- Components are in `src/components`
- API routes are in `src/app/api`

## Deployment

1. Make sure your environment variables are set in your deployment platform
2. Follow the deployment guide for your platform (Vercel, Netlify, etc.)
3. Never commit `.env` file to version control

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## Security Notes

- Never commit sensitive keys or credentials
- Always use environment variables for secrets
- Keep your dependencies updated
- Review security best practices in the [Next.js Security Guide](https://nextjs.org/docs/authentication) 