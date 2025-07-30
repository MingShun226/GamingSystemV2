
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const BettingTransaction = () => {
  const [activeTab, setActiveTab] = useState('All Bets');

  const tabs = ['All Bets', 'Top Daily Winner'];

  const transactions = [
    { game: 'Live Game', nickname: 'charles', time: '4:25 PM', region: 'MY', amount: '714.29' },
    { game: 'Live Game', nickname: 'wen888', time: '4:24 PM', region: 'SG', amount: '1461.54' },
    { game: 'Live Game', nickname: 'Stellaaa', time: '4:24 PM', region: 'MY', amount: '1190.48' },
    { game: 'Esport', nickname: 'Steve12', time: '4:23 PM', region: 'VN', amount: '614.17' },
    { game: 'Slot Games', nickname: 'bangga3', time: '4:23 PM', region: 'SG', amount: '613.85' },
    { game: 'Live Game', nickname: 'Stellaaa', time: '4:20 PM', region: 'SG', amount: '2114.4' },
    { game: 'Slot Games', nickname: 'leafBest', time: '4:19 PM', region: 'MY', amount: '714.29' },
    { game: 'Slot Games', nickname: 'perrimanUB', time: '4:19 PM', region: 'MY', amount: '999.24' },
    { game: 'Esport', nickname: 'berryyyy', time: '4:18 PM', region: 'VN', amount: '208.33' },
    { game: 'Esport', nickname: 'bibinanauy03', time: '4:09 PM', region: 'SG', amount: '230.77' },
  ];

  return (
    <div className="gaming-card rounded-lg p-4 mx-4 my-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Betting Transaction</h2>
        <Button variant="outline" size="sm" className="text-gaming-teal border-gaming-teal">
          View More
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
              activeTab === tab
                ? 'bg-gaming-teal text-white'
                : 'bg-gray-800 text-gray-300 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2">Game</th>
              <th className="text-left py-2">Nickname</th>
              <th className="text-left py-2">Time (GMT+8)</th>
              <th className="text-left py-2">Region</th>
              <th className="text-left py-2">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-2 text-white">{transaction.game}</td>
                <td className="py-2 text-gaming-teal">{transaction.nickname}</td>
                <td className="py-2 text-gray-300">{transaction.time}</td>
                <td className="py-2 text-gray-300">{transaction.region}</td>
                <td className="py-2 text-gaming-gold font-semibold">{transaction.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BettingTransaction;
