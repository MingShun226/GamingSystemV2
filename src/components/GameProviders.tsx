
import React from 'react';

const GameProviders = () => {
  // Updated providers with the new brand logos
  const providers = [
    { name: 'eBET', logo: '/lovable-uploads/df2ad288-5357-4426-907f-8f5c8772fd5e.png' },
    { name: 'ALLBET', logo: '/lovable-uploads/bec23730-88c2-4be6-a9c4-51f7a32f646b.png' },
    { name: 'AG Asia Gaming', logo: '/lovable-uploads/c80afeda-4bf9-4d91-a76e-2b511fdf1b35.png' },
    { name: 'THUNDERFIRE', logo: '/lovable-uploads/b8af544a-4c47-4a71-9b98-ff62742d6995.png' },
    { name: 'MAXBET', logo: '/lovable-uploads/6a9e3e4e-a38a-47cb-8fc2-8e8d8c7eb5f2.png' },
    { name: 'INPLAYMATRIX', logo: '/lovable-uploads/15ab77e0-b1ef-4ee0-b31d-8fa906ce6d6a.png' },
    { name: 'TOP TREND GAMING', logo: '/lovable-uploads/73601f01-9981-4c58-9981-a1f33932b413.png' },
    { name: "PLAY'n GO", logo: '/lovable-uploads/46cd6368-030f-4d5f-bd4e-fcb504f19b0a.png' },
  ];

  return (
    <div className="py-6">
      <h2 className="text-xl font-bold text-white mb-4 px-4">Game Providers</h2>
      
      <div className="overflow-hidden">
        <div className="flex animate-scroll-left space-x-8 w-max">
          {/* Duplicate the array to create seamless scrolling */}
          {[...providers, ...providers].map((provider, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-32 h-16 bg-gray-800 rounded-lg flex items-center justify-center p-2"
            >
              <img 
                src={provider.logo} 
                alt={provider.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameProviders;
