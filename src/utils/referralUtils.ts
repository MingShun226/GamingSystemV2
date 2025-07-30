
export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUsername: string;
  registrationDate: string;
  totalCommissionEarned: number;
  lastTopUpAmount?: number;
  lastTopUpDate?: string;
}

export interface TopUpRecord {
  id: string;
  userId: string;
  username: string;
  amount: number;
  date: string;
  referrerId?: string;
  commissionPaid?: number;
}

export const generateReferralCode = (userId: string, username: string): string => {
  return `REF${username.toUpperCase()}${userId.slice(-4)}`;
};

export const generateReferralLink = (referralCode: string): string => {
  return `${window.location.origin}/register?ref=${referralCode}`;
};

export const calculateCommission = (amount: number): number => {
  return Math.floor(amount * 0.1);
};

export const getReferralRecords = (userId: string): ReferralRecord[] => {
  const records = localStorage.getItem('referralRecords') || '[]';
  const allRecords: ReferralRecord[] = JSON.parse(records);
  return allRecords.filter(record => record.referrerId === userId);
};

export const getTopUpRecords = (userId?: string): TopUpRecord[] => {
  const records = localStorage.getItem('topUpRecords') || '[]';
  const allRecords: TopUpRecord[] = JSON.parse(records);
  return userId ? allRecords.filter(record => record.userId === userId) : allRecords;
};

export const addReferralRecord = (referralRecord: ReferralRecord): void => {
  const records = localStorage.getItem('referralRecords') || '[]';
  const allRecords: ReferralRecord[] = JSON.parse(records);
  allRecords.push(referralRecord);
  localStorage.setItem('referralRecords', JSON.stringify(allRecords));
};

export const addTopUpRecord = (topUpRecord: TopUpRecord): void => {
  const records = localStorage.getItem('topUpRecords') || '[]';
  const allRecords: TopUpRecord[] = JSON.parse(records);
  allRecords.push(topUpRecord);
  localStorage.setItem('topUpRecords', JSON.stringify(allRecords));
};

export const updateReferralCommission = (referrerId: string, referredUserId: string, commissionAmount: number, topUpAmount: number): void => {
  const records = localStorage.getItem('referralRecords') || '[]';
  const allRecords: ReferralRecord[] = JSON.parse(records);
  
  const recordIndex = allRecords.findIndex(
    record => record.referrerId === referrerId && record.referredUserId === referredUserId
  );
  
  if (recordIndex !== -1) {
    allRecords[recordIndex].totalCommissionEarned += commissionAmount;
    allRecords[recordIndex].lastTopUpAmount = topUpAmount;
    allRecords[recordIndex].lastTopUpDate = new Date().toISOString();
    localStorage.setItem('referralRecords', JSON.stringify(allRecords));
  }
};

export const processReferralCommission = (userId: string, topUpAmount: number): void => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const currentUser = users.find((user: any) => user.id === userId);
  
  console.log('Processing referral commission for user:', currentUser);
  console.log('User referredBy:', currentUser?.referredBy);
  
  // CRITICAL: Only process referral commission if user has a referrer
  // This prevents commission being paid for "Direct Signup" users
  if (currentUser && currentUser.referredBy && currentUser.referredBy.trim() !== '') {
    console.log('User has referrer, processing commission...');
    
    const commission = calculateCommission(topUpAmount);
    const referrerIndex = users.findIndex((user: any) => user.id === currentUser.referredBy);
    
    console.log('Referrer found at index:', referrerIndex);
    console.log('Commission amount:', commission);
    
    if (referrerIndex !== -1) {
      // Add commission to referrer's points
      users[referrerIndex].points += commission;
      localStorage.setItem('users', JSON.stringify(users));
      
      console.log('Commission added to referrer:', users[referrerIndex].username);
      
      // Update referral record with commission earned
      updateReferralCommission(currentUser.referredBy, userId, commission, topUpAmount);
      
      // Add top-up record WITH referral commission
      addTopUpRecord({
        id: Date.now().toString(),
        userId: userId,
        username: currentUser.username,
        amount: topUpAmount,
        date: new Date().toISOString(),
        referrerId: currentUser.referredBy,
        commissionPaid: commission
      });
    } else {
      console.log('Referrer not found in users array');
      
      // Add top-up record without referral (referrer not found)
      addTopUpRecord({
        id: Date.now().toString(),
        userId: userId,
        username: currentUser?.username || 'Unknown',
        amount: topUpAmount,
        date: new Date().toISOString()
      });
    }
  } else {
    console.log('User is Direct Signup - NO referral commission will be paid');
    
    // Add top-up record without referral for direct signup users
    addTopUpRecord({
      id: Date.now().toString(),
      userId: userId,
      username: currentUser?.username || 'Unknown',
      amount: topUpAmount,
      date: new Date().toISOString()
      // NO referrerId or commissionPaid fields for direct signups
    });
  }
};
