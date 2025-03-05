import { NextResponse } from 'next/server';
import { parseNaturalLanguageQuery } from '@/lib/anthropic/client';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Parse the natural language query
    const parsedQuery = await parseNaturalLanguageQuery(prompt);

    if (parsedQuery.error) {
      return NextResponse.json(
        { error: parsedQuery.error },
        { status: 400 }
      );
    }

    // Handle query type
    if (parsedQuery.type === 'query') {
      const { functionName, parameters } = parsedQuery.query;
      
      // Execute the query against Supabase using a direct approach
      if (functionName === 'get_customers_by_message_keyword') {
        // First, get messages matching the keyword
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select('contact_id')
          .ilike('content', `%${parameters.keyword}%`);
          
        if (messageError) throw messageError;
        
        if (!messageData || messageData.length === 0) {
          return NextResponse.json({ 
            type: 'query_result', 
            data: [] 
          });
        }
        
        // Get unique contact IDs
        const contactIds = [...new Set(messageData.map(msg => msg.contact_id))];
        
        // Then get the contact details
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('id, name, contact_info')
          .in('id', contactIds);
          
        if (contactError) throw contactError;
        
        return NextResponse.json({ 
          type: 'query_result', 
          data: contactData || [] 
        });
      }
      
      if (functionName === 'get_customers_by_message_keyword_and_date_range') {
        // First, get messages matching the keyword and date range
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select('contact_id')
          .ilike('content', `%${parameters.keyword}%`)
          .gte('timestamp', parameters.start_date)
          .lte('timestamp', parameters.end_date);
          
        if (messageError) throw messageError;
        
        if (!messageData || messageData.length === 0) {
          return NextResponse.json({ 
            type: 'query_result', 
            data: [] 
          });
        }
        
        // Get unique contact IDs
        const contactIds = [...new Set(messageData.map(msg => msg.contact_id))];
        
        // Then get the contact details
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('id, name, contact_info')
          .in('id', contactIds);
          
        if (contactError) throw contactError;
        
        return NextResponse.json({ 
          type: 'query_result', 
          data: contactData || [] 
        });
      }
    }

    // Handle action type
    if (parsedQuery.type === 'action') {
      if (parsedQuery.action === 'send_message') {
        const { functionName, parameters } = parsedQuery.query;
        
        // Get the list of customers using the direct approach
        let data;
        if (functionName === 'get_customers_by_message_keyword') {
          // First, get messages matching the keyword
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('contact_id')
            .ilike('content', `%${parameters.keyword}%`);
            
          if (messageError) throw messageError;
          
          if (messageData && messageData.length > 0) {
            // Get unique contact IDs
            const contactIds = [...new Set(messageData.map(msg => msg.contact_id))];
            
            // Then get the contact details
            const { data: contactData, error: contactError } = await supabase
              .from('contacts')
              .select('id, name, contact_info')
              .in('id', contactIds);
              
            if (contactError) throw contactError;
            data = contactData;
          } else {
            data = [];
          }
        } else if (functionName === 'get_customers_by_message_keyword_and_date_range') {
          // First, get messages matching the keyword and date range
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('contact_id')
            .ilike('content', `%${parameters.keyword}%`)
            .gte('timestamp', parameters.start_date)
            .lte('timestamp', parameters.end_date);
            
          if (messageError) throw messageError;
          
          if (messageData && messageData.length > 0) {
            // Get unique contact IDs
            const contactIds = [...new Set(messageData.map(msg => msg.contact_id))];
            
            // Then get the contact details
            const { data: contactData, error: contactError } = await supabase
              .from('contacts')
              .select('id, name, contact_info')
              .in('id', contactIds);
              
            if (contactError) throw contactError;
            data = contactData;
          } else {
            data = [];
          }
        }
        
        // Return pending action for approval
        return NextResponse.json({ 
          type: 'pending_action', 
          action: 'send_message',
          message: parsedQuery.message,
          recipients: data || []
        });
      }
    }

    return NextResponse.json(
      { error: 'Unsupported query or action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error processing query:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing your query' },
      { status: 500 }
    );
  }
}