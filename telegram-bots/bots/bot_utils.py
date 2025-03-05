import os
import json
import logging
import asyncio
import requests
from datetime import datetime, timedelta
from telegram.ext import Application, MessageHandler, CommandHandler, filters
from telegram import Update
from telegram.ext import ContextTypes
from dotenv import load_dotenv
import httpx

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ddoytxtbjzoihucejywh.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkb3l0eHRianpvaWh1Y2VqeXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzA5NzYsImV4cCI6MjA1MDUwNjk3Nn0.WljUWKZRrbgYPVegm1ZYit8OhmgHamzWEVu7rawukt8')

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

def get_logger(bot_name):
    """Get a logger with the bot's name"""
    return logging.getLogger(bot_name)

async def save_message_to_supabase(user_id, username, message_text, direction="incoming", bot_identifier=None, logger=None):
    """
    Save message to Supabase database using REST API
    
    bot_identifier: A unique identifier for the bot (e.g., "bot1", "sales_bot", etc.)
                   This is used to differentiate between different bots in the UI
    """
    if logger is None:
        logger = logging.getLogger(__name__)
        
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        # Construct a unique contact_info that includes the bot identifier
        # Format: telegram_user_id:bot_identifier
        unique_contact_info = f"{user_id}:{bot_identifier}" if bot_identifier else str(user_id)
        
        # Check if contact exists
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/contacts?contact_info=eq.{unique_contact_info}",
            headers=headers
        )
        
        contact_data = response.json()
        
        if len(contact_data) == 0:
            # Create new contact with bot-specific name
            current_time = datetime.utcnow()
            
            # Get custom bot name from environment variable or use a default
            custom_name = os.getenv('CONTACT_NAME', 'User')
            
            # Use either Telegram username, custom name, or user ID
            if username:
                display_name = username
            else:
                display_name = f"{custom_name}_{user_id}"
            
            # Make the display name configurable based on bot_identifier
            # This allows customizing how the contact appears in the UI
            if bot_identifier:
                # If bot_identifier starts with "bot", like "bot1", just add it in parentheses
                if bot_identifier.startswith("bot"):
                    display_name = f"{display_name} ({bot_identifier})"
                else:
                    # For custom names like "sales", "support", use a more natural format
                    display_name = bot_identifier.capitalize()
                
            new_contact = {
                'name': display_name,
                'contact_info': unique_contact_info,
                'last_contact': current_time.isoformat()
            }
            logger.info(f"Creating new contact: {display_name} with ID {unique_contact_info}")
            
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/contacts",
                headers=headers,
                json=new_contact
            )
            
            if response.status_code != 201:
                logger.error(f"Error creating contact: {response.text}")
                return None
                
            response_data = response.json()
            logger.info(f"Contact created with response: {response_data}")
            contact_id = response_data[0]['id']
        else:
            # Update existing contact's last_contact
            contact_id = contact_data[0]['id']
            
            response = requests.patch(
                f"{SUPABASE_URL}/rest/v1/contacts?id=eq.{contact_id}",
                headers=headers,
                json={'last_contact': datetime.utcnow().isoformat()}
            )
        
        # Save message
        current_time = datetime.utcnow().isoformat()
        new_message = {
            'contact_id': contact_id,
            'content': message_text,
            'timestamp': current_time,
            'direction': direction,
            'is_from_customer': direction == 'incoming',
            'is_ai_response': False,  # Set to True for AI responses
            'is_sent': direction == 'incoming'  # Incoming messages are considered sent, outgoing need to be delivered
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/messages",
            headers=headers,
            json=new_message
        )
        
        if response.status_code != 201:
            logger.error(f"Error saving message: {response.text}")
            return None
            
        response_data = response.json()
        logger.info(f"Message saved with ID: {response_data[0]['id']}")
        return response_data[0]['id']
    
    except Exception as e:
        logger.error(f"Error saving message to Supabase: {e}")
        return None

async def get_conversation_history(user_id, limit=5, bot_identifier=None, logger=None):
    """
    Get recent conversation history for a user using REST API
    """
    if logger is None:
        logger = logging.getLogger(__name__)
        
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        
        # Construct a unique contact_info that includes the bot identifier
        unique_contact_info = f"{user_id}:{bot_identifier}" if bot_identifier else str(user_id)
        
        # Get contact ID
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/contacts?contact_info=eq.{unique_contact_info}&select=id",
            headers=headers
        )
        
        contact_data = response.json()
        
        if len(contact_data) == 0:
            return []
        
        contact_id = contact_data[0]['id']
        
        # Get recent messages
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/messages?contact_id=eq.{contact_id}&order=timestamp.desc&limit={limit}",
            headers=headers
        )
        
        messages_data = response.json()
        
        # Format history for AI context
        history = []
        for msg in reversed(messages_data):
            history.append(msg['content'])
        
        return history
    
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        return []

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE, bot_identifier=None, logger=None):
    """
    Handle incoming messages - just save to Supabase, don't auto-respond
    """
    if logger is None:
        logger = logging.getLogger(__name__)
        
    message = update.message
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name
    message_text = message.text
    
    # Store user info in context for later use
    if not hasattr(context.bot_data, 'user_info'):
        context.bot_data['user_info'] = {}
    
    context.bot_data['user_info'][user_id] = {
        'username': username,
        'chat_id': update.effective_chat.id,
        'contact_info': f"{user_id}:{bot_identifier}" if bot_identifier else str(user_id)
    }
    
    # Log the message
    logger.info(f"Received message from {username} (ID: {user_id}, Chat ID: {update.effective_chat.id}): {message_text}")
    
    # Save incoming message to Supabase
    message_id = await save_message_to_supabase(user_id, username, message_text, "incoming", bot_identifier, logger)
    
    # Don't send automatic reply - replies will be sent from UI
    logger.info(f"Message saved to Supabase with ID: {message_id}. Waiting for reply from UI.")

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE, bot_identifier=None, logger=None):
    """
    Handle /start command
    """
    if logger is None:
        logger = logging.getLogger(__name__)
        
    user = update.effective_user
    welcome_message = (
        f"Hi {user.first_name}! 👋\n\n"
        f"Welcome to our customer service bot. Feel free to ask any questions, "
        f"and our team will assist you promptly."
    )
    
    # Store user info in context for later use
    if not hasattr(context.bot_data, 'user_info'):
        context.bot_data['user_info'] = {}
    
    context.bot_data['user_info'][user.id] = {
        'username': user.username or user.first_name,
        'chat_id': update.effective_chat.id,
        'contact_info': f"{user.id}:{bot_identifier}" if bot_identifier else str(user.id)
    }
    
    await update.message.reply_text(welcome_message)
    
    # Save the user info and welcome message to Supabase
    await save_message_to_supabase(
        user.id, 
        user.username or user.first_name, 
        welcome_message, 
        "outgoing",
        bot_identifier,
        logger
    )

async def check_outgoing_messages(context: ContextTypes.DEFAULT_TYPE, bot_identifier=None, logger=None):
    """
    Periodically check for outgoing messages in Supabase and send them to Telegram users
    """
    if logger is None:
        logger = logging.getLogger(__name__)
        
    try:
        logger.info("Checking for outgoing messages to send...")
        
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        
        # Initialize query variable with a default value
        query = f"{SUPABASE_URL}/rest/v1/messages?select=id,contact_id,content,timestamp&direction=eq.outgoing&is_sent=eq.false"
        
        # Get contacts associated with this bot
        if bot_identifier:
            contacts_query = f"{SUPABASE_URL}/rest/v1/contacts?select=id&contact_info=like.%:{bot_identifier}"
            logger.info(f"Searching for contacts with query: {contacts_query}")
            contacts_response = requests.get(contacts_query, headers=headers)
            if contacts_response.status_code == 200:
                contacts = contacts_response.json()
                logger.info(f"Found {len(contacts)} contacts for bot {bot_identifier}")
                if contacts:
                    contact_ids = [contact['id'] for contact in contacts]
                    # Format the contact_ids correctly for the REST API - no quotes around UUIDs
                    contact_ids_str = ','.join(contact_ids)
                    query = f"{SUPABASE_URL}/rest/v1/messages?select=id,contact_id,content,timestamp&direction=eq.outgoing&is_sent=eq.false&contact_id=in.({contact_ids_str})"
        
        # Log what we're doing
        logger.info(f"Using query to find messages for bot {bot_identifier}")
        logger.info(f"Checking for messages with query: {query}")
        
        response = requests.get(
            query,
            headers=headers
        )
        
        if response.status_code != 200:
            logger.error(f"Error fetching outgoing messages: {response.text}")
            return
            
        outgoing_messages = response.json()
        
        if not outgoing_messages:
            logger.info("No new outgoing messages to send")
            return
            
        # Debug: Print all outgoing messages
        for i, msg in enumerate(outgoing_messages):
            logger.info(f"Message {i+1}: ID={msg['id']}, contact_id={msg['contact_id']}, is_sent={msg.get('is_sent')}, content={msg['content'][:30]}...")
            
        logger.info(f"Found {len(outgoing_messages)} outgoing messages to send")
        
        # Track processed messages to avoid duplicates within the same run
        processed_message_ids = set()
        
        # For each message, get the contact info and send the message
        for message in outgoing_messages:
            try:
                message_id = message['id']
                
                # Skip if we've already processed this message in this run
                if message_id in processed_message_ids:
                    logger.info(f"Already processed message {message_id} in this run, skipping")
                    continue
                
                # Immediately mark as sent to prevent other instances from processing it
                # Use Prefer: return=representation to get the updated record
                update_headers = {
                    **headers,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                }
                
                # Try to mark the message as sent before processing
                update_response = requests.patch(
                    f"{SUPABASE_URL}/rest/v1/messages?id=eq.{message_id}",
                    headers=update_headers,
                    json={'is_sent': True}
                )
                
                if update_response.status_code != 200:
                    logger.warning(f"Could not mark message {message_id} as sent, skipping to avoid duplicate processing")
                    continue
                
                # Add to processed set
                processed_message_ids.add(message_id)
                
                contact_id = message['contact_id']
                
                # Get contact info
                contact_response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/contacts?id=eq.{contact_id}&select=contact_info",
                    headers=headers
                )
                
                if contact_response.status_code != 200 or not contact_response.json():
                    logger.error(f"Error fetching contact info for ID {contact_id}")
                    continue
                    
                contact_info = contact_response.json()[0]['contact_info']
                
                # Extract user_id from contact_info - simpler approach
                contact_info_str = str(contact_info)  # Ensure it's a string
                
                # Double-check that this message is intended for this bot
                if bot_identifier and ":" in contact_info_str:
                    parts = contact_info_str.split(":")
                    message_bot_id = parts[1] if len(parts) > 1 else None
                    
                    # Skip if this message is for a different bot
                    if message_bot_id != bot_identifier:
                        logger.info(f"Skipping message for bot {message_bot_id}, we are {bot_identifier}")
                        continue
                
                # Handle both formats: plain user_id or user_id:bot_id
                if ":" in contact_info_str:
                    user_id = contact_info_str.split(":")[0]
                else:
                    user_id = contact_info_str
                
                logger.info(f"Extracted user_id: {user_id} from contact_info: {contact_info_str}")
                
                # Get chat_id from context.bot_data if available, or use contact_info
                chat_id = None
                
                try:
                    # Try to convert to int for dictionary lookup
                    user_int_id = int(user_id)
                    
                    # Check if we have this user in bot_data
                    if hasattr(context.bot_data, 'user_info') and user_int_id in context.bot_data['user_info']:
                        chat_id = context.bot_data['user_info'][user_int_id]['chat_id']
                        logger.info(f"Using chat_id from bot memory: {chat_id}")
                    else:
                        # Fall back to using the user_id as chat_id
                        chat_id = user_id
                        logger.info(f"No chat_id in memory, using user_id as chat_id: {user_id}")
                except ValueError:
                    # If user_id is not an integer, just use it directly
                    chat_id = user_id
                    logger.warning(f"Could not convert user_id to integer, using as-is: {user_id}")
                
                # Send message to Telegram
                await context.bot.send_message(
                    chat_id=chat_id,
                    text=message['content']
                )
                
                logger.info(f"Sent message to chat_id {chat_id}: {message['content']}")
                logger.info(f"Message {message_id} successfully delivered and marked as sent")
                
            except Exception as e:
                logger.error(f"Error sending message {message['id']}: {e}")
    
    except Exception as e:
        logger.error(f"Error in check_outgoing_messages: {e}")

def create_bot_application(token, bot_identifier, logger=None):
    """
    Create and configure a bot application with the given token and identifier
    """
    if logger is None:
        logger = logging.getLogger(bot_identifier)
        
    if not token:
        logger.error(f"No bot token provided for {bot_identifier}")
        return None
    
    logger.info(f"Starting {bot_identifier}...")
    application = Application.builder().token(token).build()
    
    # Add handlers with the bot_identifier
    application.add_handler(CommandHandler("start", 
        lambda update, context: start_command(update, context, bot_identifier, logger)))
    
    application.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND, 
        lambda update, context: handle_message(update, context, bot_identifier, logger)))
    
    # Add job to check for outgoing messages every 5 seconds
    application.job_queue.run_repeating(
        lambda context: check_outgoing_messages(context, bot_identifier, logger), 
        interval=5, 
        first=5
    )
    
    return application

async def run_bot(token, bot_identifier):
    """
    Run a bot with the given token and identifier
    """
    logger = get_logger(bot_identifier)
    application = create_bot_application(token, bot_identifier, logger)
    
    if application:
        # Start the Bot
        await application.initialize()
        await application.start()
        await application.updater.start_polling()
        
        logger.info(f"{bot_identifier} is running...")
        
        try:
            # Keep the bot running until interrupted
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info(f"{bot_identifier} stopped by user")
        finally:
            # Proper shutdown sequence
            logger.info(f"Stopping {bot_identifier}...")
            try:
                # Stop the application first (this will stop all jobs)
                await application.stop()
                # Then stop polling
                if hasattr(application.updater, '_running') and application.updater._running:
                    await application.updater.stop_polling()
                # Wait a bit for clean shutdown
                await asyncio.sleep(0.5)
                # Finally complete the shutdown
                await application.shutdown()
                logger.info(f"{bot_identifier} stopped")
            except Exception as e:
                logger.error(f"Error stopping {bot_identifier}: {e}")