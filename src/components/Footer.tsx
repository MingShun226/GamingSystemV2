
import React from 'react';

const Footer = () => {
  const footerLinks = {
    "24/7 Help & Support": [
      "Live Chat",
      "+603-2730-2756 (10am - 7pm)",
      "help@eclbet.com"
    ],
    "Games": [
      "Esports",
      "Live Casino",
      "Slots"
    ],
    "Payment Method": [
      "Local Banks",
      "Cryptocurrency",
      "Payment Gateway"
    ],
    "Social": [
      "Promotions",
      "Prediction",
      "Banking"
    ],
    "Links": [
      "About Us",
      "Terms & Conditions",
      "Betting Rules & Regulations",
      "FAQ"
    ]
  };

  return (
    <footer className="bg-gaming-darker border-t border-gray-700/50 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4 text-sm">{title}</h3>
              <ul className="space-y-2">
                {links.map((link, index) => (
                  <li key={index}>
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-white text-xs transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <img 
              src="/lovable-uploads/603076d3-9354-4a55-89b3-ce3f167abbfe.png" 
              alt="ECLBET"
              className="h-8 w-auto"
            />
            <span className="text-gaming-teal text-sm">🌍</span>
          </div>

          <div className="flex space-x-4 items-center">
            <a href="#" className="hover:scale-110 transition-transform">
              <img 
                src="/lovable-uploads/7a1ed799-5a97-4e73-adb6-7cb011de71fb.png"
                alt="Facebook"
                className="w-8 h-8"
              />
            </a>
            <a href="#" className="hover:scale-110 transition-transform">
              <img 
                src="/lovable-uploads/064faff6-725b-48d5-a880-d930d8d9baf8.png"
                alt="Instagram"
                className="w-8 h-8"
              />
            </a>
            <a href="#" className="hover:scale-110 transition-transform">
              <img 
                src="/lovable-uploads/167928f7-2584-40ff-9638-32034ba2cd68.png"
                alt="Telegram"
                className="w-8 h-8"
              />
            </a>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-gray-500">
          <p>ECLBET established in 2021. Well known authorisation company.</p>
          <p>For the best gaming experience in Malaysia, Singapore and Vietnam. Accumulated more than 100,000 players.</p>
          <p className="mt-2">© 2021 - 2025 ECLBET. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
