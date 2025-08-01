
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, RefreshCw, Eye, Settings, UserCog, CreditCard, Users, Search } from 'lucide-react';
import UserTopUpRecords from '@/components/UserTopUpRecords';
import VipBadge from '@/components/VipBadge';
import RankManagementDialog from '@/components/RankManagementDialog';
import UserStatusDialog from '@/components/UserStatusDialog';
import BankDetailsTable from '@/components/BankDetailsTable';
import AddBankDialog from '@/components/AddBankDialog';
import SearchableUserSelect from '@/components/SearchableUserSelect';
import { getAllUsers, updateUserPoints, WagerWaveUser } from '@/lib/supabase';
import { SessionManager } from '@/utils/sessionManager';

interface User {
  id: string;
  username: string;
  points: number;
  phone: string;
  referralCode: string;
  referredBy: string | null;
  status: string;
  role: string;
  isVip?: boolean;
  rank?: string;
  createdAt: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  bankLimit?: number;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<WagerWaveUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<WagerWaveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [selectedUserForRecords, setSelectedUserForRecords] = useState<WagerWaveUser | null>(null);
  const [showUserRecords, setShowUserRecords] = useState(false);
  const [selectedUserForRank, setSelectedUserForRank] = useState<WagerWaveUser | null>(null);
  const [showRankDialog, setShowRankDialog] = useState(false);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<WagerWaveUser | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'banks'>('users');
  const [bankTableKey, setBankTableKey] = useState(0);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllUsers();
      if (data && !error) {
        // Filter only non-admin users and add role field for compatibility
        const regularUsers = data
          .filter(user => !user.username.startsWith('admin'))
          .map(user => ({ ...user, role: 'user' }));
        setUsers(regularUsers);
        console.log('Loaded users from Supabase:', regularUsers);
      } else {
        console.error('Error loading users:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (!userSearchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(userSearchTerm))
      );
      setFilteredUsers(filtered);
    }
  }, [users, userSearchTerm]);

  useEffect(() => {
    // Check if current user is admin
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser?.id || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }

    loadUsers();

    // Set up an interval to refresh user data periodically
    const interval = setInterval(loadUsers, 2000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    SessionManager.logout();
    navigate('/');
    const toastId = toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    
    // Auto-close toast after 5 seconds
    setTimeout(() => {
      if (toastId && toastId.dismiss) {
        toastId.dismiss();
      }
    }, 5000);
  };

  const handleAddPoints = async () => {
    if (!selectedUser || !pointsToAdd || parseInt(pointsToAdd) <= 0) {
      const toastId = toast({
        title: "Error",
        description: "Please select a user and enter a valid points amount",
        variant: "destructive",
      });
      
      // Auto-close toast after 5 seconds
      setTimeout(() => {
        if (toastId && toastId.dismiss) {
          toastId.dismiss();
        }
      }, 5000);
      return;
    }

    try {
      const user = users.find(u => u.id === selectedUser);
      if (!user) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        });
        return;
      }

      const newPoints = user.points + parseInt(pointsToAdd);
      const { data, error } = await updateUserPoints(selectedUser, newPoints);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to update points",
          variant: "destructive",
        });
        return;
      }

      // Refresh the users list
      await loadUsers();

      const toastId = toast({
        title: "Points Added",
        description: `Successfully added ${pointsToAdd} points to ${user.username}`,
      });
      
      // Auto-close toast after 5 seconds
      setTimeout(() => {
        if (toastId && toastId.dismiss) {
          toastId.dismiss();
        }
      }, 5000);

      setSelectedUser('');
      setPointsToAdd('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user points",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    loadUsers();
    const toastId = toast({
      title: "Refreshed",
      description: "User data has been refreshed",
    });
    
    // Auto-close toast after 5 seconds
    setTimeout(() => {
      if (toastId && toastId.dismiss) {
        toastId.dismiss();
      }
    }, 5000);
  };

  const handleViewUserRecords = (user: User) => {
    setSelectedUserForRecords(user);
    setShowUserRecords(true);
  };

  const handleManageRank = (user: User) => {
    setSelectedUserForRank(user);
    setShowRankDialog(true);
  };

  const handleManageStatus = (user: User) => {
    setSelectedUserForStatus(user);
    setShowStatusDialog(true);
  };

  const handleAddBank = () => {
    setEditingBank(null);
    setShowAddBankDialog(true);
  };

  const handleEditBank = (bank: BankAccount) => {
    setEditingBank(bank);
    setShowAddBankDialog(true);
  };

  const handleBankUpdated = () => {
    setBankTableKey(prev => prev + 1);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Header */}
      <header className="bg-gaming-darker border-b border-gray-700/50 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/603076d3-9354-4a55-89b3-ce3f167abbfe.png" 
              alt="ECLBET"
              className="h-8 w-auto"
            />
            <h1 className="text-white text-xl font-bold">Admin Dashboard</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'users'
                  ? 'bg-gaming-teal text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('banks')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'banks'
                  ? 'bg-gaming-teal text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Bank Management
            </button>
          </div>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Add Points Section */}
            <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
              <h2 className="text-white text-lg font-semibold mb-4">Add Points to User</h2>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-gray-300 text-sm mb-2">Select User</label>
                  <SearchableUserSelect
                    users={users}
                    selectedUserId={selectedUser}
                    onUserSelect={setSelectedUser}
                    placeholder="Search and select user"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-300 text-sm mb-2">Points to Add</label>
                  <Input
                    type="number"
                    value={pointsToAdd}
                    onChange={(e) => setPointsToAdd(e.target.value)}
                    placeholder="Enter points amount"
                    className="bg-gray-700 border-gray-600 text-white"
                    min="1"
                  />
                </div>
                <Button
                  onClick={handleAddPoints}
                  className="bg-gaming-teal hover:bg-gaming-teal/80 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Points
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800/50 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-white text-lg font-semibold">User Management</h2>
                    <p className="text-gray-400 text-sm mt-1">Total Users: {users.length} | Showing: {filteredUsers.length}</p>
                  </div>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="text-gray-300 border-gray-600 hover:bg-gray-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search users by username or phone number..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-700/50">
                      <TableHead className="text-gray-300">Username</TableHead>
                      <TableHead className="text-gray-300">Points</TableHead>
                      <TableHead className="text-gray-300">Phone</TableHead>
                      <TableHead className="text-gray-300">Referred By</TableHead>
                      <TableHead className="text-gray-300">Rank</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Created Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-gray-700 hover:bg-gray-700/30">
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{user.username}</span>
                            {user.is_vip && <VipBadge size="sm" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-gaming-teal font-semibold">{user.points}</TableCell>
                        <TableCell className="text-gray-300">{user.phone || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">
                          <div className="space-y-1">
                            <div>
                              {(user as any).referrerUsername && !(user as any).marketingSource ? 
                                `Referred by: ${(user as any).referrerUsername}` : 
                                (user as any).marketingSource ? 
                                  `${(user as any).marketingSource}` :
                                  'Direct signup'
                              }
                            </div>
                            {(user as any).promoCode && (
                              <div className="text-xs text-gaming-teal">
                                Code: {(user as any).promoCode}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.is_vip 
                                ? 'bg-yellow-500/20 text-yellow-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.is_vip ? 'VIP' : 'Normal'}
                            </span>
                            <Button
                              onClick={() => handleManageRank(user)}
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1 h-6 text-gray-300 border-gray-600 hover:bg-gray-700"
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {user.status}
                            </span>
                            <Button
                              onClick={() => handleManageStatus(user)}
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1 h-6 text-gray-300 border-gray-600 hover:bg-gray-700"
                            >
                              <UserCog className="h-3 w-3 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {formatDateTime((user as any).createdAt || user.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleViewUserRecords(user)}
                            variant="outline"
                            size="sm"
                            className="text-gray-300 border-gray-600 hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Records
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredUsers.length === 0 && userSearchTerm && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No users found matching "{userSearchTerm}"</p>
                  </div>
                )}
                
                {filteredUsers.length === 0 && !userSearchTerm && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No users registered yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Bank Management Tab */
          <BankDetailsTable
            key={bankTableKey}
            onAddBank={handleAddBank}
            onEditBank={handleEditBank}
            onBankUpdated={handleBankUpdated}
          />
        )}
      </div>

      {/* User Top-up Records Modal */}
      {selectedUserForRecords && (
        <UserTopUpRecords
          userId={selectedUserForRecords.id}
          username={selectedUserForRecords.username}
          isOpen={showUserRecords}
          onClose={() => {
            setShowUserRecords(false);
            setSelectedUserForRecords(null);
          }}
        />
      )}

      {/* Rank Management Dialog */}
      <RankManagementDialog
        user={selectedUserForRank}
        isOpen={showRankDialog}
        onClose={() => {
          setShowRankDialog(false);
          setSelectedUserForRank(null);
        }}
        onRankUpdated={loadUsers}
      />

      {/* User Status Dialog */}
      <UserStatusDialog
        user={selectedUserForStatus}
        isOpen={showStatusDialog}
        onClose={() => {
          setShowStatusDialog(false);
          setSelectedUserForStatus(null);
        }}
        onStatusUpdated={loadUsers}
      />

      {/* Add/Edit Bank Dialog */}
      <AddBankDialog
        isOpen={showAddBankDialog}
        onClose={() => {
          setShowAddBankDialog(false);
          setEditingBank(null);
        }}
        editingBank={editingBank}
        onBankUpdated={handleBankUpdated}
      />
    </div>
  );
};

export default AdminDashboard;
