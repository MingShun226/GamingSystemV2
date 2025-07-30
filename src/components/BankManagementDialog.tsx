
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  bankLimit?: number;
}

interface BankManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const BANK_LIST = [
  'Malayan Banking Berhad (Maybank) / 马来亚银行',
  'CIMB Bank Berhad / 联昌银行',
  'Public Bank Berhad / 大众银行',
  'RHB Bank Berhad / 兴业银行',
  'Hong Leong Bank Berhad / 丰隆银行',
  'AmBank (M) Berhad / 安联银行',
  'Affin Bank Berhad / 艾芬银行',
  'Alliance Bank Malaysia Berhad / 联盟银行',
  'OCBC Bank (Malaysia) Berhad / 华侨银行（马来西亚）',
  'United Overseas Bank (Malaysia) Bhd / 大华银行（马来西亚）',
  'Standard Chartered Bank Malaysia Berhad / 渣打银行马来西亚',
  'Citibank Berhad / 花旗银行',
  'HSBC Bank Malaysia Berhad / 汇丰银行马来西亚',
  'Bank Islam Malaysia Berhad / 马来西亚伊斯兰银行',
  'Bank Muamalat Malaysia Berhad / 马来西亚慕阿玛拉银行',
  'CIMB Islamic Bank Berhad / 联昌伊斯兰银行',
  'Maybank Islamic Berhad / 马来亚伊斯兰银行',
  'Public Islamic Bank Berhad / 大众伊斯兰银行',
  'RHB Islamic Bank Berhad / 兴业伊斯兰银行',
  'Hong Leong Islamic Bank Berhad / 丰隆伊斯兰银行',
  'Kuwait Finance House (Malaysia) Berhad / 科威特金融屋（马来西亚）',
  'Al Rajhi Banking & Investment Corporation (Malaysia) Berhad / 拉吉希银行投资公司（马来西亚）',
  'Bank Pembangunan Malaysia Berhad / 马来西亚发展银行',
  'SME Development Bank Malaysia Berhad / 马来西亚中小企业发展银行',
  'Export-Import Bank of Malaysia Berhad / 马来西亚进出口银行',
  'Bank of China (Malaysia) Berhad / 中国银行（马来西亚）有限公司',
  'Industrial and Commercial Bank of China (Malaysia) Berhad (ICBC Malaysia) / 中国工商银行（马来西亚）有限公司',
  'China Construction Bank (Malaysia) Berhad / 中国建设银行（马来西亚）有限公司',
  'Agricultural Bank of China Limited (Labuan Branch) / 中国农业银行有限公司（纳闽分行）',
  'Bank of Communications Co., Ltd. (Kuala Lumpur Branch) / 交通银行股份有限公司（吉隆坡分行）',
  'China CITIC Bank International Limited (Labuan Branch) / 中信银行国际有限公司（纳闽分行）',
  'Ping An Bank Co., Ltd. (Labuan Branch) / 平安银行股份有限公司（纳闽分行）',
  'China Merchants Bank Co., Ltd. (Kuala Lumpur Branch) / 招商银行股份有限公司（吉隆坡分行）'
];

const BankManagementDialog = ({ isOpen, onClose }: BankManagementDialogProps) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    holderName: '',
    bankLimit: ''
  });
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      loadBankAccounts();
    }
  }, [isOpen]);

  const loadBankAccounts = () => {
    const savedBanks = JSON.parse(localStorage.getItem('bankAccounts') || '[]');
    setBankAccounts(savedBanks);
  };

  const saveBankAccounts = (banks: BankAccount[]) => {
    localStorage.setItem('bankAccounts', JSON.stringify(banks));
    setBankAccounts(banks);
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      accountNumber: '',
      holderName: '',
      bankLimit: ''
    });
    setEditingBank(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bankName || !formData.accountNumber || !formData.holderName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const bankData: BankAccount = {
      id: editingBank ? editingBank.id : Date.now().toString(),
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      holderName: formData.holderName,
      bankLimit: formData.bankLimit ? Number(formData.bankLimit) : undefined
    };

    let updatedBanks;
    if (editingBank) {
      updatedBanks = bankAccounts.map(bank => 
        bank.id === editingBank.id ? bankData : bank
      );
      toast({
        title: "Success",
        description: "Bank account updated successfully",
      });
    } else {
      updatedBanks = [...bankAccounts, bankData];
      toast({
        title: "Success",
        description: "Bank account added successfully",
      });
    }

    saveBankAccounts(updatedBanks);
    resetForm();
  };

  const handleEdit = (bank: BankAccount) => {
    setEditingBank(bank);
    setFormData({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      holderName: bank.holderName,
      bankLimit: bank.bankLimit ? bank.bankLimit.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = (bankId: string) => {
    const updatedBanks = bankAccounts.filter(bank => bank.id !== bankId);
    saveBankAccounts(updatedBanks);
    toast({
      title: "Success",
      description: "Bank account deleted successfully",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    // Validation for numeric fields
    if (field === 'accountNumber' || field === 'bankLimit') {
      if (value && !/^\d*$/.test(value)) {
        return; // Don't update if not numeric
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gaming-dark border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            <span>Bank Account Management</span>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gaming-teal hover:bg-gaming-teal/80 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Bank
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {showForm && (
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-white text-lg font-semibold mb-4">
                {editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Bank Name *</Label>
                    <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select or search bank" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                        {BANK_LIST.map((bank) => (
                          <SelectItem key={bank} value={bank} className="text-white hover:bg-gray-600">
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Account Number *</Label>
                    <Input
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      placeholder="Enter account number (numbers only)"
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Account Holder Name *</Label>
                    <Input
                      value={formData.holderName}
                      onChange={(e) => handleInputChange('holderName', e.target.value)}
                      placeholder="Enter account holder name"
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Bank Limit (Optional)</Label>
                    <Input
                      value={formData.bankLimit}
                      onChange={(e) => handleInputChange('bankLimit', e.target.value)}
                      placeholder="Enter bank limit (numbers only)"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="text-gray-300 border-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gaming-teal hover:bg-gaming-teal/80 text-white"
                  >
                    {editingBank ? 'Update Bank' : 'Add Bank'}
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white text-lg font-semibold">Bank Accounts ({bankAccounts.length})</h3>
            </div>
            
            {bankAccounts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No bank accounts added yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="text-left text-gray-300 p-4">Bank Name</th>
                      <th className="text-left text-gray-300 p-4">Account Number</th>
                      <th className="text-left text-gray-300 p-4">Holder Name</th>
                      <th className="text-left text-gray-300 p-4">Bank Limit</th>
                      <th className="text-left text-gray-300 p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankAccounts.map((bank) => (
                      <tr key={bank.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                        <td className="text-white p-4 max-w-xs truncate" title={bank.bankName}>
                          {bank.bankName}
                        </td>
                        <td className="text-gaming-teal p-4 font-mono">{bank.accountNumber}</td>
                        <td className="text-gray-300 p-4">{bank.holderName}</td>
                        <td className="text-gray-300 p-4">
                          {bank.bankLimit ? bank.bankLimit.toLocaleString() : 'No limit'}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEdit(bank)}
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BankManagementDialog;
