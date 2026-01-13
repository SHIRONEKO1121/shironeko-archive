import React from 'react';

// Art Deco Corner (Reference Style)
export const ArtDecoCorner = ({ className, rotate = 0 }: { className?: string, rotate?: number }) => (
  <svg 
    className={className} 
    viewBox="0 0 100 100" 
    fill="none" 
    stroke="currentColor" 
    style={{ transform: `rotate(${rotate}deg)` }}
  >
     {/* Outer Quarter Circle */}
     <path d="M5,100 L5,40 C5,20 20,5 40,5 L100,5" strokeWidth="2.5" />
     {/* Inner Vertical Line */}
     <path d="M5,100 L5,30" strokeWidth="2" />
     {/* Stylized Leaf/Feature */}
     <path d="M5,30 C5,30 35,30 35,60 C35,80 5,90 5,90" strokeWidth="2" fill="none" />
     <path d="M5,30 L35,60" strokeWidth="1" opacity="0.6" />
  </svg>
);

// Three Stars Decoration (Reference Style)
export const ThreeStars = ({ className }: { className?: string }) => (
    <div className={`flex gap-3 ${className}`}>
        <svg viewBox="0 0 20 20" width="8" height="8" fill="currentColor">
            <path d="M10,0 L13,7 L20,10 L13,13 L10,20 L7,13 L0,10 L7,7 Z" />
        </svg>
        <svg viewBox="0 0 20 20" width="10" height="10" fill="currentColor">
            <path d="M10,0 L13,7 L20,10 L13,13 L10,20 L7,13 L0,10 L7,7 Z" />
        </svg>
        <svg viewBox="0 0 20 20" width="8" height="8" fill="currentColor">
            <path d="M10,0 L13,7 L20,10 L13,13 L10,20 L7,13 L0,10 L7,7 Z" />
        </svg>
    </div>
);


// REFINED CLOCK FACE
export const ClockFace = ({ className, animated = true, simple = false }: { className?: string, animated?: boolean, simple?: boolean }) => {
    if (simple) return (
      <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="90" strokeWidth="4" />
        <circle cx="100" cy="100" r="95" strokeWidth="1" opacity="0.5" />
        <line x1="100" y1="100" x2="100" y2="40" strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="100" x2="140" y2="120" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="100" r="6" fill="currentColor" />
      </svg>
    );

    return (
      <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="95" strokeWidth="3" />
        <circle cx="100" cy="100" r="88" strokeWidth="1" />
        <circle cx="100" cy="100" r="82" strokeWidth="0.5" opacity="0.6" />
        <g strokeWidth="3" strokeLinecap="square">
            <g transform="translate(100, 24)">
               <path d="M-11,-8 L-5,8 M-11,8 L-5,-8" /> 
               <path d="M0,-8 L0,8" /> 
               <path d="M6,-8 L6,8" /> 
            </g>
            <g transform="translate(176, 100)">
               <path d="M-6,-8 L-6,8" /> 
               <path d="M0,-8 L0,8" />
               <path d="M6,-8 L6,8" />
            </g>
            <g transform="translate(100, 176)">
               <path d="M-6,-8 L0,8 L6,-8" /> 
               <path d="M9,-8 L9,8" /> 
            </g>
            <g transform="translate(24, 100)">
               <path d="M-6,-8 L-6,8" /> 
               <path d="M0,-8 L6,8 M0,8 L6,-8" /> 
            </g>
        </g>
        
        {/* Hour Hand (Previously Static, Now Animated) */}
        <g 
            className={animated ? "origin-[100px_100px] animate-spin-slow lg:animate-none lg:group-hover:animate-spin-slow" : ""} 
            style={animated ? { animationDuration: '60s' } : {}}
        >
            <g transform="rotate(305 100 100)">
                <path d="M98,100 L98,60 L102,60 L102,100 Z" fill="currentColor" stroke="none" />
                <path d="M100,35 C90,45 90,55 98,60 L102,60 C110,55 110,45 100,35 Z" fill="currentColor" stroke="none" />
            </g>
        </g>
        
        {/* Minute Hand */}
        <g className={animated ? "origin-[100px_100px] animate-spin-slow lg:animate-none lg:group-hover:animate-spin-slow" : ""}>
            <g transform="rotate(60 100 100)">
                <path d="M98.5,100 L98.5,40 L101.5,40 L101.5,100 Z" fill="currentColor" stroke="none" />
                <path d="M100,15 C90,25 90,35 98.5,40 L101.5,40 C110,35 110,25 100,15 Z" fill="currentColor" stroke="none" />
            </g>
        </g>
        <circle cx="100" cy="100" r="4" fill="currentColor" stroke="none" />
    </svg>
    );
};

// REFINED AIR BALLOON
export const AirBalloon = ({ className, animated = true, simple = false }: { className?: string, animated?: boolean, simple?: boolean }) => {
    const clipId = React.useId();
    const envelopePath = "M40,80 C40,10 160,10 160,80 C160,135 120,165 110,175 L90,175 C80,165 40,135 40,80 Z";

    if (simple) return (
      <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor">
         <path d="M40,80 C40,10 160,10 160,80 C160,135 120,165 110,175 L90,175 C80,165 40,135 40,80 Z" strokeWidth="4" />
         <rect x="80" y="180" width="40" height="15" rx="2" strokeWidth="4" />
         <line x1="50" y1="80" x2="150" y2="80" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" />
      </svg>
    );

    return (
        <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor">
          <defs>
              <clipPath id={clipId}>
                 <path d={envelopePath} />
              </clipPath>
          </defs>
          {/* Animation: Float on mobile default, only hover on desktop */}
          <g className={animated ? "animate-float lg:animate-none lg:group-hover:animate-float" : ""}>
            <path d={envelopePath} strokeWidth="3" />
            <g clipPath={`url(#${clipId})`}>
                <path d="M100,-10 C100,-10 100,180 100,190" strokeWidth="1.5" />
                <path d="M70,10 C50,70 80,160 90,180" strokeWidth="1.5" />
                <path d="M130,10 C150,70 120,160 110,180" strokeWidth="1.5" />
                <path d="M30,80 Q100,100 170,80" strokeWidth="1" strokeDasharray="4 2" />
            </g>
            <line x1="90" y1="175" x2="85" y2="190" strokeWidth="2" />
            <line x1="110" y1="175" x2="115" y2="190" strokeWidth="2" />
            <rect x="80" y="190" width="40" height="15" rx="2" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
          </g>
          <path d="M15,150 Q35,140 45,155" strokeWidth="1.5" opacity="0.6" />
          <path d="M165,60 Q185,50 195,65" strokeWidth="1.5" opacity="0.6" />
        </svg>
    );
};

// Vintage Lighthouse
export const Lighthouse = ({ className, animated = true, simple = false }: { className?: string, animated?: boolean, simple?: boolean }) => {
    if (simple) return (
      <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor">
         {/* Simple Stamp Style Lighthouse */}
         <path d="M65,180 L135,180 L125,50 L75,50 Z" strokeWidth="3" strokeLinejoin="round" />
         <path d="M70,50 L70,30 C70,20 85,15 100,15 C115,15 130,20 130,30 L130,50" strokeWidth="3" fill="none"/>
         <line x1="100" y1="15" x2="100" y2="5" strokeWidth="3" />
         <circle cx="100" cy="5" r="3" fill="currentColor" />
         
         {/* Beams */}
         <path d="M135,30 L170,40" strokeWidth="2" strokeDasharray="4 4" opacity="0.6"/>
         <path d="M135,30 L175,20" strokeWidth="2" strokeDasharray="4 4" opacity="0.6"/>
         <path d="M65,30 L30,40" strokeWidth="2" strokeDasharray="4 4" opacity="0.6"/>
         <path d="M65,30 L25,20" strokeWidth="2" strokeDasharray="4 4" opacity="0.6"/>

         {/* Base Detail */}
         <line x1="60" y1="180" x2="140" y2="180" strokeWidth="4" strokeLinecap="round" />
         <line x1="75" y1="140" x2="125" y2="140" strokeWidth="2" />
         <line x1="78" y1="100" x2="122" y2="100" strokeWidth="2" />
      </svg>
    );
    
    return (
    <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <path d="M30,180 Q50,165 100,175 Q150,165 170,180 L30,180 Z" strokeWidth="2" fill="none" />
      <path d="M75,170 L85,60 L115,60 L125,170" strokeWidth="3" strokeLinejoin="round" />
      <line x1="83" y1="90" x2="117" y2="90" strokeWidth="1.5" />
      <line x1="80" y1="120" x2="120" y2="120" strokeWidth="1.5" />
      <line x1="77" y1="150" x2="123" y2="150" strokeWidth="1.5" />
      <rect x="80" y="35" width="40" height="25" strokeWidth="2" />
      <path d="M80,35 L100,15 L120,35" strokeWidth="2" /> 
      <line x1="100" y1="15" x2="100" y2="10" strokeWidth="2" />
      <circle cx="100" cy="8" r="3" fill="currentColor" />
      <path d="M75,60 L125,60" strokeWidth="3" />
      
      {/* Animation: Pulse on mobile default, only hover on desktop */}
      <g className={animated ? "animate-pulse lg:animate-none lg:group-hover:animate-pulse" : ""}>
        <path d="M120,47 L160,35" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
        <path d="M120,47 L160,59" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      </g>
      <circle cx="100" cy="47" r="4" fill="currentColor" className={animated ? "animate-pulse lg:animate-none lg:group-hover:animate-pulse" : ""} />
    </svg>
    );
};

// Fountain Pen
export const FountainPen = ({ className, animated = true, simple = false }: { className?: string, animated?: boolean, simple?: boolean }) => {
    if (simple) return (
      <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor">
          <path d="M100,20 L60,80 L100,180 L140,80 Z" strokeWidth="4" strokeLinejoin="round" />
          <path d="M100,20 L100,120" strokeWidth="2" />
      </svg>
    );

    return (
  <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor">
      {/* Animation: Writing on mobile default, only hover on desktop */}
      <g className={animated ? "origin-[100px_100px] animate-writing lg:animate-none lg:group-hover:animate-writing" : ""}>
          <g transform="rotate(-45 100 100)">
            <path d="M100,40 L90,65 L100,75 L110,65 Z" strokeWidth="2" />
            <line x1="100" y1="40" x2="100" y2="60" strokeWidth="1.5" /> 
            <circle cx="100" cy="60" r="2" fill="currentColor" stroke="none" />
            
            <path d="M90,65 L88,95 L112,95 L110,65" strokeWidth="2" />
            <path d="M88,75 L112,75" strokeWidth="1" opacity="0.5"/>
            <path d="M88,85 L112,85" strokeWidth="1" opacity="0.5"/>

            <path d="M88,95 L88,170 C88,180 112,180 112,170 L112,95" strokeWidth="2" />
            
            <path d="M95,120 L95,160" strokeWidth="1.5" opacity="0.4" />
            <path d="M105,120 L105,160" strokeWidth="1.5" opacity="0.4" />
          </g>
      </g>
      <path d="M50,50 Q70,30 90,45 T120,30" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
  </svg>
    );
};
