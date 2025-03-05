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
TOKEN = os.getenv('MAXO_TOKEN')
BOT_IDENTIFIER = "Maxo"

# Define main function to run this specific bot
def main():
    """
    Main function to run bot1
    """
    if not TOKEN:
        print(f"No bot token provided. Set {BOT_IDENTIFIER}_TOKEN in .env file")
        return
    
    print(f"Starting {BOT_IDENTIFIER}...")
    
    # Run the bot with its identifier
    asyncio.run(run_bot(TOKEN, BOT_IDENTIFIER))

if __name__ == '__main__':
    main()