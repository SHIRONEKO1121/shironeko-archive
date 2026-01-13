import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CATEGORIES } from './constants';
import { Category, Article } from './types';
import BookCover from './components/BookCover';
import OpenBook from './components/OpenBook';
import AIChat from './components/AIChat';
import PasswordModal from './components/PasswordModal';
import Editor from './components/Editor';
import { subscribeToPublishedArticles } from './services/articleService';

type AnimationPhase = 'IDLE' | 'ZOOMING' | 'READING' | 'CLOSING';

const App: React.FC = () => {
  // --- Route Hooks ---
  const location = useLocation();
  const navigate = useNavigate();

  // State for Categories (initialized from local storage or constants)
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('scribe_categories');
    return saved ? JSON.parse(saved) : CATEGORIES;
  });
  
  // Published articles from Firebase
  const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
  
  // Merged categories with published articles
  const [mergedCategories, setMergedCategories] = useState<Category[]>(categories);

  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('IDLE');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Editor & Auth State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Persist categories when they change
  useEffect(() => {
    localStorage.setItem('scribe_categories', JSON.stringify(categories));
  }, [categories]);
  
  // Subscribe to published articles from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToPublishedArticles((articles) => {
      setPublishedArticles(articles);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Merge local categories with published articles from Firebase
  useEffect(() => {
    const merged = categories.map(category => {
      // Get published articles for this category
      const publishedForCategory = publishedArticles.filter(
        article => article.categoryId === category.id
      );
      
      // Get local articles (drafts and unpublished)
      const localArticles = category.articles || [];
      
      // Combine them, avoiding duplicates (published articles take precedence)
      const articleMap = new Map<string, Article>();
      
      // Add local articles first
      localArticles.forEach(article => {
        articleMap.set(article.id, article);
      });
      
      // Override with published articles (they're the source of truth for published content)
      publishedForCategory.forEach(article => {
        articleMap.set(article.id, article);
      });
      
      return {
        ...category,
        articles: Array.from(articleMap.values())
      };
    });
    
    setMergedCategories(merged);
  }, [categories, publishedArticles]);

  // --- ROUTING SYNC ---
  // When URL changes, update internal state
  useEffect(() => {
     const path = location.pathname; // e.g. "/travel/article-id"
     // Remove leading slash and split. Note basename /archive is handled by Router.
     const parts = path.split('/').filter(p => p !== '');
     const catId = parts[0];
     const artId = parts[1];

     if (!catId) {
         // Root Path
         if (animationPhase === 'READING' || animationPhase === 'ZOOMING') {
             // If we were reading, trigger closing animation but don't navigate again
             handleBackToHome(true); 
         } else {
             // Reset state instantly if mounting or idle
             if (selectedCategory) {
                 setSelectedCategory(null);
                 setCurrentArticle(null);
                 setAnimationPhase('IDLE');
             }
         }
     } else {
         // Deep Link or Navigation to Category
         const cat = mergedCategories.find(c => c.id === catId);
         if (cat) {
             // Sync Category State
             if (selectedCategory?.id !== cat.id) {
                 // If different category, set it.
                 // If we are IDLE, we need to "Open" it (maybe instantly if loaded directly)
                 if (animationPhase === 'IDLE') {
                     setSelectedCategory(cat);
                     setAnimationPhase('READING'); // Skip zoom for deep link load
                 } else {
                     setSelectedCategory(cat); // Switched while open?
                 }
             }

             // Sync Article State
             if (artId) {
                 const art = cat.articles.find(a => a.id === artId);
                 if (art && currentArticle?.id !== art.id) {
                     setCurrentArticle(art);
                 }
             } else {
                 if (currentArticle) setCurrentArticle(null);
             }
         }
     }
  }, [location.pathname, mergedCategories]); // Do NOT depend on selectedCategory/animationPhase to avoid loops, only URL and Data source

  // Sync selectedCategory updates from storage (deletion support)
  useEffect(() => {
    if (selectedCategory) {
        const updated = mergedCategories.find(c => c.id === selectedCategory.id);
        if (updated && updated !== selectedCategory) {
             setSelectedCategory(updated);
        }
    }
  }, [mergedCategories, selectedCategory]); 


  // Handles the sequence: Click -> Zoom -> Open -> Read
  const handleCategorySelect = (category: Category) => {
    // We need to use the latest category object from state to ensure we see new articles
    const latestCategory = categories.find(c => c.id === category.id) || category;
    
    // Preload the first article's image if available to prevent pop-in
    if (latestCategory.articles[0]?.imageUrl) {
        const img = new Image();
        img.src = latestCategory.articles[0].imageUrl;
    }

    setSelectedCategory(latestCategory);
    setAnimationPhase('ZOOMING');

    // Navigation triggers the URL update, the Effect will confirm the state
    // But we set state here to trigger the animation component first.
    // We delay navigation slightly to allow zoom start? 
    // Actually, update URL immediately is better for history, but might cause "Instant Open" in Effect.
    // Effect checks: if catId present and phase IDLE -> Reading.
    // If we set Phase ZOOMING here, Effect won't override it?
    // Let's rely on standard flow:
    
    setTimeout(() => {
        setAnimationPhase('READING'); // This triggers the animation inside OpenBook
        navigate(latestCategory.id); // Update URL to /category
    }, 600); 
  };

  // Handles the sequence: Close -> Un-Open -> Un-Zoom -> Idle
  // skipNavigate is used when the browser back button triggered this
  const handleBackToHome = (skipNavigate = false) => {
    setAnimationPhase('CLOSING'); // Triggers "folding" animation inside OpenBook
    setIsChatOpen(false);
    
    // Wait for fold animation (0.8s) to finish before showing shelf again
    setTimeout(() => {
        setAnimationPhase('IDLE');
        setSelectedCategory(null);
        setCurrentArticle(null);
        if (!skipNavigate) {
            navigate('/');
        }
    }, 800); 
  };

  const handleArticleNavigation = (article: Article | null) => {
      setCurrentArticle(article);
      if (selectedCategory) {
          if (article) {
              navigate(`${selectedCategory.id}/${article.id}`);
          } else {
              navigate(`${selectedCategory.id}`);
          }
      }
  };

  // Handle adding or updating article
  const handleSaveArticle = (categoryId: string, article: Article) => {
    setCategories(prev => {
        return prev.map(cat => {
            if (cat.id === categoryId) {
                // Check if article exists
                const existingIndex = cat.articles.findIndex(a => a.id === article.id);
                let updatedArticles;
                if (existingIndex >= 0) {
                    // Update
                    updatedArticles = [...cat.articles];
                    updatedArticles[existingIndex] = article;
                } else {
                    // Add New
                    updatedArticles = [article, ...cat.articles];
                }
                return { ...cat, articles: updatedArticles };
            }
            return cat;
        });
    });
  };

  // Handle deleting article
  const handleDeleteArticle = (categoryId: string, articleId: string) => {
    setCategories(prev => {
        return prev.map(cat => {
            if (cat.id === categoryId) {
                return { ...cat, articles: cat.articles.filter(a => a.id !== articleId) };
            }
            return cat;
        });
    });
  };

  // Global Key Listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle Editor Entrance (Ctrl+E or Cmd+E)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        if (isAuthenticated) {
            setIsEditorOpen(true);
        } else {
            setIsPasswordModalOpen(true);
        }
      }

      // Close things with Escape
      if (event.key === 'Escape') {
        if (isPasswordModalOpen) setIsPasswordModalOpen(false);
        else if (isEditorOpen) setIsEditorOpen(false);
        else if (isChatOpen) setIsChatOpen(false);
        else if (animationPhase === 'READING') handleBackToHome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, animationPhase, isPasswordModalOpen, isEditorOpen, isAuthenticated]);

  return (
    <div className="relative h-screen w-screen overflow-hidden text-[#f5f5f5] font-display selection:bg-orange-500/30">
      
      {/* Texture Warm-up: Render heavy CSS textures invisibly to force browser cache/decode */}
      <div className="fixed w-0 h-0 overflow-hidden pointer-events-none opacity-0">
          <div className="texture-parchment"></div>
          <div className="texture-foxing"></div>
          <div className="texture-damage"></div>
          <div className="texture-cloth"></div>
          <div className="texture-noise"></div>
          <div className="texture-grunge"></div>
      </div>

      {/* Wall Background */}
      <div className="fixed inset-0 z-0 bg-[#0f0f0f] bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-100"></div>
      
      {/* Dynamic Ambient Light */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[80vh] bg-gradient-radial from-[#5d4037]/20 to-transparent blur-3xl pointer-events-none z-0"></div>

      {/* --- HEADER --- */}
      {/* ADDED pointer-events-none to fix mobile back button click issue */}
      <header className={`absolute top-0 w-full p-8 flex justify-center z-40 transition-opacity duration-1000 ${animationPhase === 'IDLE' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h1 className="text-white/30 tracking-[0.5em] text-xs font-sans uppercase">Shironeko's Archive</h1>
      </header>

      {/* --- FOOTER --- */}
      <div className={`absolute bottom-6 w-full flex justify-center z-40 transition-opacity duration-1000 ${animationPhase === 'IDLE' ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
        <span className="text-white/20 tracking-[0.2em] text-[10px] font-sans font-bold uppercase">@ SHIRONEKO • 2026</span>
      </div>

      {/* --- MAIN STAGE --- */}
      <main className="relative z-10 w-full h-full flex items-center justify-center perspective-2000">
          
          {/* SHELF VIEW */}
          {/* Mobile/Tablet: align-start + padding to ensure visibility and scrolling if needed. Desktop (lg): center */}
          <div className={`absolute inset-0 flex flex-col lg:items-center lg:justify-center overflow-y-auto lg:overflow-visible transition-all duration-700 ease-in-out ${animationPhase !== 'IDLE' ? 'opacity-0 pointer-events-none scale-125 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
             
             {/* Spacer for mobile/tablet header. Increased height for md (tablet portrait) to push books down. */}
             <div className="w-full h-24 md:h-48 flex-shrink-0 lg:hidden"></div>

             {/* Books Grid/Shelf Container */}
             <div className="relative w-full max-w-6xl px-8 grid grid-cols-2 place-items-center lg:flex lg:justify-center lg:items-end gap-x-6 gap-y-12 md:gap-x-12 md:gap-y-20 lg:gap-8 xl:gap-12 pb-[100px] lg:pb-[30px] z-20 mx-auto">
                {mergedCategories.map((cat, index) => (
                    <div 
                        key={cat.id}
                        className={`transition-all duration-500 ease-out transform ${selectedCategory?.id === cat.id && animationPhase !== 'IDLE' ? 'opacity-0' : 'opacity-100'} flex flex-col items-center w-full`} 
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <BookCover 
                            category={cat} 
                            onClick={handleCategorySelect} 
                        />
                        
                        {/* Mobile/Tablet Individual Shelf Visual - Sits under each book in the grid */}
                        {/* Adjusted width to 110% to prevent grid overflow on small screens */}
                        <div className="lg:hidden w-[110%] h-6 mt-[-10px] bg-[#2d1b12] shadow-lg border-t border-[#4e342e] relative -z-10 rounded-sm">
                            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-50 mix-blend-overlay"></div>
                        </div>
                    </div>
                ))}
             </div>

             {/* Desktop Shelf Plank (Hidden on Mobile/Tablet) */}
             <div className="hidden lg:block absolute top-[50%] translate-y-[120px] lg:translate-y-[140px] w-full max-w-7xl h-12 bg-[#2d1b12] shadow-2xl z-10 border-t border-[#4e342e]">
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-50 mix-blend-overlay"></div>
                <div className="absolute top-0 w-full h-2 bg-black/20 blur-[2px]"></div>
             </div>
             <div className="hidden lg:block absolute top-[50%] translate-y-[168px] lg:translate-y-[188px] w-[90%] max-w-6xl h-24 bg-black/50 blur-xl rounded-[100%] z-0"></div>
          </div>


          {/* TRANSITION CLONE (Just for the Zoom effect) */}
          {animationPhase === 'ZOOMING' && selectedCategory && (
              <div 
                className="fixed z-50 transition-all duration-500 ease-in-out transform-style-3d animate-fade-in"
                style={{
                    transform: 'scale(1.8) translateY(-5%)', 
                }}
              >
                 <BookCover category={selectedCategory} onClick={() => {}} isStatic={true} />
              </div>
          )}


          {/* READING VIEW (Handles its own opening/closing animations via CSS classes) */}
          {/* We now mount OpenBook during ZOOMING (invisible) to preload the DOM/layout */}
          {/* Update: md:p-0 and md:overflow-hidden to allow full screen book on tablet without scrolling */}
          {(animationPhase === 'ZOOMING' || animationPhase === 'READING' || animationPhase === 'CLOSING') && selectedCategory && (
            <div className="w-full h-full flex items-center justify-center p-0 md:p-0 lg:p-4 overflow-hidden md:overflow-hidden lg:overflow-visible">
              <OpenBook 
                category={selectedCategory}
                activeArticleId={currentArticle?.id} // Pass active ID
                onBack={() => handleBackToHome()}
                onArticleSelect={handleArticleNavigation}
                isClosing={animationPhase === 'CLOSING'} 
                isZooming={animationPhase === 'ZOOMING'}
                onDelete={handleDeleteArticle}
                canManage={isAuthenticated}
              />
            </div>
          )}

      </main>

      {/* AI Muse Trigger */}
      <div className={`fixed bottom-8 right-8 z-50 transition-opacity duration-500 ${animationPhase === 'READING' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="group flex items-center justify-center w-12 h-12 bg-[#3e2723] text-[#d7ccc8] rounded-full shadow-lg border border-[#5d4037] hover:bg-[#4e342e] transition-all hover:scale-105 hover:text-white"
            title="Search Archive"
          >
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">search</span>
          </button>
        ) : (
          <AIChat 
            article={currentArticle} 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
          />
        )}
      </div>

      {/* EDITOR MODALS */}
      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
            setIsAuthenticated(true);
            setIsEditorOpen(true);
        }}
      />
      
      <Editor 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        categories={mergedCategories}
        onSave={handleSaveArticle}
        onDelete={handleDeleteArticle}
      />

    </div>
  );
};

export default App;