
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Copy, RefreshCw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBankAccounts, deleteBankAccount, BankAccount as DBBankAccount } from '@/lib/supabase';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  bankLimit?: number;
  addedDate?: string;
}

interface BankDetailsTableProps {
  onAddBank: () => void;
  onEditBank: (bank: BankAccount) => void;
  onBankUpdated?: () => void;
}

type SortOption = 'none' | 'bankLimit-desc' | 'bankLimit-asc' | 'addedDate-desc' | 'addedDate-asc';

const BankDetailsTable = ({ onAddBank, onEditBank, onBankUpdated }: BankDetailsTableProps) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<BankAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('none');
  const { toast } = useToast();

  const loadBankAccounts = async () => {
    try {
      const { data, error } = await getBankAccounts();
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load bank accounts",
          variant: "destructive",
        });
        return;
      }
      
      // Transform database format to component format
      const transformedBanks = (data || []).map((bank: DBBankAccount) => ({
        id: bank.id,
        bankName: bank.bank_name,
        accountNumber: bank.account_number,
        holderName: bank.holder_name,
        bankLimit: bank.bank_limit,
        addedDate: bank.created_at
      }));
      
      setBankAccounts(transformedBanks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadBankAccounts();
    
    // Set up an interval to refresh bank data periodically
    const interval = setInterval(loadBankAccounts, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter and sort banks
  useEffect(() => {
    let filtered = bankAccounts.filter(bank => 
      bank.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.holderName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting based on selected option
    if (sortOption !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        switch (sortOption) {
          case 'bankLimit-desc':
            return (b.bankLimit || 0) - (a.bankLimit || 0);
          case 'bankLimit-asc':
            return (a.bankLimit || 0) - (b.bankLimit || 0);
          case 'addedDate-desc':
            return new Date(b.addedDate || '').getTime() - new Date(a.addedDate || '').getTime();
          case 'addedDate-asc':
            return new Date(a.addedDate || '').getTime() - new Date(b.addedDate || '').getTime();
          default:
            return 0;
        }
      });
    }

    setFilteredBanks(filtered);
  }, [bankAccounts, searchTerm, sortOption]);

  const handleDelete = async (bankId: string) => {
    try {
      const { success, error } = await deleteBankAccount(bankId);
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete bank account",
          variant: "destructive",
        });
        return;
      }
      
      if (success) {
        toast({
          title: "Success",
          description: "Bank account deleted successfully",
        });
        // Reload the bank accounts to reflect changes
        loadBankAccounts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bank account",
        variant: "destructive",
      });
    }
  };

  const handleCopyBankDetails = (bank: BankAccount) => {
    const bankDetails = `Bank Name: ${bank.bankName}\nBank Account: ${bank.accountNumber}\nBank Holder Name: ${bank.holderName}`;
    
    navigator.clipboard.writeText(bankDetails).then(() => {
      toast({
        title: "Copied!",
        description: "Bank details copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Could not copy bank details",
        variant: "destructive",
      });
    });
  };

  const handleRefresh = async () => {
    await loadBankAccounts();
    toast({
      title: "Refreshed",
      description: "Bank data has been refreshed",
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'bankLimit-desc': return 'Bank Limit (High to Low)';
      case 'bankLimit-asc': return 'Bank Limit (Low to High)';
      case 'addedDate-desc': return 'Date Added (Latest First)';
      case 'addedDate-asc': return 'Date Added (Oldest First)';
      default: return 'No Sorting';
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-white text-lg font-semibold">Bank Account Management</h2>
          <p className="text-gray-400 text-sm mt-1">Total Banks: {bankAccounts.length} | Filtered: {filteredBanks.length}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={onAddBank}
            className="bg-gaming-teal hover:bg-gaming-teal/80 text-white"
          >
            Add New Bank
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-6 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by bank name, account number, or holder name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Sorting Dropdown */}
      <div className="p-4 border-b border-gray-700 flex items-center gap-3">
        <span className="text-gray-300 text-sm">Sort by:</span>
        <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
          <SelectTrigger className="w-64 bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Select sorting option" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="none" className="text-white hover:bg-gray-600">No Sorting</SelectItem>
            <SelectItem value="bankLimit-desc" className="text-white hover:bg-gray-600">Bank Limit (High to Low)</SelectItem>
            <SelectItem value="bankLimit-asc" className="text-white hover:bg-gray-600">Bank Limit (Low to High)</SelectItem>
            <SelectItem value="addedDate-desc" className="text-white hover:bg-gray-600">Date Added (Latest First)</SelectItem>
            <SelectItem value="addedDate-asc" className="text-white hover:bg-gray-600">Date Added (Oldest First)</SelectItem>
          </SelectContent>
        </Select>
        {sortOption !== 'none' && (
          <Button
            onClick={() => setSortOption('none')}
            variant="outline"
            size="sm"
            className="text-red-400 border-red-600 hover:bg-red-600/20"
          >
            Clear Sort
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-gray-700/50">
              <TableHead className="text-gray-300 w-80">Bank Name</TableHead>
              <TableHead className="text-gray-300">Account Number</TableHead>
              <TableHead className="text-gray-300">Holder Name</TableHead>
              <TableHead className="text-gray-300">Bank Limit</TableHead>
              <TableHead className="text-gray-300">Added Date</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBanks.map((bank) => (
              <TableRow key={bank.id} className="border-gray-700 hover:bg-gray-700/30">
                <TableCell className="text-white w-80">
                  <div className="max-w-80 break-words overflow-wrap-anywhere">
                    <span className="text-sm leading-tight" title={bank.bankName}>
                      {bank.bankName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-gaming-teal font-mono">{bank.accountNumber}</TableCell>
                <TableCell className="text-gray-300">{bank.holderName}</TableCell>
                <TableCell className="text-gray-300">
                  {bank.bankLimit ? bank.bankLimit.toLocaleString() : 'No limit'}
                </TableCell>
                <TableCell className="text-gray-300 text-sm">
                  {formatDate(bank.addedDate || '')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCopyBankDetails(bank)}
                      size="sm"
                      variant="outline"
                      className="text-gray-300 border-gray-600 hover:bg-gray-700"
                      title="Copy bank details"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => onEditBank(bank)}
                      size="sm"
                      variant="outline"
                      className="text-gray-300 border-gray-600 hover:bg-gray-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(bank.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-600 hover:bg-red-600/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredBanks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {searchTerm ? 'No bank accounts match your search' : 'No bank accounts added yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankDetailsTable;
