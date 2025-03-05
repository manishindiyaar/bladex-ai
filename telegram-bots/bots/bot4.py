import os
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the parent directory to sys.path to ensure imports work correctly
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.append(str(parent_dir))

from bots.bot_utils import run_bot

# Load environment variables
load_dotenv()

# Custom bot configuration
BOT_NAME = "Tilaj"  # This will be displayed as "User via Support" in the UI
TOKEN = os.getenv(f'{BOT_NAME.upper()}_TOKEN')
BOT_IDENTIFIER = BOT_NAME

# Define main function to run this specific bot
def main():
    """
    Main function to run the support bot
    """
    if not TOKEN:
        print(f"No bot token provided. Set {BOT_NAME.upper()}_TOKEN in .env file")
        return
    
    print(f"Starting {BOT_IDENTIFIER} bot...")
    
    # Run the bot with its identifier
    asyncio.run(run_bot(TOKEN, BOT_IDENTIFIER))

if __name__ == '__main__':
    main()