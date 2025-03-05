# Bladex AI Telegram Bots

This directory contains the Telegram bot implementations for Bladex AI. The bots connect to Telegram's API and interface with Supabase to store messages and contact information.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file with the following variables:
```
# Supabase credentials
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Bot tokens (get these from BotFather on Telegram)
BOT1_TOKEN=your_bot1_token
BOT2_TOKEN=your_bot2_token
# Add more bot tokens as needed

# Contact name customization
CONTACT_NAME=Customer  # Default prefix for contacts without Telegram username
```

## Bot System Architecture

The bot system is designed to:
- Allow multiple bots to run simultaneously
- Each bot represents a separate contact in the UI
- All bots share common code for Supabase integration
- Messages are tracked per bot

### Files Structure:

- `bots/bot_utils.py` - Common utilities shared by all bots
- `bots/bot1.py`, `bots/bot2.py` - Individual bot implementations
- `bots/bot_template.py` - Template for creating new bots
- `run_all.py` - Script to run all bots simultaneously

## Creating a New Bot

1. Create a new Telegram bot using BotFather and get a token
2. Copy the bot_template.py to a new file (e.g., `bot3.py`)
3. Edit the new file to update BOT_NAME to your bot's name (e.g., "sales", "support") 
4. Add the token to your .env file (e.g., `SALES_TOKEN=your_bot_token`)

Example:
```python
# bot3.py
import os
import asyncio
from dotenv import load_dotenv
from bot_utils import run_bot

# Load environment variables
load_dotenv()

BOT_NAME = "sales" 
TOKEN = os.getenv(f'{BOT_NAME.upper()}_TOKEN')
BOT_IDENTIFIER = BOT_NAME

# Define main function to run this specific bot
def main():
    """
    Main function to run the bot
    """
    if not TOKEN:
        print(f"No bot token provided. Set {BOT_NAME.upper()}_TOKEN in .env file")
        return
    
    print(f"Starting {BOT_IDENTIFIER}...")
    
    # Run the bot with its identifier
    asyncio.run(run_bot(TOKEN, BOT_IDENTIFIER))

if __name__ == '__main__':
    main()
```

## Running Bots

### Run an individual bot:
```bash
python -m bots.bot1  # Run bot1
python -m bots.bot2  # Run bot2
```

### Run all bots simultaneously:
```bash
python run_all.py
```

## How It Works

1. Each bot connects to Telegram's API using a unique token
2. When a user interacts with a bot, it creates a unique contact in Supabase with the format `{user_id}:{bot_identifier}`
3. Messages are saved to Supabase with a reference to this unique contact
4. The UI displays all contacts with their respective conversations
5. When a message is sent from the UI, the appropriate bot delivers it to the user

Each bot will appear as a separate contact in the UI, with customizable naming:
- Technical bots (like bot1, bot2) will show as "Username (bot1)"
- Department bots (like sales, support) will show as "Username via Sales" or "Username via Support"

If a user doesn't have a Telegram username, the system will use the CONTACT_NAME environment variable as a prefix (e.g., "Customer_123456789").

This makes it easy to identify which bot a user is talking to while maintaining a natural conversation flow. You can fully customize the default contact name by changing the CONTACT_NAME variable in your .env file.