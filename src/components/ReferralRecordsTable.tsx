
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import { getUserReferralRecords, ReferralRecord } from '@/lib/supabase';

interface ReferralRecordsTableProps {
  userId: string;
}

const ReferralRecordsTable = ({ userId }: ReferralRecordsTableProps) => {
  const [referralRecords, setReferralRecords] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralRecords = async () => {
      setLoading(true);
      const { data, error } = await getUserReferralRecords(userId);
      if (data && !error) {
        setReferralRecords(data);
      }
      setLoading(false);
    };

    if (userId) {
      fetchReferralRecords();
    }
  }, [userId]);

  const totalCommission = referralRecords.reduce((sum, record) => sum + record.total_commission_earned, 0);

  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-white text-lg font-semibold flex items-center mb-2">
          <Users className="h-5 w-5 mr-2 text-gaming-teal" />
          Referral Records
        </h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-400">Total Referrals: </span>
            <span className="text-white font-semibold">{referralRecords.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Total Commission Earned: </span>
            <span className="text-gaming-teal font-semibold">{totalCommission} points</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-gray-700/50">
              <TableHead className="text-gray-300">Referred User</TableHead>
              <TableHead className="text-gray-300">Registration Date</TableHead>
              <TableHead className="text-gray-300">Last Top-up</TableHead>
              <TableHead className="text-gray-300">Last Top-up Date</TableHead>
              <TableHead className="text-gray-300">Total Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referralRecords.map((record) => (
              <TableRow key={record.id} className="border-gray-700 hover:bg-gray-700/30">
                <TableCell className="text-white font-medium">{record.referred_username}</TableCell>
                <TableCell className="text-gray-300">
                  {new Date(record.registration_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-gray-300">
                  {record.last_topup_amount ? `${record.last_topup_amount} points` : 'No top-up yet'}
                </TableCell>
                <TableCell className="text-gray-300">
                  {record.last_topup_date 
                    ? new Date(record.last_topup_date).toLocaleDateString()
                    : 'N/A'
                  }
                </TableCell>
                <TableCell className="text-gaming-teal font-semibold">
                  {record.total_commission_earned} points
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading referral records...</div>
          </div>
        )}
        
        {!loading && referralRecords.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No referrals yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Share your referral code with friends to start earning commissions!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralRecordsTable;
