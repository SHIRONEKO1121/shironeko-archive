import React from 'react';
import { Category } from '../types';
import { ArtDecoCorner, ThreeStars, ClockFace, AirBalloon, Lighthouse, FountainPen } from './Icons';

interface BookCoverProps {
  category: Category;
  onClick: (category: Category) => void;
  isStatic?: boolean; 
}

const BookCover: React.FC<BookCoverProps> = ({ category, onClick, isStatic = false }) => {
  const hoverEffectClasses = isStatic 
    ? '' 
    : 'cursor-pointer transition-all duration-700 ease-out ' +
      'animate-float lg:animate-none ' + // Mobile: Float continuously, no hover effect. Desktop: No float, enable hover.
      'lg:hover:-translate-y-4 lg:hover:scale-[1.02] lg:hover:rotate-x-2 lg:hover:shadow-2xl group'; // Desktop hover effects

  const goldColor = "#C5A059"; // Antique Matte Gold (Less yellow/shiny)
  
  // Select Icon based on Category ID
  const getIcon = () => {
      switch(category.id) {
          case 'travel': return AirBalloon;
          case 'review': return Lighthouse;
          case 'diary': return ClockFace;
          case 'draft': return FountainPen;
          default: return ClockFace; 
      }
  };

  const SelectedIcon = getIcon();

  return (
    <div 
      className={`relative block w-full max-w-[140px] md:max-w-[180px] lg:max-w-none lg:w-[220px] xl:w-[260px] perspective-1000 z-10 ${hoverEffectClasses}`}
      style={{ aspectRatio: '2/3' }}
      onClick={() => onClick(category)}
    >
      {/* Book Body */}
      <div 
          className={`relative w-full h-full rounded-r-[2px] rounded-l-[1px] overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] border-l border-white/5`}
          style={{ 
              // Matte Cloth effect: Darker linear gradient with heavy texture overlay
              background: `linear-gradient(135deg, ${category.colorHex} 0%, #111 120%)`,
              filter: 'sepia(0.2) contrast(1.1) brightness(0.95)' // Aged look
          }}
      >
          {/* --- Textures (Heavier for Retro Cloth Look) --- */}
          <div className="absolute inset-0 texture-cloth z-10 pointer-events-none"></div>
          <div className="absolute inset-0 texture-noise opacity-30 pointer-events-none z-10 mix-blend-overlay"></div>
          
          {/* Spine Shadow */}
          <div className="absolute top-0 bottom-0 left-0 w-8 spine-shadow z-20 pointer-events-none mix-blend-multiply opacity-80"></div>

          {/* Raised Spine Bands (Subtle) */}
          <div className="absolute left-0 w-6 top-[15%] h-[2px] bg-white/10 blur-[0.5px] z-30 opacity-40 box-content border-t border-black/30"></div>
          <div className="absolute left-0 w-6 top-[85%] h-[2px] bg-white/10 blur-[0.5px] z-30 opacity-40 box-content border-t border-black/30"></div>
          
          {/* --- LAYOUT CONTENT --- */}
          {/* Gold Inset Frame (Double Line) - Reduced opacity for matte look */}
          <div className="absolute inset-2 lg:inset-3 border border-[#C5A059]/40 rounded-[1px] z-30 pointer-events-none mix-blend-screen"></div>
          <div className="absolute inset-[10px] lg:inset-[14px] border border-[#C5A059]/30 rounded-[1px] z-30 pointer-events-none mix-blend-screen"></div>

          {/* Absolute Corners (Removed from flow to prevent mobile overflow) */}
          <div className="absolute top-4 left-4 lg:top-5 lg:left-5 z-40 opacity-80 drop-shadow-sm w-12 h-12 lg:w-16 lg:h-16" style={{ color: goldColor }}>
              <ArtDecoCorner className="w-full h-full" rotate={0} />
          </div>
          <div className="absolute top-4 right-4 lg:top-5 lg:right-5 z-40 opacity-80 drop-shadow-sm w-12 h-12 lg:w-16 lg:h-16" style={{ color: goldColor }}>
              <ArtDecoCorner className="w-full h-full" rotate={90} />
          </div>
          <div className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6 z-40 opacity-80 drop-shadow-sm w-12 h-12 lg:w-16 lg:h-16" style={{ color: goldColor }}>
              <ArtDecoCorner className="w-full h-full" rotate={-90} />
          </div>
          <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 z-40 opacity-80 drop-shadow-sm w-12 h-12 lg:w-16 lg:h-16" style={{ color: goldColor }}>
              <ArtDecoCorner className="w-full h-full" rotate={180} />
          </div>

          <div 
            className="absolute inset-0 z-30 p-4 lg:p-5 flex flex-col items-center justify-center"
            style={{ color: goldColor }}
          >
             {/* DECORATION: Three Stars (Reference Style) */}
             <div className="mt-8 mb-4 lg:mt-12 lg:mb-6 opacity-70">
                <ThreeStars />
             </div>

             {/* CENTER SECTION: Icon */}
             <div className="flex-1 flex flex-col items-center justify-center -mt-2 lg:-mt-4">
                 <div className="relative w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 xl:w-52 xl:h-52" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }}>
                     
                     {/* GOLD HALO - Natural, diffused glow */}
                     <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full pointer-events-none mix-blend-screen"
                        style={{
                            background: 'radial-gradient(closest-side, #C5A059 0%, transparent 100%)',
                            opacity: 0.15, 
                            filter: 'blur(20px)'
                        }}
                     ></div>
                     
                     <SelectedIcon className="w-full h-full opacity-90 relative z-10" />
                     {/* Decorative circle outline behind icon (Reference style) - Thinner, less bright */}
                     <div className="absolute inset-0 border border-dashed border-[#C5A059]/20 rounded-full scale-110 pointer-events-none"></div>
                 </div>
             </div>

             {/* BOTTOM SECTION: Title */}
             <div className="text-center w-full px-2 mb-6 lg:mb-8 relative z-50">
                <h2 
                    className="font-display font-bold text-lg md:text-2xl lg:text-3xl tracking-[0.15em] leading-tight uppercase gold-foil-text drop-shadow-md break-words"
                >
                    {category.title}
                </h2>
             </div>

          </div>
      </div>

      {/* Book Thickness */}
      <div 
          className="absolute top-[2px] bottom-[2px] right-0 w-[6px] translate-x-[5px] translate-z-[-2px] rounded-r-[2px] book-edge z-0 shadow-xl border-l border-black/30"
          style={{ 
              backgroundColor: category.colorHex,
              filter: 'brightness(0.6) saturate(0.8)' 
          }}
      ></div>
    </div>
  );
};

export default BookCover;