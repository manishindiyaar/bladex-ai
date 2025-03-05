import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const { action, message, recipients } = await request.json();

    if (!action || !message || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Action, message, and recipients are required' },
        { status: 400 }
      );
    }

    if (action === 'send_message') {
      // In a real implementation, this would call the Telegram API to send messages
      // For the MVP, we'll just insert the messages into the database
      
      const results = [];
      const errors = [];

      for (const recipient of recipients) {
        // Insert message record for each recipient
        const { data, error } = await supabase
          .from('messages')
          .insert({
            contact_id: recipient.id,
            content: message,
            direction: 'outgoing',
            is_from_customer: false,
            is_ai_response: false,
            timestamp: new Date().toISOString(),
          })
          .select();

        if (error) {
          errors.push({ recipient: recipient.name, error: error.message });
        } else {
          results.push({ recipient: recipient.name, status: 'sent' });
          
          // Update the contact's last_contact timestamp
          await supabase
            .from('contacts')
            .update({ last_contact: new Date().toISOString() })
            .eq('id', recipient.id);
        }
      }

      if (errors.length > 0) {
        return NextResponse.json({ 
          status: 'partial_success',
          message: 'Some messages could not be sent',
          results,
          errors
        });
      }

      return NextResponse.json({ 
        status: 'success',
        message: 'Messages sent successfully',
        results
      });
    }

    return NextResponse.json(
      { error: 'Unsupported action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error executing action:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while executing the action' },
      { status: 500 }
    );
  }
}