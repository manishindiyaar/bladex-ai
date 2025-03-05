import os
import asyncio
import importlib
import sys
from pathlib import Path
from dotenv import load_dotenv
import logging
import signal
import fcntl
import atexit
from concurrent.futures import ProcessPoolExecutor

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logger = logging.getLogger(__name__)

# Lock file path
LOCK_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "run_all.lock")
lock_file_handle = None

def acquire_lock():
    """Try to acquire a lock to ensure only one instance runs at a time"""
    global lock_file_handle
    
    try:
        # Open the lock file (create if it doesn't exist)
        lock_file_handle = open(LOCK_FILE, 'w')
        
        # Try to acquire an exclusive lock (non-blocking)
        fcntl.flock(lock_file_handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        
        # Write PID to lock file
        lock_file_handle.write(str(os.getpid()))
        lock_file_handle.flush()
        
        logger.info(f"Lock acquired. Process ID: {os.getpid()}")
        return True
        
    except IOError:
        # Another instance is already running
        try:
            with open(LOCK_FILE, 'r') as f:
                pid = f.read().strip()
                logger.error(f"Another instance is already running (PID: {pid})")
        except:
            logger.error("Another instance is already running")
            
        if lock_file_handle:
            lock_file_handle.close()
        return False

def release_lock():
    """Release the lock when the program exits"""
    global lock_file_handle
    
    if lock_file_handle:
        logger.info("Releasing lock")
        fcntl.flock(lock_file_handle, fcntl.LOCK_UN)
        lock_file_handle.close()
        
        # Try to remove the lock file
        try:
            os.remove(LOCK_FILE)
        except:
            pass

# Register the cleanup function to run when the program exits
atexit.register(release_lock)

# Handle signals
def signal_handler(sig, frame):
    logger.info(f"Received signal {sig}, shutting down...")
    release_lock()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Add the current directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from bots.bot_utils import create_bot_application, get_logger

# Load environment variables
load_dotenv()

def run_bot_process(bot_file):
    """Run a single bot in a separate process"""
    try:
        # Extract module name (without .py)
        module_name = bot_file.replace(".py", "")
        
        # Skip utility files
        if module_name in ["bot_utils", "bot_template"]:
            return
            
        # Import the bot module
        bot_module = importlib.import_module(f"bots.{module_name}")
        
        # Get the bot identifier
        bot_identifier = getattr(bot_module, 'BOT_IDENTIFIER', module_name)
        
        # Configure logging for this bot
        bot_logger = logging.getLogger(bot_identifier)
        
        # Run the bot using its main function
        if hasattr(bot_module, 'main'):
            bot_module.main()
        else:
            logger.warning(f"Bot module {module_name} has no main function")
        
    except Exception as e:
        logger.error(f"Error running bot {bot_file}: {e}")

async def run_all_bots():
    """Run all bots concurrently"""
    # Check if we can acquire the lock
    if not acquire_lock():
        logger.error("Failed to acquire lock. Exiting to prevent multiple instances.")
        return
        
    try:
        # Get all bot modules
        bot_files = [f for f in os.listdir("bots") if f.endswith(".py") and f.startswith("bot")]
        
        # Filter out utility files
        bot_files = [f for f in bot_files if f not in ["bot_utils.py", "bot_template.py"]]
        
        logger.info(f"Found {len(bot_files)} bots: {', '.join(bot_files)}")
        
        # Create tasks for each bot
        tasks = []
        for bot_file in bot_files:
            # Create a task for this bot
            task = asyncio.create_task(asyncio.to_thread(run_bot_process, bot_file))
            tasks.append(task)
            
            logger.info(f"Started bot: {bot_file}")
        
        # Wait for all tasks to complete
        await asyncio.gather(*tasks)
        
    except Exception as e:
        logger.error(f"Error in run_all_bots: {e}")
    finally:
        # Make sure to release the lock when done
        release_lock()

if __name__ == "__main__":
    try:
        # Run the main function
        asyncio.run(run_all_bots())
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received, shutting down...")
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
    finally:
        # Make sure to release the lock when done
        release_lock()