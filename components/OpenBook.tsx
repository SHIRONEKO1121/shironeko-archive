import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category, Article } from '../types';
import Markdown from 'react-markdown';
import { ClockFace, AirBalloon, Lighthouse, FountainPen } from './Icons';

interface OpenBookProps {
  category: Category;
  activeArticleId?: string; // New prop for URL sync
  onBack: () => void;
  onArticleSelect: (article: Article | null) => void;
  isClosing: boolean;
  isZooming?: boolean;
  onDelete?: (categoryId: string, articleId: string) => void;
  canManage?: boolean;
}

type FontSizeOption = 'small' | 'medium' | 'large';
type MobileView = 'INDEX' | 'CONTENT';

const OpenBook: React.FC<OpenBookProps> = ({ category, activeArticleId, onBack, onArticleSelect, isClosing, isZooming = false, onDelete, canManage }) => {
  // Filter visible articles: Strictly hide drafts from the book view. 
  // Drafts are only accessible via the Editor ("Scribe's Desk") until published.
  const visibleArticles = useMemo(() => {
     return category.articles.filter(a => !a.isDraft);
  }, [category.articles]);

  const [activeArticle, setActiveArticle] = useState<Article | undefined>(() => {
      // Initialize with ID from URL if present
      if (activeArticleId) return visibleArticles.find(a => a.id === activeArticleId);
      return visibleArticles[0];
  });

  const [fontSize, setFontSize] = useState<FontSizeOption>('medium');
  const [mobileView, setMobileView] = useState<MobileView>('INDEX');
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string } | null>(null);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  // Audio State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getPixelSize = (size: FontSizeOption) => {
    switch(size) {
        case 'small': return 16;
        case 'large': return 21;
        default: return 18;
    }
  };

  const currentPixelSize = getPixelSize(fontSize);

  // Sync activeArticle with Prop (URL change)
  useEffect(() => {
      if (activeArticleId) {
          const matched = visibleArticles.find(a => a.id === activeArticleId);
          if (matched && matched.id !== activeArticle?.id) {
              setActiveArticle(matched);
              setMobileView('CONTENT'); // Auto-switch to content on mobile if deep linked
          }
      }
  }, [activeArticleId, visibleArticles, activeArticle]);

  // Handle local fallback if active article is deleted or list changes
  useEffect(() => {
    if (activeArticle && !visibleArticles.find(a => a.id === activeArticle.id)) {
        if (visibleArticles.length > 0) {
            // Default to first but wait for user interaction to update URL?
            // Better to let Parent handle "Empty State" or default logic
            setActiveArticle(visibleArticles[0]);
            onArticleSelect(visibleArticles[0]);
        } else {
            setActiveArticle(undefined);
            onArticleSelect(null);
        }
    } else if (!activeArticle && visibleArticles.length > 0 && !activeArticleId) {
        // Only default to first if no ID in URL
        setActiveArticle(visibleArticles[0]);
        onArticleSelect(visibleArticles[0]);
    }
  }, [visibleArticles, activeArticle, activeArticleId, onArticleSelect]);

  // --- AUDIO LOGIC ---
  useEffect(() => {
    const handleAudio = async () => {
        const url = activeArticle?.musicUrl;
        
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
            audioRef.current.volume = 0.4;
        }
        
        const audio = audioRef.current;

        if (url) {
             // Check if source is actually different to avoid reloading/stuttering
             const absoluteUrl = new URL(url, window.location.href).href;
             
             if (audio.src !== absoluteUrl) {
                 audio.src = url;
                 try {
                    await audio.play();
                    setIsPlaying(true);
                 } catch (e) {
                     // Autoplay likely blocked, wait for interaction
                     setIsPlaying(false);
                 }
             }
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    };
    
    handleAudio();

  }, [activeArticle?.id, activeArticle?.musicUrl]);

  // Cleanup audio on unmount
  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
      };
  }, []);

  const toggleMusic = () => {
      if (audioRef.current && activeArticle?.musicUrl) {
          if (isPlaying) {
              audioRef.current.pause();
          } else {
              audioRef.current.play().catch(e => console.error("Playback failed", e));
          }
          setIsPlaying(!isPlaying);
      }
  };

  const handleShare = async () => {
    try {
        await navigator.clipboard.writeText(window.location.href);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
  };

  const handleArticleClick = (article: Article) => {
    setActiveArticle(article);
    onArticleSelect(article); // Notify parent to update URL
    setMobileView('CONTENT');
  };

  const openImage = (url: string, caption?: string) => {
      setSelectedImage({ url, caption });
  };

  const closeImage = () => {
      setSelectedImage(null);
  };

  // Safe index check
  const currentIndex = activeArticle ? visibleArticles.findIndex(a => a.id === activeArticle.id) : -1;
  const romanNumeral = currentIndex !== -1 ? (['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][currentIndex] || (currentIndex + 1)) : '';

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

  // Animation Class Logic:
  const getAnimationClass = (side: 'left' | 'right') => {
      if (isZooming) return 'opacity-0'; 
      if (isClosing) return `opacity-0 lg:animate-fold-${side} transition-opacity duration-500`;
      return `animate-fade-in lg:animate-unfold-${side}`;
  };

  return (
    // Update: Remove fixed aspect ratio on MD. Use w-full h-full on MD for full screen experience.
    <div className="relative w-full h-full md:w-full md:h-full lg:w-auto lg:h-[85vh] lg:max-w-[95vw] lg:aspect-[1.55/1] z-50 flex justify-center items-center perspective-2000">
      <div className="flex flex-col lg:flex-row w-full h-full relative transform-style-3d shadow-[0_30px_70px_-10px_rgba(0,0,0,0.7)] rounded-sm">
        
        {/* --- LEFT PAGE (Index) --- */}
        <div className={`w-full md:w-full lg:w-1/2 h-full lg:h-full relative z-20 origin-bottom lg:origin-right transform-style-3d ${mobileView === 'CONTENT' ? 'hidden lg:block' : 'block'} ${getAnimationClass('left')}`}>
          {/* Background & Shadow (Floating on Desktop Only now) */}
          <div className="absolute inset-0 md:inset-0 lg:-translate-x-1 lg:translate-y-1 md:rounded-none lg:rounded-l-md lg:rounded-r-none shadow-2xl -z-10 hidden lg:block" style={{ backgroundColor: category.colorHex, filter: 'brightness(0.8)' }}></div>
          
          {/* Parchment Page */}
          <div className="h-full w-full texture-parchment md:rounded-none lg:rounded-l-md lg:rounded-r-none overflow-hidden relative flex flex-col border-b md:border-0 border-[#5d4037]/30 backface-hidden">
             <div className="absolute inset-0 texture-foxing z-0"></div>
             <div className="absolute inset-0 texture-damage z-0"></div>
             {/* Spine Shadow (Visible on LG) */}
             <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#2d1b12]/40 via-[#3e2723]/10 to-transparent pointer-events-none z-10 hidden lg:block"></div>
             <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(62,39,35,0.3)] pointer-events-none z-10"></div>
             <button onClick={onBack} className="absolute left-2 top-2 md:left-6 md:top-6 z-50 text-[#3e2723] hover:text-[#1a120b] hover:bg-[#3e2723]/5 rounded-full p-3 transition-all" title="Close Book">
                <span className="material-symbols-outlined font-bold text-xl md:text-2xl lg:hidden">arrow_back</span>
                <span className="material-symbols-outlined font-bold text-xl md:text-2xl hidden lg:block">close</span>
             </button>
             <div className="absolute top-0 left-0 w-32 h-32 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/flower-trail.png')] pointer-events-none mix-blend-multiply z-0"></div>

             <div className="flex-1 p-6 md:p-10 lg:p-12 lg:pr-16 overflow-y-auto custom-scrollbar relative z-10 pt-16 md:pt-20">
                <div className="mb-6 lg:mb-10 text-center relative">
                    <div className="inline-block border-b-2 border-[#5d4037]/40 pb-2 px-8">
                        <h1 className="font-display text-2xl lg:text-3xl text-[#2a1b12] font-bold tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">{category.title}</h1>
                    </div>
                </div>
                <div className="space-y-4 lg:space-y-6 px-2">
                    {visibleArticles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-10 opacity-50">
                            <span className="material-symbols-outlined text-3xl mb-2 text-[#5d4037]">content_paste_off</span>
                            <span className="font-serif italic text-sm text-[#5d4037]">No published entries.</span>
                        </div>
                    ) : (
                        visibleArticles.map((article, idx) => (
                            <div key={article.id} onClick={() => handleArticleClick(article)} className={`cursor-pointer group flex items-baseline gap-4 transition-all duration-300 ${activeArticle?.id === article.id ? 'opacity-100' : 'opacity-60 hover:opacity-90'}`}>
                                <span className="font-display text-[#5d4037] font-bold text-sm w-6 text-right">{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][idx] || (idx + 1)}</span>
                                <div className={`flex-1 border-b ${activeArticle?.id === article.id ? 'border-[#3e2723]' : 'border-transparent group-hover:border-[#8d6e63]'} pb-1 transition-colors flex items-center justify-between`}>
                                    <h3 className={`font-serif text-lg font-bold ${activeArticle?.id === article.id ? 'text-[#1a120b]' : 'text-[#3e2723]'}`}>{article.title}</h3>
                                    <span className={`text-[10px] font-sans tracking-wider uppercase hidden md:inline-block ml-4 ${activeArticle?.id === article.id ? 'text-[#3e2723] font-bold' : 'text-[#5d4037]/60'}`}>
                                        {article.date}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-auto pt-8 lg:pt-16 flex justify-center opacity-20 mix-blend-multiply">
                    <SelectedIcon className="w-24 h-24 lg:w-32 lg:h-32 text-[#3e2723]/60" animated={false} simple={true} />
                </div>
             </div>
          </div>
        </div>

        {/* --- CENTER BINDING (Only on Desktop Double Spread) --- */}
        <div className={`hidden lg:block absolute left-1/2 top-0 bottom-0 w-0 z-30 transition-opacity duration-500 ${(isZooming || isClosing) ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute -left-3 w-6 h-full bg-gradient-to-r from-transparent via-[#3e2723]/40 to-transparent blur-[2px] pointer-events-none"></div>
        </div>

        {/* --- RIGHT PAGE (Content) --- */}
        <div className={`w-full md:w-full lg:w-1/2 h-full lg:h-full relative z-20 origin-top lg:origin-left transform-style-3d ${mobileView === 'INDEX' ? 'hidden lg:block' : 'block'} ${getAnimationClass('right')}`}>
          {/* Background & Shadow (Floating on Desktop Only now) */}
          <div className="absolute inset-0 md:inset-0 lg:translate-x-1 lg:translate-y-1 md:rounded-none lg:rounded-r-md lg:rounded-l-none shadow-2xl -z-10 hidden lg:block" style={{ backgroundColor: category.colorHex, filter: 'brightness(0.8)' }}></div>
          
          {/* Parchment Page */}
          <div className="h-full w-full texture-parchment md:rounded-none lg:rounded-r-md lg:rounded-l-none overflow-hidden relative flex flex-col backface-hidden">
            <div className="absolute inset-0 texture-foxing z-0"></div>
            <div className="absolute inset-0 texture-damage z-0"></div>
            {/* Spine Shadow (Visible on LG) */}
            <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#2d1b12]/40 via-[#3e2723]/10 to-transparent pointer-events-none z-10 hidden lg:block"></div>
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(62,39,35,0.3)] pointer-events-none z-10"></div>
            <button onClick={() => setMobileView('INDEX')} className="lg:hidden absolute left-2 top-2 z-50 text-[#3e2723] hover:text-[#1a120b] hover:bg-[#3e2723]/5 rounded-full p-3 transition-all" title="Back to Index">
                <span className="material-symbols-outlined font-bold text-xl">arrow_back</span>
            </button>
            
            <div className="flex-1 p-6 md:p-10 lg:p-12 lg:pl-16 overflow-y-auto relative scroll-smooth custom-scrollbar z-10 pt-16 md:pt-10 lg:pt-12">
                {activeArticle ? (
                    <>
                        <div className="flex justify-between items-center mb-6 lg:mb-8 border-b border-[#5d4037]/30 pb-4">
                            <div className="flex items-center gap-3">
                                <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#3e2723] uppercase flex items-center gap-2">
                                    {activeArticle.date}
                                </span>
                                {activeArticle.location && (
                                    <>
                                        <span className="text-[#5d4037]/40 text-[10px]">|</span>
                                        <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#3e2723] uppercase flex items-center gap-2">
                                            {activeArticle.location}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2 bg-[#3e2723]/10 rounded-full px-3 py-1 backdrop-blur-sm shadow-inner">
                                {activeArticle.musicUrl && (
                                    <>
                                        <button onClick={toggleMusic} className={`flex items-center justify-center w-5 h-5 md:w-auto md:h-auto text-sm font-serif ${isPlaying ? 'text-[#1a120b] font-bold animate-pulse' : 'text-[#5d4037]'}`} title={isPlaying ? "Pause Music" : "Play Music"}>
                                            <span className="material-symbols-outlined text-sm">{isPlaying ? 'music_note' : 'music_off'}</span>
                                        </button>
                                        <span className="text-[#5d4037]/40">|</span>
                                    </>
                                )}
                                <button onClick={handleShare} className="text-[#5d4037] hover:text-[#1a120b] transition-colors relative" title="Copy Link">
                                    <span className="material-symbols-outlined text-sm">
                                        {showCopyFeedback ? 'check' : 'share'}
                                    </span>
                                    {showCopyFeedback && (
                                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#3e2723] text-[#d7ccc8] text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 font-sans tracking-wider border border-[#5d4037] animate-[fadeIn_0.2s_ease-out_forwards]">
                                            Link Copied
                                        </span>
                                    )}
                                </button>
                                <span className="text-[#5d4037]/40">|</span>
                                <button onClick={() => setFontSize('small')} className={`text-xs font-serif ${fontSize === 'small' ? 'text-[#1a120b] font-bold' : 'text-[#5d4037]'}`}>A</button>
                                <span className="text-[#5d4037]/40">|</span>
                                <button onClick={() => setFontSize('medium')} className={`text-sm font-serif ${fontSize === 'medium' ? 'text-[#1a120b] font-bold' : 'text-[#5d4037]'}`}>A</button>
                                <span className="text-[#5d4037]/40">|</span>
                                <button onClick={() => setFontSize('large')} className={`text-lg font-serif ${fontSize === 'large' ? 'text-[#1a120b] font-bold' : 'text-[#5d4037]'}`}>A</button>
                            </div>
                        </div>
                        
                        {/* Article Cover Image Display - Floated Parchment Style */}
                        {activeArticle.imageUrl && (
                            <div className="float-right ml-6 mb-6 w-1/2 md:w-1/3 transform rotate-1 z-10 relative">
                                <div className="bg-[#f0ebd8] p-2 shadow-lg border border-[#8d6e63] texture-parchment">
                                    <div className="border border-[#8d6e63]/50 p-1">
                                        <img 
                                            src={activeArticle.imageUrl} 
                                            alt="Cover" 
                                            className="w-full h-auto object-cover sepia-[.3] contrast-110 brightness-95"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <h2 className="font-display text-2xl lg:text-4xl text-[#1a120b] font-bold mb-4 lg:mb-6 leading-[1.1] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">{activeArticle.title}</h2>

                        <div className="prose prose-sm lg:prose-base prose-p:font-serif prose-p:text-[#2d1b12] prose-headings:font-display prose-headings:text-[#1a120b] prose-blockquote:border-l-[#3e2723] prose-blockquote:text-[#2d1b12] prose-blockquote:bg-[#3e2723]/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic max-w-none">
                            <Markdown
                                    urlTransform={(uri) => uri}
                                    components={{
                                    p: ({node, children}) => {
                                        const isFirst = node?.position?.start.line === 1 || (typeof children?.[0] === 'string' && (children[0] as string).startsWith('The '));
                                        const style = { fontSize: `${currentPixelSize}px`, lineHeight: '1.7', textShadow: '0px 0px 1px rgba(62, 39, 35, 0.1)' };
                                        if (isFirst) {
                                            return (<p className="mb-4 text-justify first-letter:text-4xl lg:first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:text-[#1a120b] first-letter:mr-1 first-letter:drop-shadow-sm" style={style}>{children}</p>)
                                        }
                                        return <p className="mb-4 text-justify indent-6 lg:indent-8" style={style}>{children}</p>
                                    },
                                    img: ({node, src, alt, ...props}) => {
                                            const parts = (alt || '').split('|');
                                            const altText = parts[0];
                                            const align = parts.length > 1 ? parts[1] : 'center'; 
                                            const sizeParam = parts.length > 2 ? parts[2] : 'medium'; 
                                            
                                            let alignClass = 'block mx-auto mb-6';
                                            if (align === 'left') alignClass = 'float-left mr-6 mb-4 clear-right';
                                            if (align === 'right') alignClass = 'float-right ml-6 mb-4 clear-left';

                                            let widthStyle: any = {};
                                            let sizeClass = '';
                                            
                                            if (sizeParam.endsWith('%') || sizeParam.endsWith('px')) {
                                                widthStyle = { width: sizeParam };
                                            } else {
                                                if (sizeParam === 'small') sizeClass = 'w-1/3';
                                                else if (sizeParam === 'medium') sizeClass = 'w-1/2';
                                                else if (sizeParam === 'large') sizeClass = 'w-full';
                                                else sizeClass = 'w-full md:w-2/3';
                                            }

                                            return (
                                                <span 
                                                    className={`${alignClass} ${sizeClass} cursor-zoom-in hover:scale-105 transition-transform z-10 relative`} 
                                                    style={widthStyle}
                                                    onClick={() => typeof src === 'string' && openImage(src, altText)}
                                                >
                                                    <img src={src} alt={altText} {...props} className="block w-full h-auto" />
                                                    {altText && (
                                                        <span className="block mt-1 text-center font-serif italic text-xs text-[#5d4037] opacity-80">
                                                            {altText}
                                                        </span>
                                                    )}
                                                </span>
                                            )
                                    }
                                }}
                            >
                                {activeArticle.content}
                            </Markdown>
                        </div>

                        <div className="mt-8 lg:mt-16 text-center">
                            <div className="w-16 h-[1px] bg-[#5d4037]/40 mx-auto mb-2"></div>
                            <span className="font-display text-[#3e2723]/70 text-xs tracking-widest">— {romanNumeral} —</span>
                        </div>
                        <div className="h-12 lg:hidden"></div>
                    </>
                ) : (
                    // Empty State - Not Yet Unlocked
                    <div className="h-full flex flex-col items-center justify-center animate-fade-in opacity-80">
                        <div className="w-24 h-24 rounded-full border-2 border-[#5d4037]/30 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-5xl text-[#3e2723]/60">lock</span>
                        </div>
                        <h2 className="font-display text-2xl md:text-3xl text-[#1a120b] font-bold tracking-[0.2em] uppercase mb-3">Not Yet Unlocked</h2>
                        <p className="font-serif text-[#5d4037] text-lg italic max-w-sm text-center leading-relaxed">
                           The pages are empty. <br/> The story has not yet begun.
                        </p>
                    </div>
                )}
            </div>
          </div>
        </div>

      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in" onClick={closeImage}>
            <div className="relative max-w-[90vw] max-h-[90vh] bg-[#f0ebd8] p-3 md:p-4 shadow-2xl transform transition-all duration-300 scale-100 flex flex-col items-center border border-[#8d6e63]" onClick={(e) => e.stopPropagation()}>
                <button className="absolute -top-4 -right-4 bg-[#3e2723] text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-[#5d4037] z-10 border border-[#8d6e63]" onClick={closeImage}>
                    <span className="material-symbols-outlined text-sm font-bold">close</span>
                </button>
                <div className="flex-1 overflow-hidden flex items-center justify-center">
                    <img src={selectedImage.url} alt="Full View" className="max-w-full max-h-[80vh] object-contain shadow-inner sepia-[0.2]" />
                </div>
                {selectedImage.caption && (
                     <div className="mt-4 w-full text-center border-t border-[#8d6e63]/30 pt-3">
                        <p className="font-serif italic text-[#3e2723] text-sm md:text-base max-w-prose mx-auto leading-relaxed">
                            {selectedImage.caption}
                        </p>
                     </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default OpenBook;