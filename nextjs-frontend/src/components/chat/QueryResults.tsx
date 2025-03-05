'use client'

import { X } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  contact_info: string;
}

interface QueryResultsProps {
  results: Contact[];
  onClose: () => void;
  onSelectContact: (id: string) => void;
}

const QueryResults = ({ results, onClose, onSelectContact }: QueryResultsProps) => {
  if (results.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Query Results</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <p>No matching contacts found.</p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Query Results</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="mb-3">Found {results.length} matching contacts:</p>
          <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md">
            <ul className="divide-y divide-gray-200">
              {results.map((contact) => (
                <li 
                  key={contact.id} 
                  className="py-2 px-1 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onSelectContact(contact.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-500">ID: {contact.contact_info}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueryResults;