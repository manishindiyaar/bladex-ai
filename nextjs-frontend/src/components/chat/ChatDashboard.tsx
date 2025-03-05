'use client'

import { useState, useEffect } from "react";
import CustomerList from "./CustomerList";
import ChatInterface from "./ChatInterface";
import QueryInput from "./QueryInput";
import ActionConfirmation from "./ActionConfirmation";
import QueryResults from "./QueryResults";
import { supabase } from "@/lib/supabase/client";
// import { ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
export interface Customer {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  isAI?: boolean;
  isSent: boolean;
}

export interface ActionData {
  action: string;
  message: string;
  recipients: {
    id: string;
    name: string;
    contact_info: string;
  }[];
}

const ChatDashboard = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const [isCopilotActive, setIsCopilotActive] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionData | null>(null);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select(`
            id,
            name,
            contact_info,
            last_contact,
            messages (
              id,
              content,
              timestamp,
              is_from_customer
            )
          `)
          .order('last_contact', { ascending: false });

        if (error) throw error;

        const formattedCustomers: Customer[] = data.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          lastMessage: customer.messages?.[0]?.content || "",
          timestamp: new Date(customer.last_contact).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          unreadCount: customer.messages?.filter((m: any) => m.is_from_customer)?.length || 0
        }));

        setCustomers(formattedCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();

    // Set up real-time subscription for new contacts
    const channel = supabase
      .channel('contacts-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts'
        },
        (payload) => {
          console.log('Contact change detected:', payload);
          fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch messages for selected customer
  useEffect(() => {
    if (!selectedCustomerId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('contact_id', selectedCustomerId)
          .order('timestamp', { ascending: true });

        if (error) throw error;

        const formattedMessages: Message[] = data.map((message: any) => ({
          id: message.id,
          content: message.content,
          timestamp: new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isAI: message.is_ai_response,
          isSent: message.direction === 'outgoing'
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Set up real-time subscription for messages
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `contact_id=eq.${selectedCustomerId}`
        },
        (payload) => {
          console.log('New message detected:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCustomerId]);

  const handleSendMessage = async (content: string) => {
    if (!selectedCustomerId) return;

    try {
      // Set the current time to ensure consistency
      const timestamp = new Date().toISOString();
      
      // Insert message into Supabase
      const { error } = await supabase
        .from('messages')
        .insert({
          contact_id: selectedCustomerId,
          content,
          direction: 'outgoing',
          is_ai_response: false,
          is_from_customer: false,
          is_sent: false, // Will be updated by the bot once sent
          timestamp,
        });

      if (error) throw error;

      // Update customer's last_contact timestamp
      await supabase
        .from('contacts')
        .update({ last_contact: timestamp })
        .eq('id', selectedCustomerId);
        
      console.log(`Message sent and will be delivered by the bot: ${content}`);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuery = async (prompt: string) => {
    try {
      setIsProcessingQuery(true); // Show processing state in query input
      
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.type === 'query_result') {
        console.log('Query results:', data.data);
        // Display query results
        setQueryResults(data.data);
      } else if (data.type === 'pending_action') {
        // Show action confirmation dialog
        setPendingAction({
          action: data.action,
          message: data.message,
          recipients: data.recipients
        });
      } else if (data.error) {
        console.error('Query error:', data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error processing query:', error);
      alert(`Error processing query: ${error.message}`);
    } finally {
      setIsProcessingQuery(false); // Hide processing state
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    try {
      const response = await fetch('/api/execute-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: pendingAction.action,
          message: pendingAction.message,
          recipients: pendingAction.recipients
        }),
      });

      const data = await response.json();
      console.log('Action result:', data);

      // Close the confirmation dialog
      setPendingAction(null);

      // Show success/error message to user
    } catch (error) {
      console.error('Error executing action:', error);
      // Show error message to user
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
  };

  const toggleCopilot = () => {
    setIsCopilotActive(!isCopilotActive);
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative">
      {/* Copilot Toggle Button */}
      {/* <button
        onClick={toggleCopilot}
        className="fixed left-6 top-28 z-50 bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors w-56 text-lg font-medium"
        aria-label="Toggle Copilot"
      >
        {isCopilotActive ? (
          <div className="flex items-center">
            <ToggleRight className="w-10 h-8 text-green-500 mr-2" />
            Copilot Mode
          </div>
        ) : (
          <div className="flex items-center">
            <ToggleLeft className="w-10 h-8 text-gray-400 mr-2" />
            Copilot Mode
          </div>
        )}
      </button> */}

      {/* Natural Language Query Input */}
      <div className="w-full bg-white p-4 border-b border-gray-200 shadow-sm">
        <QueryInput 
          onSubmit={handleQuery} 
          isProcessing={isProcessingQuery} 
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 overflow-hidden">
        <CustomerList
          customers={customers}
          onSelectCustomer={setSelectedCustomerId}
          selectedCustomerId={selectedCustomerId}
          loading={loading}
        />
        
        {selectedCustomer ? (
          <ChatInterface
            customerName={selectedCustomer.name}
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-whatsapp-bg">
            <p className="text-gray-500 text-lg">Select a customer to start chatting</p>
          </div>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      {pendingAction && (
        <ActionConfirmation
          action={pendingAction}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
        />
      )}

      {/* Query Results Dialog */}
      {queryResults && (
        <QueryResults
          results={queryResults}
          onClose={() => setQueryResults(null)}
          onSelectContact={setSelectedCustomerId}
        />
      )}
    </div>
  );
};

export default ChatDashboard;