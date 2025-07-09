import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [showButton, setShowButton] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase(1), 1000);
    const timer2 = setTimeout(() => setAnimationPhase(2), 2500);
    const timer3 = setTimeout(() => setAnimationPhase(3), 4000);
    const timer4 = setTimeout(() => setShowButton(true), 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Sparkles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: animationPhase >= 2 ? [0, 1, 0] : 0,
              scale: animationPhase >= 2 ? [0, 1, 0] : 0,
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          >
            <Sparkles size={16} className="text-[#A8C5D4]" />
          </motion.div>
        ))}

        {/* Drifting Clouds */}
        <motion.div
          animate={{ x: [0, 200, 0] }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute top-16 left-1/4 w-40 h-20 opacity-20"
        >
          <svg viewBox="0 0 160 80" className="w-full h-full">
            <path
              d="M25 50 Q15 35 30 35 Q35 25 50 30 Q65 20 80 30 Q95 25 110 35 Q125 40 120 50 Q115 60 100 55 Q85 65 70 55 Q55 60 45 55 Q30 65 25 50 Z"
              fill="#EAEFF5"
              stroke="#DDE4EC"
              strokeWidth="2"
              style={{ filter: 'url(#roughPaper)' }}
            />
          </svg>
        </motion.div>

        <motion.div
          animate={{ x: [0, -150, 0] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-32 right-1/3 w-32 h-16 opacity-15"
        >
          <svg viewBox="0 0 128 64" className="w-full h-full">
            <path
              d="M20 40 Q10 25 25 25 Q30 15 45 20 Q60 10 75 20 Q90 15 100 25 Q110 30 105 40 Q100 50 85 45 Q70 55 55 45 Q40 50 30 45 Q15 50 20 40 Z"
              fill="#DDE4EC"
              stroke="#BCC8D4"
              strokeWidth="2"
              style={{ filter: 'url(#roughPaper)' }}
            />
          </svg>
        </motion.div>
      </div>

      {/* Tree Village Background */}
      <div className="fixed inset-0 pointer-events-none">
        <svg viewBox="0 0 1200 800" className="w-full h-full">
          <defs>
            <filter id="roughPaper">
              <feTurbulence baseFrequency="0.04" numOctaves="3" result="noise" seed="3"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/>
            </filter>
            <filter id="childDrawing">
              <feTurbulence baseFrequency="0.08" numOctaves="2" result="noise" seed="5"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3"/>
            </filter>
          </defs>

          {/* Tree Houses - Left Side */}
          <motion.g
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: animationPhase >= 1 ? 0.3 : 0, y: animationPhase >= 1 ? 0 : 50 }}
            transition={{ duration: 2, delay: 1 }}
          >
            {/* Big Tree with House */}
            <path
              d="M100 600 Q105 580 102 560 Q98 540 95 520 Q93 500 90 480 Q88 460 85 440 Q83 420 80 400"
              stroke="#8B7355"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              style={{ filter: 'url(#childDrawing)' }}
            />
            {/* Tree Crown - Wobbly Circle */}
            <motion.path
              d="M80 400 Q50 380 40 350 Q35 320 50 300 Q70 285 100 290 Q130 295 150 310 Q165 330 160 360 Q155 390 130 405 Q100 410 80 400 Z"
              fill="#9CAF88"
              stroke="#7A9B6E"
              strokeWidth="3"
              style={{ filter: 'url(#childDrawing)' }}
              animate={{ 
                d: [
                  "M80 400 Q50 380 40 350 Q35 320 50 300 Q70 285 100 290 Q130 295 150 310 Q165 330 160 360 Q155 390 130 405 Q100 410 80 400 Z",
                  "M82 398 Q52 378 42 348 Q37 318 52 298 Q72 283 102 288 Q132 293 152 308 Q167 328 162 358 Q157 388 132 403 Q102 408 82 398 Z",
                  "M80 400 Q50 380 40 350 Q35 320 50 300 Q70 285 100 290 Q130 295 150 310 Q165 330 160 360 Q155 390 130 405 Q100 410 80 400 Z"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Tree House */}
            <rect
              x="70"
              y="350"
              width="60"
              height="40"
              fill="#D4A574"
              stroke="#B8935F"
              strokeWidth="2"
              style={{ filter: 'url(#childDrawing)' }}
            />
            {/* House Roof */}
            <path
              d="M65 350 L100 320 L135 350 Z"
              fill="#C85A5A"
              stroke="#B04545"
              strokeWidth="2"
              style={{ filter: 'url(#childDrawing)' }}
            />
            {/* Window */}
            <rect
              x="85"
              y="360"
              width="15"
              height="15"
              fill="#87CEEB"
              stroke="#6BB6D6"
              strokeWidth="1"
              style={{ filter: 'url(#childDrawing)' }}
            />
            {/* Door */}
            <rect
              x="105"
              y="370"
              width="12"
              height="20"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="1"
              style={{ filter: 'url(#childDrawing)' }}
            />
          </motion.g>

          {/* Tree Houses - Right Side */}
          <motion.g
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: animationPhase >= 1 ? 0.25 : 0, y: animationPhase >= 1 ? 0 : 50 }}
            transition={{ duration: 2, delay: 1.5 }}
          >
            {/* Medium Tree */}
            <path
              d="M1000 650 Q1005 630 1002 610 Q998 590 995 570 Q993 550 990 530 Q988 510 985 490"
              stroke="#8B7355"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              style={{ filter: 'url(#childDrawing)' }}
            />
            {/* Tree Crown */}
            <ellipse
              cx="985"
              cy="470"
              rx="45"
              ry="35"
              fill="#9CAF88"
              stroke="#7A9B6E"
              strokeWidth="3"
              style={{ filter: 'url(#childDrawing)' }}
            />
            {/* Small House */}
            <rect
              x="965"
              y="480"
              width="40"
              height="30"
              fill="#D4A574"
              stroke="#B8935F"
              strokeWidth="2"
              style={{ filter: 'url(#childDrawing)' }}
            />
            {/* Small Roof */}
            <path
              d="M960 480 L985 460 L1010 480 Z"
              fill="#C85A5A"
              stroke="#B04545"
              strokeWidth="2"
              style={{ filter: 'url(#childDrawing)' }}
            />
          </motion.g>

          {/* Ground Elements */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: animationPhase >= 1 ? 0.2 : 0 }}
            transition={{ duration: 2, delay: 2 }}
          >
            {/* Winding Path */}
            <path
              d="M200 700 Q400 680 600 690 Q800 700 1000 680"
              stroke="#D2B48C"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
              style={{ filter: 'url(#childDrawing)' }}
            />
            {/* Flowers along path */}
            {[...Array(8)].map((_, i) => (
              <motion.g
                key={i}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                style={{ transformOrigin: `${300 + i * 100}px 680px` }}
              >
                <circle
                  cx={300 + i * 100}
                  cy="680"
                  r="8"
                  fill={i % 3 === 0 ? "#E8A5A5" : i % 3 === 1 ? "#A5C5E8" : "#E8E5A5"}
                  stroke="#7A9B6E"
                  strokeWidth="2"
                  style={{ filter: 'url(#childDrawing)' }}
                />
                <path
                  d={`M${300 + i * 100} 680 L${300 + i * 100} 700`}
                  stroke="#7A9B6E"
                  strokeWidth="3"
                  style={{ filter: 'url(#childDrawing)' }}
                />
              </motion.g>
            ))}
          </motion.g>

          {/* Flying Birds */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: animationPhase >= 2 ? 0.4 : 0 }}
            transition={{ duration: 1, delay: 3 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${400 + i * 80} ${200 + i * 20} Q${410 + i * 80} ${195 + i * 20} ${420 + i * 80} ${200 + i * 20} Q${430 + i * 80} ${195 + i * 20} ${440 + i * 80} ${200 + i * 20}`}
                stroke="#3D4852"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                animate={{
                  x: [0, 100, 200],
                  y: [0, -20, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
                style={{ filter: 'url(#childDrawing)' }}
              />
            ))}
          </motion.g>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Animated Title */}
        <div className="text-center mb-12">
          <motion.div className="relative">
            {/* Letter by letter animation for "Remind" */}
            <div className="font-playfair text-8xl md:text-9xl font-bold text-[#3D4852] mb-4 flex justify-center">
              {['R', 'e', 'm', 'i', 'n', 'd'].map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 100, rotate: 45 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    rotate: 0,
                    color: [
                      'var(--app-accent)',
                      '#F59E0B',
                      '#10B981',
                      '#6366F1',
                      '#EF4444',
                      '#818CF8',
                    ][index % 6]
                  }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.2,
                    color: { duration: 2, repeat: Infinity, delay: 2 }
                  }}
                  className="inline-block text-gradient drop-shadow-lg"
                  style={{
                    textShadow: '0 4px 16px rgba(99,102,241,0.2)',
                    filter: 'url(#childDrawing)'
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            {/* Magical sparkles around title */}
            {animationPhase >= 2 && (
              <>
                <motion.div
                  className="absolute -top-8 -left-8"
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                >
                  <Star size={24} className="text-[#A8C5D4]" />
                </motion.div>
                <motion.div
                  className="absolute -top-4 -right-12"
                  animate={{ 
                    rotate: -360,
                    scale: [1, 1.3, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2.5, repeat: Infinity, delay: 0.5 }
                  }}
                >
                  <Heart size={20} className="text-[#E8A5A5]" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-6 left-1/2 transform -translate-x-1/2"
                  animate={{ 
                    y: [0, -10, 0],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles size={18} className="text-[#E8E5A5]" />
                </motion.div>
              </>
            )}
          </motion.div>
          {/* Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="text-2xl md:text-3xl font-semibold text-center text-gradient mb-6"
          >
            Mint Every Memory
          </motion.div>
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: animationPhase >= 3 ? 1 : 0, y: animationPhase >= 3 ? 0 : 30 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="font-nunito text-2xl text-[#3D4852] opacity-70 italic"
            style={{ filter: 'url(#childDrawing)' }}
          >
            Where memories become eternal treasures
          </motion.p>
          {/* Magical description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animationPhase >= 3 ? 1 : 0, y: animationPhase >= 3 ? 0 : 20 }}
            transition={{ duration: 1, delay: 1 }}
            className="font-nunito text-lg text-[#3D4852] opacity-60 mt-4 max-w-2xl mx-auto leading-relaxed"
          >
            Step into a world where your most precious moments transform into magical memory coins, 
            living forever in the enchanted realm of the blockchain
          </motion.p>
        </div>
        {/* Enter Button */}
        {showButton && (
          <motion.button
            onClick={onEnter}
            initial={{ opacity: 0, scale: 0, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.5
            }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: '0 20px 40px rgba(168, 197, 212, 0.4)'
            }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#A8C5D4] hover:bg-[#B9D3E2] text-white font-nunito font-semibold py-6 px-12 rounded-full text-xl transition-all duration-300 flex items-center gap-4 shadow-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #A8C5D4 0%, #B9D3E2 100%)',
              filter: 'url(#childDrawing)'
            }}
          >
            {/* Button glow effect */}
            <motion.div
              className="absolute inset-0 bg-white opacity-20 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <Heart size={24} />
            <span>Begin Your Journey</span>
            {/* Floating hearts */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ 
                y: [0, -20, 0],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: 1
              }}
            >
              <Heart size={16} className="text-[#E8A5A5]" />
            </motion.div>
          </motion.button>
        )}
      </div>
      {/* SVG Filters */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="roughPaper">
            <feTurbulence baseFrequency="0.04" numOctaves="3" result="noise" seed="2"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/>
          </filter>
          <filter id="childDrawing">
            <feTurbulence baseFrequency="0.08" numOctaves="2" result="noise" seed="5"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3"/>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default LandingPage; 