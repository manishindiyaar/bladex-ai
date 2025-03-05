'use client'

import { ActionData } from "./ChatDashboard";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ActionConfirmationProps {
  action: ActionData;
  onConfirm: () => void;
  onCancel: () => void;
}

const ActionConfirmation = ({ action, onConfirm, onCancel }: ActionConfirmationProps) => {
  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Are you sure you want to send this message to the following recipients?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <p className="font-medium">Message:</p>
            <p className="text-gray-700">{action.message}</p>
          </div>

          <div>
            <p className="font-medium mb-2">Recipients:</p>
            <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-md">
              {action.recipients.length === 0 ? (
                <p className="text-gray-500">No matching recipients found</p>
              ) : (
                <ul className="list-disc list-inside">
                  {action.recipients.map((recipient) => (
                    <li key={recipient.id} className="text-gray-700">
                      {recipient.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={action.recipients.length === 0}>
            {action.recipients.length === 0 ? "No Recipients" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActionConfirmation;