-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.contacts;

-- Create contacts table
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_info TEXT NOT NULL UNIQUE, -- This stores Telegram chat ID
    last_contact TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Enable RLS
    CONSTRAINT valid_contact_info CHECK (contact_info IS NOT NULL AND contact_info != '')
);

-- Add comments to the table and columns
COMMENT ON TABLE public.contacts IS 'Stores customer contact information';
COMMENT ON COLUMN public.contacts.id IS 'Unique identifier for the contact';
COMMENT ON COLUMN public.contacts.name IS 'Name of the contact';
COMMENT ON COLUMN public.contacts.contact_info IS 'Telegram chat ID or other contact identifier';
COMMENT ON COLUMN public.contacts.last_contact IS 'Timestamp of the last contact with this customer';
COMMENT ON COLUMN public.contacts.created_at IS 'Timestamp when the contact was created';

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    is_from_customer BOOLEAN DEFAULT FALSE,
    is_ai_response BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,  -- Flag to track if outgoing messages were sent to Telegram
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comments to the table and columns
COMMENT ON TABLE public.messages IS 'Stores all messages sent to and received from contacts';
COMMENT ON COLUMN public.messages.id IS 'Unique identifier for the message';
COMMENT ON COLUMN public.messages.contact_id IS 'Foreign key to contacts table';
COMMENT ON COLUMN public.messages.content IS 'Content of the message';
COMMENT ON COLUMN public.messages.timestamp IS 'Timestamp when the message was sent or received';
COMMENT ON COLUMN public.messages.direction IS 'Direction of the message: incoming or outgoing';
COMMENT ON COLUMN public.messages.is_from_customer IS 'Whether this message is from the customer (true) or from the system/operator (false)';
COMMENT ON COLUMN public.messages.is_ai_response IS 'Whether this message was generated by AI';
COMMENT ON COLUMN public.messages.created_at IS 'Timestamp when the message was created in the database';

-- Create indexes
CREATE INDEX idx_contacts_contact_info ON public.contacts(contact_info);
CREATE INDEX idx_messages_contact_id ON public.messages(contact_id);
CREATE INDEX idx_messages_timestamp ON public.messages(timestamp);

-- Create function to update last_contact in contacts when a new message is inserted
CREATE OR REPLACE FUNCTION public.update_contact_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.contacts
    SET last_contact = NEW.timestamp
    WHERE id = NEW.contact_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_contact
CREATE TRIGGER update_contact_last_contact_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_contact_last_contact();

-- Create functions for querying customers
CREATE OR REPLACE FUNCTION public.get_customers_by_message_keyword(keyword TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    contact_info TEXT
) AS $$
BEGIN
    RETURN QUERY 
    SELECT DISTINCT c.id, c.name, c.contact_info
    FROM public.contacts c
    JOIN public.messages m ON c.id = m.contact_id
    WHERE m.content ILIKE '%' || keyword || '%'
    ORDER BY c.last_contact DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_customers_by_message_keyword_and_date_range(
    keyword TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    contact_info TEXT
) AS $$
BEGIN
    RETURN QUERY 
    SELECT DISTINCT c.id, c.name, c.contact_info
    FROM public.contacts c
    JOIN public.messages m ON c.id = m.contact_id
    WHERE m.content ILIKE '%' || keyword || '%'
    AND m.timestamp >= start_date
    AND m.timestamp <= end_date
    ORDER BY c.last_contact DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, we'll allow all access for simplicity)
CREATE POLICY "Allow full access to contacts" ON public.contacts FOR ALL USING (true);
CREATE POLICY "Allow full access to messages" ON public.messages FOR ALL USING (true);

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;