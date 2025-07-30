
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Eye } from 'lucide-react';
import { getTopUpRecords, TopUpRecord } from '@/utils/referralUtils';

interface UserTopUpRecordsProps {
  userId: string;
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

const UserTopUpRecords = ({ userId, username, isOpen, onClose }: UserTopUpRecordsProps) => {
  const topUpRecords = getTopUpRecords(userId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gaming-dark border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">
              Top-up Records - {username}
            </DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Referrer Commission</TableHead>
                <TableHead className="text-gray-300">Commission Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUpRecords.map((record) => (
                <TableRow key={record.id} className="border-gray-700">
                  <TableCell className="text-white">
                    {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-gaming-teal font-semibold">
                    {record.amount} points
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {record.referrerId ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {record.commissionPaid ? `${record.commissionPaid} points` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {topUpRecords.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No top-up records found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserTopUpRecords;
