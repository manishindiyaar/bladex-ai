'use client'

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Customer } from "./ChatDashboard";

interface CustomerListProps {
  customers: Customer[];
  selectedCustomerId?: string;
  onSelectCustomer: (id: string) => void;
  loading?: boolean;
}

const CustomerList = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  loading = false
}: CustomerListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  // Track which conversations have been viewed
  const [viewedCustomers, setViewedCustomers] = useState<Record<string, boolean>>({});
  // Track last known unread counts to detect new messages
  const lastUnreadCountsRef = useRef<Record<string, number>>({});

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to generate a background color based on the customer name
  const getProfileColor = (name: string) => {
    // Simple hash function to generate a consistent color for each name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360; // Use modulo to get a value between 0-359 for hue
    return `hsl(${hue}, 70%, 80%)`; // Use HSL for a nice pastel color
  };

  // When a customer is selected, mark it as viewed
  useEffect(() => {
    if (selectedCustomerId) {
      setViewedCustomers(prev => ({
        ...prev,
        [selectedCustomerId]: true
      }));
    }
  }, [selectedCustomerId]);

  // Detect new messages by comparing current unread counts with previous ones
  useEffect(() => {
    const currentUnreadCounts: Record<string, number> = {};
    
    // Build current unread counts map
    customers.forEach(customer => {
      currentUnreadCounts[customer.id] = customer.unreadCount || 0;
      
      // Get previous unread count for this customer
      const previousCount = lastUnreadCountsRef.current[customer.id] || 0;
      const currentCount = customer.unreadCount || 0;
      
      // If unread count increased and this isn't the selected customer, mark as unviewed
      if (currentCount > previousCount && customer.id !== selectedCustomerId) {
        setViewedCustomers(prev => ({
          ...prev,
          [customer.id]: false // Mark as unviewed when new messages arrive
        }));
      }
    });
    
    // Update the ref with current counts for next comparison
    lastUnreadCountsRef.current = currentUnreadCounts;
  }, [customers, selectedCustomerId]);

  // Handle customer selection and mark as viewed
  const handleSelectCustomer = (id: string) => {
    // Mark this customer as viewed
    setViewedCustomers(prev => ({
      ...prev,
      [id]: true
    }));
    
    // Call the parent's onSelectCustomer function
    onSelectCustomer(id);
  };

  // Check if a customer has unread messages that haven't been viewed
  const hasUnviewedMessages = (customer: Customer) => {
    // If we haven't explicitly tracked this customer yet, show bubble if they have unread messages
    if (viewedCustomers[customer.id] === undefined) {
      return customer.unreadCount && customer.unreadCount > 0;
    }
    
    // Otherwise, only show if they have unread messages AND haven't been viewed
    return customer.unreadCount && customer.unreadCount > 0 && !viewedCustomers[customer.id];
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full bg-gray-100 p-2 pl-10 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedCustomerId === customer.id ? "bg-gray-100" : ""
              }`}
              onClick={() => handleSelectCustomer(customer.id)}
            >
              <div className="flex items-center">
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center text-gray-700 mr-3 flex-shrink-0"
                  style={{ backgroundColor: getProfileColor(customer.name) }}
                >
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h3 className={`font-medium truncate ${hasUnviewedMessages(customer) ? 'font-bold' : ''}`}>
                      {customer.name}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{customer.timestamp}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className={`text-sm truncate max-w-[180px] ${hasUnviewedMessages(customer) ? 'text-black font-medium' : 'text-gray-500'}`}>
                      {customer.lastMessage}
                    </p>
                    {hasUnviewedMessages(customer) ? (
                      <span className="bg-whatsapp-green text-white text-xs px-2 rounded-full ml-2 flex-shrink-0">
                        {customer.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerList;