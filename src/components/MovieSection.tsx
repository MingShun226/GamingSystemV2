
import React from 'react';

const MovieSection = () => {
  return (
    <div className="px-4 my-6">
      <h2 className="text-xl font-bold text-white mb-4">ECL Movie</h2>
      <div className="rounded-lg overflow-hidden">
        <img 
          src="/lovable-uploads/a5cdb773-0153-429a-8b30-843ae442eec7.png" 
          alt="ECL Movie"
          className="w-full h-auto object-cover"
        />
      </div>
    </div>
  );
};

export default MovieSection;
