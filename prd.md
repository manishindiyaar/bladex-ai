# Customer Service Automation Tool
> Product Requirements Document (PRD)

## 1. Objective 🎯

Build a powerful business tool that enables:

- **Collection**: Gather customer messages from Telegram (WhatsApp support planned)
- **Viewing**: Access all chats in a live dashboard
- **Querying & Acting**: Use natural language for customer data queries and actions
- **History**: Maintain complete customer interaction history

### MVP Focus
- Telegram integration
- Basic AI auto-replies
- Natural language queries
- Actionable prompts with approval system

## 2. Core Components 🔧

### 2.1 Telegram Bot
- Collects incoming messages
- Sends AI-generated or human-approved replies
- Executes customer communication actions

### 2.2 Database (Supabase)
- Stores messages
- Maintains customer profiles
- Manages metadata and contact information

### 2.3 AI Brain (LLM)
- Powers automated replies
- Parses natural language into structured queries/actions
- Handles intent recognition

### 2.4 Dashboard
- Displays live chat interface
- Provides query/action interface
- Manages approval workflows

### 2.5 Query and Action Engine
- Maps prompts to database functions
- Handles action approvals
- Executes communication tasks

## 3. Data Flow 🔄

### 3.1 Message Flow (Customer Interaction)
1. Customer sends Telegram message
2. Bot receives and logs in Supabase
3. AI generates auto-reply (if applicable)
4. Message appears in Dashboard

### 3.2 Query Flow (Business Owner)
1. Owner inputs natural language query
2. AI Brain parses to database function
3. Backend executes Supabase query
4. Dashboard displays results

### 3.3 Action Flow (Business Owner)
Example: "Send hii to all those people who greeted me today"

1. **Prompt Submission**
   - Owner submits prompt via Dashboard
   - Backend API processes request

2. **AI Processing**
   ```json
   {
     "type": "action",
     "action": "send_message",
     "message": "hii",
     "query": {
       "functionName": "get_customers_by_message_keyword_and_date_range",
       "parameters": {
         "keyword": "greet",
         "start_date": "2025-03-03 00:00:00",
         "end_date": "2025-03-03 23:59:59"
       }
     }
   }
   ```

3. **Execution Flow**
   - Backend runs query
   - Shows approval interface
   - Executes action upon approval
   - Confirms completion

## 4. Database Design 💾

### 4.1 Tables

#### contacts
| Column | Type | Description |
|--------|------|-------------|
| id | int (PK) | Primary identifier |
| name | text | Customer name |
| contact_info | text | Telegram chat ID |

#### messages
| Column | Type | Description |
|--------|------|-------------|
| id | int (PK) | Primary identifier |
| contact_id | int (FK) | Reference to contacts |
| content | text | Message content |
| timestamp | datetime | UTC timestamp |
| direction | enum | "incoming"/"outgoing" |

### 4.2 Query Functions

#### get_customers_by_message_keyword
- **Returns**: id, name, contact_info
- **Logic**: Filters by keyword in messages

#### get_customers_by_message_keyword_and_date_range
- **Returns**: id, name, contact_info
- **Logic**: Filters by keyword and date range
- **Example**: "today" = current date 00:00:00 to 23:59:59 UTC

## 5. AI Automation 🤖

### 5.1 Auto-Replies
- Triggered by incoming messages
- Context-aware response generation
- Confidence threshold filtering

### 5.2 Query and Action Parsing
**Endpoint**: `/api/query`

**Input Format**:
```json
{
  "prompt": "send hii to all those people who greeted me today"
}
```

**Process**:
1. LLM receives:
   - Database schema
   - Available functions
   - Available actions
   - Current date

2. LLM outputs structured JSON
3. Backend validates and executes

## 6. Human Backup & Error Handling 🛟

### Safety Measures
- Auto-replies: <80% confidence flagged for review
- Actions: Require human approval
- Error logging for debugging

### Error Responses
```json
{
  "error": "Sorry, I didn't understand that. Try 'send <message> to <query>'."
}
```

## 7. Dashboard Features 🖥️

### Core Features
- **Chat View**: Live Telegram chat feed
- **Query/Action Input**: Natural language interface
- **Results Pane**: Query results display
- **Action Confirmation**: Approval interface
- **Status Updates**: Action execution feedback

### Interface Elements
- Text input for queries/actions
- Results display area
- Confirmation popups
- Status notifications

## 8. Natural Language System 🗣️

### Supported Actions (MVP)
- `send_message`: Customer communication

### Processing Flow
1. LLM parses intent
2. Backend validates
3. Query execution
4. User approval
5. Action execution

---

*Note: This document is subject to updates and revisions as the project evolves.*