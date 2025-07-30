
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ChevronDown, Search } from 'lucide-react';

interface User {
  id: string;
  username: string;
  points: number;
  phone: string;
}

interface SearchableUserSelectProps {
  users: User[];
  selectedUserId: string;
  onUserSelect: (userId: string) => void;
  placeholder?: string;
}

const SearchableUserSelect = ({ 
  users, 
  selectedUserId, 
  onUserSelect, 
  placeholder = "Search and select user" 
}: SearchableUserSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
    );
  }, [users, searchTerm]);

  const selectedUser = users.find(user => user.id === selectedUserId);

  const handleUserSelect = (userId: string) => {
    onUserSelect(userId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <div className="flex">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        >
          {selectedUser ? selectedUser.username : placeholder}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 border-gray-600">
          <CardContent className="p-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by username or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
                autoFocus
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-gray-400 text-sm py-2 text-center">
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user.id)}
                    className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-700 rounded ${
                      selectedUserId === user.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">{user.username}</div>
                      <div className="text-gray-400 text-sm">
                        Points: {user.points} | Phone: {user.phone || 'N/A'}
                      </div>
                    </div>
                    {selectedUserId === user.id && (
                      <Check className="h-4 w-4 text-gaming-teal" />
                    )}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchableUserSelect;
