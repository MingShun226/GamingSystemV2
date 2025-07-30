
import React from 'react';

const SponsorsSection = () => {
  const youtubeUrl = "https://www.youtube.com/watch?v=WrTtOnJlxIs";
  const youtubeEmbedId = youtubeUrl.split('v=')[1]?.split('&')[0];

  return (
    <div className="px-4 my-8 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">Sponsors</h2>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Video Section */}
        <div className="gaming-card rounded-lg overflow-hidden border border-gaming-teal/30">
          <div className="bg-gray-800">
            {youtubeEmbedId && (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeEmbedId}`}
                  title="ECLBET 【2025年聖誕節】"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>

        {/* Brand Ambassador Section */}
        <div className="gaming-card rounded-lg p-6 border border-gaming-teal/30">
          <div className="mb-4">
            <h3 className="text-gaming-teal text-lg font-bold mb-2">Brand Ambassador</h3>
            <h4 className="text-white font-bold text-xl mb-4">Jacky Wu</h4>
          </div>
          
          <div className="flex items-start gap-4">
            {/* Ambassador Image */}
            <div className="flex-shrink-0">
              <div className="w-24 h-32 rounded-lg overflow-hidden border-2 border-gaming-teal">
                <img 
                  src="/lovable-uploads/da70032f-9418-4a6a-9bdd-e7b60fa0cb9f.png"
                  alt="Jackie Wu" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Ambassador Info */}
            <div className="flex-1">
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Jacky Wu (Wu Zongxian) is a renowned Taiwanese host, singer, actor, and producer, widely loved for his humorous and witty hosting style as well as his versatile performance skills. He holds significant influence in the entertainment industry and is hailed as the "King of Variety Shows" in Taiwanese entertainment.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gaming-teal text-sm font-semibold">760K Followers</span>
                <div className="w-5 h-5 bg-gradient-to-r from-pink-500 to-purple-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs">📷</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile App Section - Updated with new design and image */}
      <div className="gaming-card rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-400 to-yellow-400 p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-6">
              <div className="mb-2">
                <span className="text-black text-sm font-medium">MOBILE APP</span>
              </div>
              <h3 className="text-black font-bold text-2xl mb-3">Play here, win here</h3>
              <p className="text-black/80 text-sm mb-6 max-w-md">
                Download our latest mobile app.<br />
                Start playing with safety and convenience.
              </p>
              <div className="flex space-x-3">
                <div className="hover:scale-105 transition-transform cursor-pointer">
                  <img 
                    src="/lovable-uploads/bd0b0307-45e2-4b26-b25b-344048efdd4f.png"
                    alt="Download on the App Store"
                    className="h-12 w-auto"
                  />
                </div>
                <div className="hover:scale-105 transition-transform cursor-pointer">
                  <img 
                    src="/lovable-uploads/ba2b0cbb-6a7d-4d02-846c-79daf3ba9bcf.png"
                    alt="Android App on Google Play"
                    className="h-12 w-auto"
                  />
                </div>
              </div>
            </div>
            
            {/* Mobile App Image */}
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/01ffecec-d20e-4325-9c43-4f1958691349.png"
                alt="ECLBET Mobile App"
                className="h-48 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorsSection;
