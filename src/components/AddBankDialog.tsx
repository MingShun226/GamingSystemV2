import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addBankAccount, updateBankAccount } from '@/lib/supabase';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  bankLimit?: number;
}

interface AddBankDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingBank: BankAccount | null;
  onBankUpdated?: () => void;
}

const BANK_LIST = [
  'Affin Bank Berhad / 艾芬银行',
  'Agricultural Bank of China Limited (Labuan Branch) / 中国农业银行有限公司（纳闽分行）',
  'Al Rajhi Banking & Investment Corporation (Malaysia) Berhad / 拉吉希银行投资公司（马来西亚）',
  'Alliance Bank Malaysia Berhad / 联盟银行',
  'AmBank (M) Berhad / 安联银行',
  'Bank Islam Malaysia Berhad / 马来西亚伊斯兰银行',
  'Bank Muamalat Malaysia Berhad / 马来西亚慕阿玛拉银行',
  'Bank of China (Malaysia) Berhad / 中国银行（马来西亚）有限公司',
  'Bank of Communications Co., Ltd. (Kuala Lumpur Branch) / 交通银行股份有限公司（吉隆坡分行）',
  'Bank Pembangunan Malaysia Berhad / 马来西亚发展银行',
  'China CITIC Bank International Limited (Labuan Branch) / 中信银行国际有限公司（纳闽分行）',
  'China Construction Bank (Malaysia) Berhad / 中国建设银行（马来西亚）有限公司',
  'China Merchants Bank Co., Ltd. (Kuala Lumpur Branch) / 招商银行股份有限公司（吉隆坡分行）',
  'CIMB Bank Berhad / 联昌银行',
  'CIMB Islamic Bank Berhad / 联昌伊斯兰银行',
  'Citibank Berhad / 花旗银行',
  'Export-Import Bank of Malaysia Berhad / 马来西亚进出口银行',
  'Hong Leong Bank Berhad / 丰隆银行',
  'Hong Leong Islamic Bank Berhad / 丰隆伊斯兰银行',
  'HSBC Bank Malaysia Berhad / 汇丰银行马来西亚',
  'Industrial and Commercial Bank of China (Malaysia) Berhad (ICBC Malaysia) / 中国工商银行（马来西亚）有限公司',
  'Kuwait Finance House (Malaysia) Berhad / 科威特金融屋（马来西亚）',
  'Malayan Banking Berhad (Maybank) / 马来亚银行',
  'Maybank Islamic Berhad / 马来亚伊斯兰银行',
  'OCBC Bank (Malaysia) Berhad / 华侨银行（马来西亚）',
  'Ping An Bank Co., Ltd. (Labuan Branch) / 平安银行股份有限公司（纳闽分行）',
  'Public Bank Berhad / 大众银行',
  'Public Islamic Bank Berhad / 大众伊斯兰银行',
  'RHB Bank Berhad / 兴业银行',
  'RHB Islamic Bank Berhad / 兴业伊斯兰银行',
  'SME Development Bank Malaysia Berhad / 马来西亚中小企业发展银行',
  'Standard Chartered Bank Malaysia Berhad / 渣打银行马来西亚',
  'United Overseas Bank (Malaysia) Bhd / 大华银行（马来西亚）'
];

const AddBankDialog = ({ isOpen, onClose, editingBank, onBankUpdated }: AddBankDialogProps) => {
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    holderName: '',
    bankLimit: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (editingBank && isOpen) {
      setFormData({
        bankName: editingBank.bankName,
        accountNumber: editingBank.accountNumber,
        holderName: editingBank.holderName,
        bankLimit: editingBank.bankLimit ? editingBank.bankLimit.toString() : ''
      });
    } else if (!editingBank) {
      setFormData({
        bankName: '',
        accountNumber: '',
        holderName: '',
        bankLimit: ''
      });
    }
  }, [editingBank, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bankName || !formData.accountNumber || !formData.holderName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const bankData = {
        bank_name: formData.bankName,
        account_number: formData.accountNumber,
        holder_name: formData.holderName,
        bank_limit: formData.bankLimit ? Number(formData.bankLimit) : undefined
      };

      if (editingBank) {
        const { data, error } = await updateBankAccount(editingBank.id, bankData);
        if (error) {
          toast({
            title: "Error",
            description: error.message || "Failed to update bank account",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Success",
          description: "Bank account updated successfully",
        });
      } else {
        const { data, error } = await addBankAccount(bankData);
        if (error) {
          toast({
            title: "Error",
            description: error.message || "Failed to add bank account",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Success",
          description: "Bank account added successfully",
        });
      }

      onClose();
      if (onBankUpdated) {
        onBankUpdated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gaming-dark border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
          </DialogTitle>
        </DialogHeader>
        
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
              onClick={onClose}
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
      </DialogContent>
    </Dialog>
  );
};

export default AddBankDialog;
