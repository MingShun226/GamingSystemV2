
import React, { useState, useEffect } from 'react';

interface HeroSectionProps {
  onPlayNow: () => void;
}

const HeroSection = ({ onPlayNow }: HeroSectionProps) => {
  const bannerImages = [
    "/lovable-uploads/c6c6bb0d-3ae4-4b61-8f69-0cc388ff1a27.png",
    "/lovable-uploads/14db3d75-1c70-4c02-9bde-4de76cbd1be7.png",
    "/lovable-uploads/ad1844b9-2145-4e87-a899-345e52265ec3.png",
    "/lovable-uploads/ccdcf78d-7af7-4167-b5e5-4360ecb239f3.png",
    "/lovable-uploads/052a762a-594e-4b13-822e-4fa84d9ad89f.png",
    "/lovable-uploads/d7a203d4-2abf-4c83-b0c9-a16245039c89.png"
  ];

  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const gameCategories = [
    { 
      name: 'Number Game', 
      color: 'bg-gaming-teal', 
      hoverColor: 'hover:bg-gaming-teal/90',
      icon: '🎲',
      label: 'Play Now' 
    },
    { 
      name: 'Ranking Board', 
      color: 'bg-gaming-orange', 
      hoverColor: 'hover:bg-gaming-orange/90',
      icon: '🏆',
      label: 'Play Now' 
    },
    { 
      name: 'Prediction', 
      color: 'bg-red-500', 
      hoverColor: 'hover:bg-red-500/90',
      icon: '🎯',
      label: 'Play Now' 
    },
    { 
      name: 'Personal Achievement', 
      color: 'bg-purple-500', 
      hoverColor: 'hover:bg-purple-500/90',
      icon: '📊',
      label: 'Play Now' 
    },
  ];

  return (
    <div className="space-y-4 p-4 max-w-full">
      {/* Banner Carousel */}
      <div className="relative overflow-hidden rounded-lg h-48 md:h-64 lg:h-80">
        <div 
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentBanner * 100}%)` }}
        >
          {bannerImages.map((banner, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              <img 
                src={banner} 
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        {/* Banner Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentBanner === index ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Game Categories - Fixed Size and Added Animations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
        {gameCategories.map((category, index) => (
          <div
            key={index}
            onClick={onPlayNow}
            className={`${category.color} ${category.hoverColor} rounded-lg p-3 text-center text-white font-medium hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group`}
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
              <div className="text-sm font-semibold">{category.name}</div>
            </div>
            <div className="text-xs bg-black/20 rounded px-3 py-1 inline-block group-hover:bg-black/30 transition-colors duration-300">
              {category.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
