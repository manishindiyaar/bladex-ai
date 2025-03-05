# Supabase Database Setup

This guide explains how to set up the Supabase database for the Bladex AI customer service automation platform.

## Requirements

- A Supabase account
- Access to the Supabase SQL editor

## Database Schema

The database consists of two main tables:

1. `contacts` - Stores customer information
2. `messages` - Stores all messages, linked to contacts

These tables are connected via a foreign key relationship: `messages.contact_id` references `contacts.id`.

## Setup Instructions

1. **Create a new Supabase project** (if you haven't already)

2. **Execute the schema.sql file in the SQL Editor**:
   - Open the Supabase dashboard for your project
   - Navigate to the SQL Editor
   - Create a new query
   - Copy the contents of `schema.sql` from this directory
   - Run the query

   This will create:
   - The `contacts` and `messages` tables
   - Appropriate indexes
   - Functions for querying customers
   - A trigger to automatically update a contact's `last_contact` timestamp
   - Row-level security policies

3. **Enable Realtime**:
   - Go to Database → Replication
   - Make sure the "Realtime" feature is enabled
   - Verify that both `contacts` and `messages` tables are included

## Table Structure

### contacts

| Column       | Type                     | Description                       |
|--------------|--------------------------|-----------------------------------|
| id           | UUID (PK)                | Unique identifier                 |
| name         | TEXT                     | Contact's name                    |
| contact_info | TEXT                     | Telegram chat ID or other contact |
| last_contact | TIMESTAMP WITH TIME ZONE | Last contact timestamp           |
| created_at   | TIMESTAMP WITH TIME ZONE | Creation timestamp               |

### messages

| Column          | Type                     | Description                      |
|-----------------|--------------------------|----------------------------------|
| id              | UUID (PK)                | Unique identifier                |
| contact_id      | UUID (FK)                | Reference to contacts.id         |
| content         | TEXT                     | Message content                  |
| timestamp       | TIMESTAMP WITH TIME ZONE | Message timestamp                |
| direction       | TEXT                     | 'incoming' or 'outgoing'         |
| is_from_customer| BOOLEAN                  | Whether message is from customer |
| is_ai_response  | BOOLEAN                  | Whether message is from AI       |
| created_at      | TIMESTAMP WITH TIME ZONE | Creation timestamp               |

## Query Functions

Two SQL functions are provided for natural language queries:

1. `get_customers_by_message_keyword(keyword TEXT)` - Find customers who sent messages containing a keyword

2. `get_customers_by_message_keyword_and_date_range(keyword TEXT, start_date TIMESTAMP, end_date TIMESTAMP)` - Find customers who sent messages containing a keyword within a date range

## Testing

After setting up the schema, you can test it by:

1. Manually inserting a contact:

```sql
INSERT INTO contacts (name, contact_info) 
VALUES ('Test User', '123456789');
```

2. Inserting a message for this contact:

```sql
INSERT INTO messages (contact_id, content, direction, is_from_customer) 
VALUES (
  (SELECT id FROM contacts WHERE contact_info = '123456789'),
  'Hello from Telegram!',
  'incoming',
  true
);
```

3. Query the data:

```sql
SELECT c.name, m.content, m.timestamp 
FROM contacts c
JOIN messages m ON c.id = m.contact_id 
ORDER BY m.timestamp DESC;
```