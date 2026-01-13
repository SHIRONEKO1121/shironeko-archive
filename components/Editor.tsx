import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Category, Article } from '../types';
import Markdown from 'react-markdown';
import PasswordModal from './PasswordModal';
import { publishArticle, unpublishArticle, updatePublishedArticle, isArticlePublished } from '../services/articleService';
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';

interface EditorProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (categoryId: string, article: Article) => void;
  onDelete: (categoryId: string, articleId: string) => void;
}

type ViewMode = 'edit' | 'split' | 'preview';
type FontSizeOption = 'small' | 'medium' | 'large';

// --- Markdown Tag Helpers ---
interface ImageConfig {
    caption: string;
    layout: 'left' | 'right' | 'center' | 'full';
    width: string;
    height: string;
    refId: string;
}

const parseAlt = (alt: string): Omit<ImageConfig, 'refId'> => {
    const parts = alt.split('|');
    return {
        caption: parts[0] || '',
        layout: (parts[1] as any) || 'center',
        width: parts[2] || 'auto',
        height: parts[3] || 'auto'
    };
};

const buildTag = (config: ImageConfig) => {
    return `![${config.caption}|${config.layout}|${config.width}|${config.height}][${config.refId}]`;
};

// --- Interactive Image Component ---
const InteractiveImage = React.memo(({ src, alt, node, onUpdateConfig }: any) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSelected, setIsSelected] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    
    const rawAlt = alt as string;
    const config = parseAlt(rawAlt);
    
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsSelected(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, []);

    let containerClass = "relative group inline-block align-bottom transition-all duration-200 ";
    if (config.layout === 'left') containerClass += "float-left mr-6 mb-4 clear-right";
    else if (config.layout === 'right') containerClass += "float-right ml-6 mb-4 clear-left";
    else if (config.layout === 'center') containerClass += "block mx-auto mb-6 text-center";
    else if (config.layout === 'full') containerClass += "block w-full mb-6";

    const imgStyle: React.CSSProperties = {
        width: config.width !== 'auto' ? config.width : undefined,
        height: config.height !== 'auto' ? config.height : undefined,
        maxWidth: '100%',
        minWidth: '50px',
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = imgRef.current?.getBoundingClientRect().width || 100;
        const startHeight = imgRef.current?.getBoundingClientRect().height || 100;

        const onMouseMove = (ev: MouseEvent) => {
            if (imgRef.current) {
                let deltaX = ev.clientX - startX;
                if (config.layout === 'right') deltaX = -deltaX;
                const deltaY = ev.clientY - startY;
                const newW = Math.max(50, startWidth + deltaX);
                const newH = Math.max(50, startHeight + deltaY);
                imgRef.current.style.width = `${newW}px`;
                imgRef.current.style.height = `${newH}px`;
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            setIsResizing(false);
            if (imgRef.current) {
                onUpdateConfig(src, { width: imgRef.current.style.width, height: imgRef.current.style.height });
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <span ref={containerRef} className={containerClass} onClick={() => setIsSelected(true)}>
             {isSelected && !isResizing && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#2d1b12] border border-[#5d4037] flex gap-1 p-1 rounded shadow-xl z-50 animate-fade-in whitespace-nowrap">
                    <button onClick={(e) => { e.stopPropagation(); onUpdateConfig(src, { layout: 'left' }); }} className={`p-1.5 rounded hover:bg-[#3e2723] ${config.layout === 'left' ? 'text-white bg-[#3e2723]' : 'text-[#a1887f]'}`} title="Wrap Left"><span className="material-symbols-outlined text-xs">format_align_left</span></button>
                    <button onClick={(e) => { e.stopPropagation(); onUpdateConfig(src, { layout: 'center' }); }} className={`p-1.5 rounded hover:bg-[#3e2723] ${config.layout === 'center' ? 'text-white bg-[#3e2723]' : 'text-[#a1887f]'}`} title="Center Block"><span className="material-symbols-outlined text-xs">format_align_center</span></button>
                    <button onClick={(e) => { e.stopPropagation(); onUpdateConfig(src, { layout: 'right' }); }} className={`p-1.5 rounded hover:bg-[#3e2723] ${config.layout === 'right' ? 'text-white bg-[#3e2723]' : 'text-[#a1887f]'}`} title="Wrap Right"><span className="material-symbols-outlined text-xs">format_align_right</span></button>
                    <button onClick={(e) => { e.stopPropagation(); onUpdateConfig(src, { layout: 'full' }); }} className={`p-1.5 rounded hover:bg-[#3e2723] ${config.layout === 'full' ? 'text-white bg-[#3e2723]' : 'text-[#a1887f]'}`} title="Full Width"><span className="material-symbols-outlined text-xs">width_full</span></button>
                </div>
            )}
            <span className={`relative block bg-[#f0ebd8] p-1.5 border border-[#a1887f] shadow-sm ${isSelected ? 'ring-2 ring-[#5d4037] ring-offset-2' : ''}`}>
                <img ref={imgRef} src={src} alt={config.caption} style={imgStyle} className="block sepia-[.3] contrast-[1.05]" />
                {isSelected && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#5d4037] cursor-se-resize z-20 flex items-center justify-center hover:scale-125 transition-transform" onMouseDown={handleMouseDown}>
                         <svg viewBox="0 0 10 10" className="w-2 h-2 fill-white"><path d="M10 10 L0 10 L10 0 Z" /></svg>
                    </div>
                )}
            </span>
            {isSelected ? (
                <input type="text" value={config.caption} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdateConfig(src, { caption: e.target.value })} placeholder="Add a description..." className="block w-full mt-2 text-center bg-transparent border-b border-[#5d4037]/30 text-[#5d4037] text-xs font-serif italic focus:outline-none focus:border-[#5d4037]" />
            ) : config.caption && (
                <span className="block mt-2 text-center text-[#5d4037] text-xs font-serif italic opacity-80">{config.caption}</span>
            )}
        </span>
    );
});


const Editor: React.FC<EditorProps> = ({ isOpen, onClose, categories, onSave, onDelete }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  
  // Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); 
  const [definitions, setDefinitions] = useState(''); // Stores [id]: base64
  
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<{id: string, url: string}[]>([]); 
  
  const [location, setLocation] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  
  // Upload State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Firebase Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishedToFirebase, setIsPublishedToFirebase] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Preview State
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [previewFontSize, setPreviewFontSize] = useState<FontSizeOption>('medium');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [notification, setNotification] = useState<{title: string, subtitle: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const separateContent = (fullText: string) => {
      const defRegex = /^\[([^\]]+)\]:\s*(data:image\/.*)$/gm;
      const matches = [];
      let match;
      while ((match = defRegex.exec(fullText)) !== null) {
          matches.push(match[0]);
      }
      const body = fullText.replace(defRegex, '').trim();
      const defs = matches.join('\n');
      return { body, defs };
  };

  const extractGalleryFromDefs = (defs: string) => {
      const regex = /^\[([^\]]+)\]:\s*(data:image\/.*)$/gm;
      let match;
      const images = [];
      while ((match = regex.exec(defs)) !== null) {
          images.push({ id: match[1], url: match[2] });
      }
      return images;
  };

  const clearForm = () => {
      setTitle('');
      setContent('');
      setDefinitions('');
      setGalleryImages([]);
      setCoverImage(null);
      setLocation('');
      setMusicUrl('');
  };

  useEffect(() => {
    const category = categories.find(c => c.id === selectedCategoryId);
    const articleExists = category?.articles.find(a => a.id === selectedArticleId);
    if (selectedArticleId && !articleExists) {
         setSelectedArticleId('');
         clearForm();
    }
  }, [selectedCategoryId, categories]); 

  useEffect(() => {
    if (!selectedArticleId) return;

    const category = categories.find(c => c.id === selectedCategoryId);
    const article = category?.articles.find(a => a.id === selectedArticleId);

    if (article) {
        setTitle(article.title);
        const { body, defs } = separateContent(article.content || '');
        setContent(body);
        setDefinitions(defs);
        setGalleryImages(extractGalleryFromDefs(defs));
        setCoverImage(article.imageUrl || null);
        setLocation(article.location || '');
        setMusicUrl(article.musicUrl || '');
        
        // Check if article is published to Firebase
        isArticlePublished(selectedArticleId).then(setIsPublishedToFirebase).catch(() => setIsPublishedToFirebase(false));
    }
  }, [selectedArticleId, selectedCategoryId, categories]);

  // Handle Audio Playback in Preview
  useEffect(() => {
      const handlePreviewAudio = async () => {
          if (!previewAudioRef.current) {
              previewAudioRef.current = new Audio();
              previewAudioRef.current.loop = true;
              previewAudioRef.current.volume = 0.4;
          }

          const audio = previewAudioRef.current;
          
          if ((viewMode === 'preview' || viewMode === 'split') && musicUrl) {
              // Only update src if it changed to prevent stutter
              if (audio.src !== musicUrl) {
                   audio.src = musicUrl;
              }
              
              if (isPreviewPlaying) {
                   try {
                       await audio.play();
                   } catch (e) {
                       setIsPreviewPlaying(false);
                   }
              } else {
                  audio.pause();
              }
          } else {
              // Pause if leaving preview or no music
              audio.pause();
              setIsPreviewPlaying(false);
          }
      };

      handlePreviewAudio();
      
      // Cleanup on unmount or when musicUrl/viewMode changes
      return () => {
          if ((viewMode !== 'preview' && viewMode !== 'split') && previewAudioRef.current) {
               previewAudioRef.current.pause();
          }
      };
  }, [musicUrl, viewMode, isPreviewPlaying]);

  const togglePreviewMusic = () => {
      setIsPreviewPlaying(!isPreviewPlaying);
  };

  const handleEntryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newVal = e.target.value;
      setSelectedArticleId(newVal);
      if (!newVal) {
          clearForm();
      }
  };

  const executeSave = (isDraft: boolean) => {
    if (!title || !content || !selectedCategoryId) return;

    const id = selectedArticleId || Date.now().toString();
    const combinedContent = (content.trim() + '\n\n' + definitions.trim()).trim();
    const allImages = galleryImages.map(g => g.url);

    const newArticle: Article = {
      id,
      title,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
      readTime: `${Math.ceil(combinedContent.split(' ').length / 200)} min read`,
      preview: combinedContent.substring(0, 100) + '...',
      content: combinedContent,
      imageUrl: coverImage || undefined,
      images: allImages,
      location: location || undefined,
      musicUrl: musicUrl || undefined,
      isDraft
    };

    onSave(selectedCategoryId, newArticle);
    
    if (!selectedArticleId) {
        setSelectedArticleId(id);
    }
    
    setNotification({
        title: isDraft ? 'Draft Saved' : 'Published Successfully',
        subtitle: isDraft ? 'Your thoughts are safe.' : 'Your entry is now in the archive.'
    });

    setTimeout(() => {
        setNotification(null);
    }, 3000);
  };

  const handleSaveRequest = (isDraft: boolean) => {
      if (!title || !content) return;
      if (isDraft) {
          executeSave(true);
      } else {
          setIsPublishConfirmOpen(true);
      }
  };

  const confirmPublish = () => {
      executeSave(false);
      setIsPublishConfirmOpen(false);
  };
  
  const handlePublishToFirebase = async () => {
      if (!selectedArticleId || !title || !content) {
          setPublishError('Please save your article first');
          return;
      }
      
      setIsPublishing(true);
      setPublishError(null);
      
      try {
          // Ensure user is authenticated
          if (!auth.currentUser) {
              await signInAnonymously(auth);
          }
          
          const category = categories.find(c => c.id === selectedCategoryId);
          const article = category?.articles.find(a => a.id === selectedArticleId);
          
          if (article) {
              if (isPublishedToFirebase) {
                  // Update existing published article
                  await updatePublishedArticle(selectedArticleId, article);
                  setNotification({
                      title: 'Updated Online',
                      subtitle: 'Your changes are now live.'
                  });
              } else {
                  // Publish new article
                  await publishArticle(article, selectedCategoryId);
                  setIsPublishedToFirebase(true);
                  setNotification({
                      title: 'Published Online',
                      subtitle: 'Everyone can now view your post.'
                  });
              }
          }
      } catch (error: any) {
          setPublishError(error.message || 'Failed to publish');
          console.error('Publish error:', error);
      } finally {
          setIsPublishing(false);
          setTimeout(() => setNotification(null), 3000);
      }
  };
  
  const handleUnpublishFromFirebase = async () => {
      if (!selectedArticleId) return;
      
      setIsPublishing(true);
      setPublishError(null);
      
      try {
          // Ensure user is authenticated
          if (!auth.currentUser) {
              await signInAnonymously(auth);
          }
          
          await unpublishArticle(selectedArticleId);
          setIsPublishedToFirebase(false);
          setNotification({
              title: 'Unpublished',
              subtitle: 'Post removed from online archive.'
          });
      } catch (error: any) {
          setPublishError(error.message || 'Failed to unpublish');
          console.error('Unpublish error:', error);
      } finally {
          setIsPublishing(false);
          setTimeout(() => setNotification(null), 3000);
      }
  };

  useEffect(() => { if (viewMode === 'split') setIsSidebarOpen(false); else if (viewMode === 'edit') setIsSidebarOpen(true); }, [viewMode]);
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (selectedArticleId) {
        setIsDeleteModalOpen(true);
    }
  };
  
  const handleConfirmDelete = () => {
     if (selectedArticleId) {
         onDelete(selectedCategoryId, selectedArticleId);
         setSelectedArticleId('');
         clearForm();
     }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = () => setCoverImage(reader.result as string);
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const files = Array.from(e.target.files);
          Promise.all(files.map(file => {
              return new Promise<{id: string, url: string}>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                      const id = `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                      resolve({ id, url: reader.result as string });
                  };
                  reader.readAsDataURL(file as Blob);
              });
          })).then(newImages => {
              setGalleryImages(prev => [...prev, ...newImages]);
              const newDefs = newImages.map(img => `[${img.id}]: ${img.url}`).join('\n');
              setDefinitions(prev => prev ? prev + '\n' + newDefs : newDefs);
          });
      }
  };
  
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadError(null);
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Simple size check (approx 5MB limit for safety with localStorage)
          if (file.size > 5 * 1024 * 1024) {
               setUploadError("File too large (>5MB). Please use a URL or compress.");
               return;
          }
          
          setIsUploading(true);
          setUploadProgress(0);

          const reader = new FileReader();
          
          reader.onprogress = (data) => {
              if (data.lengthComputable) {
                  const progress = Math.round((data.loaded / data.total) * 100);
                  setUploadProgress(progress);
              }
          };

          reader.onload = () => {
              setMusicUrl(reader.result as string);
              setIsUploading(false);
              setUploadProgress(100);
          };
          
          reader.onerror = () => {
              setUploadError("Failed to upload audio file.");
              setIsUploading(false);
          }

          reader.readAsDataURL(file);
      }
  };
  
  const handleRemoveMusic = () => {
      setMusicUrl('');
      setIsPreviewPlaying(false);
      setUploadError(null);
  };

  const insertImageAtCursor = (img: {id: string, url: string}) => {
      const tag = `![Enter Description|center|auto|auto][${img.id}]`;
      if (textAreaRef.current) {
          const start = textAreaRef.current.selectionStart;
          const end = textAreaRef.current.selectionEnd;
          const text = content;
          let newText = text.substring(0, start) + '\n' + tag + '\n' + text.substring(end);
          setContent(newText);
          setTimeout(() => { textAreaRef.current?.focus(); }, 0);
      } else {
          setContent(prev => prev + '\n' + tag);
      }
      if (!definitions.includes(`[${img.id}]:`)) {
          setDefinitions(prev => prev + `\n[${img.id}]: ${img.url}`);
      }
  };

  const handleConfigUpdate = useCallback((src: string, updates: Partial<ImageConfig>) => {
      const findIdByUrl = (url: string) => galleryImages.find(g => g.url === url)?.id;
      const refId = findIdByUrl(src);
      if (!refId) return;

      const regex = new RegExp(`!\\[(.*?)\\]\\[${refId}\\]`);
      setContent(prevContent => {
          const match = prevContent.match(regex);
          if (match) {
              const currentAlt = match[1];
              const currentConfig = parseAlt(currentAlt);
              const newConfig = {
                  caption: updates.caption !== undefined ? updates.caption : currentConfig.caption,
                  layout: updates.layout !== undefined ? updates.layout : currentConfig.layout,
                  width: updates.width !== undefined ? updates.width : currentConfig.width,
                  height: updates.height !== undefined ? updates.height : currentConfig.height,
                  refId: refId
              };
              const newTag = buildTag(newConfig);
              return prevContent.replace(regex, newTag);
          }
          return prevContent;
      });
  }, [galleryImages]); 

  const removeGalleryImage = (id: string) => {
      setGalleryImages(prev => prev.filter(i => i.id !== id));
      const defRegex = new RegExp(`^\\[${id}\\]:.*$`, 'gm');
      setDefinitions(prev => prev.replace(defRegex, '').trim());
  };

  const currentCategory = categories.find(c => c.id === selectedCategoryId);
  
  // Font size calculation for preview
  const getPixelSize = (size: FontSizeOption) => {
    switch(size) {
        case 'small': return 16;
        case 'large': return 21;
        default: return 18;
    }
  };
  const currentPixelSize = getPixelSize(previewFontSize);

  const markdownComponents = useMemo(() => ({
    p: ({node, children}: any) => {
        const isFirst = node?.position?.start.line === 1 || (typeof children?.[0] === 'string' && (children[0] as string).startsWith('The '));
        const style = { fontSize: `${currentPixelSize}px`, lineHeight: '1.7', textShadow: '0px 0px 1px rgba(62, 39, 35, 0.1)' };
        if (isFirst) {
            return (<p className="mb-4 text-justify first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:text-[#1a120b] first-letter:mr-1 first-letter:drop-shadow-sm" style={style}>{children}</p>)
        }
        return <p className="mb-4 text-justify indent-8" style={style}>{children}</p>
    },
    img: ({node, src, alt}: any) => {
         // Use InteractiveImage for Edit mode, standard display for Preview
         if (viewMode === 'edit') {
             return <InteractiveImage src={src} alt={alt} node={node} onUpdateConfig={handleConfigUpdate} />;
         } else {
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
                 <span className={`${alignClass} ${sizeClass} z-10 relative`} style={widthStyle}>
                     <img src={src} alt={altText} className="block w-full h-auto sepia-[.2]" />
                     {altText && <span className="block mt-1 text-center font-serif italic text-xs text-[#5d4037] opacity-80">{altText}</span>}
                 </span>
             );
         }
    }
  }), [handleConfigUpdate, viewMode, currentPixelSize]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[50] bg-[#1a120b] flex flex-col animate-fade-in font-sans">
        <div className="h-16 bg-[#2d1b12] border-b border-[#3e2723] flex items-center justify-between px-6 shadow-md z-50 relative">
            <div className="flex items-center gap-4">
                {viewMode === 'edit' && (
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[#d7ccc8] hover:text-white transition-colors">
                        <span className="material-symbols-outlined">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#d7ccc8]">edit_note</span>
                    <span className="font-display text-[#d7ccc8] tracking-widest text-sm uppercase hidden sm:inline">The Scribe's Desk</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex bg-[#1e1e1e] rounded p-0.5 border border-[#3e2723]">
                    <button onClick={() => { setViewMode('edit'); setIsSidebarOpen(true); }} className={`px-3 py-1 text-xs uppercase tracking-wider font-bold transition-all rounded ${viewMode === 'edit' ? 'bg-[#5d4037] text-white' : 'text-[#a1887f] hover:text-[#d7ccc8]'}`}>Edit</button>
                    <button onClick={() => setViewMode('split')} className={`hidden md:block px-3 py-1 text-xs uppercase tracking-wider font-bold transition-all rounded ${viewMode === 'split' ? 'bg-[#5d4037] text-white' : 'text-[#a1887f] hover:text-[#d7ccc8]'}`}>Split</button>
                    <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-xs uppercase tracking-wider font-bold transition-all rounded ${viewMode === 'preview' ? 'bg-[#5d4037] text-white' : 'text-[#a1887f] hover:text-[#d7ccc8]'}`}>Preview</button>
                </div>
                <div className="h-4 w-[1px] bg-[#5d4037]"></div>
                <button onClick={onClose} className="text-[#a1887f] hover:text-[#d7ccc8] font-serif italic text-sm transition-colors">Close</button>
                
                {selectedArticleId && (
                    <button type="button" onClick={handleDeleteClick} className="font-serif italic text-sm text-[#ef5350] hover:text-[#ffcdd2] transition-colors">Delete</button>
                )}
                
                <div className="flex items-center gap-2">
                    <button onClick={() => handleSaveRequest(true)} disabled={!title || !content} className="text-[#a1887f] hover:text-[#d7ccc8] font-serif italic text-xs uppercase mr-2 transition-colors disabled:opacity-50">Save Draft</button>
                    <button onClick={() => handleSaveRequest(false)} disabled={!title || !content} className="bg-[#d7ccc8] text-[#3e2723] px-6 py-2 font-display text-xs tracking-widest font-bold uppercase hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all">Publish</button>
                    
                    {/* Firebase Publish/Unpublish Buttons */}
                    {selectedArticleId && (
                        <div className="ml-4 flex items-center gap-2 border-l border-[#5d4037] pl-4">
                            {isPublishedToFirebase ? (
                                <>
                                    <span className="text-[10px] text-green-600 uppercase tracking-wider font-display">● Online</span>
                                    <button 
                                        onClick={handlePublishToFirebase} 
                                        disabled={isPublishing}
                                        className="bg-[#8d6e63] text-white px-4 py-2 font-display text-xs tracking-widest uppercase hover:bg-[#a1887f] disabled:opacity-50 shadow-md transition-all"
                                    >
                                        {isPublishing ? 'Updating...' : 'Update Online'}
                                    </button>
                                    <button 
                                        onClick={handleUnpublishFromFirebase} 
                                        disabled={isPublishing}
                                        className="text-[#ef5350] hover:text-[#ffcdd2] font-display text-xs uppercase transition-colors disabled:opacity-50"
                                    >
                                        Unpublish
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={handlePublishToFirebase} 
                                    disabled={isPublishing || !title || !content}
                                    className="bg-[#4caf50] text-white px-4 py-2 font-display text-xs tracking-widest uppercase hover:bg-[#66bb6a] disabled:opacity-50 shadow-md transition-all"
                                >
                                    {isPublishing ? 'Publishing...' : 'Publish Online'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {publishError && (
                    <p className="text-[#ef5350] text-xs italic mt-1">{publishError}</p>
                )}
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] relative">
            <div className="absolute inset-0 bg-[#0f0f0f]/40 backdrop-blur-[2px]"></div>
            <div className={`w-full md:w-80 lg:w-96 bg-[#1e1e1e]/95 border-r border-[#3e2723] flex flex-col z-20 transition-all duration-300 backdrop-blur-md ${viewMode !== 'edit' || !isSidebarOpen ? 'hidden' : ''}`}>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <div className="space-y-4">
                        <h3 className="text-[#8d6e63] text-xs font-display tracking-widest uppercase border-b border-[#3e2723] pb-2">Manifest</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[#a1887f] text-[10px] uppercase mb-1 block">Collection</label>
                                <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="w-full bg-[#1a120b] border border-[#4e342e] text-[#d7ccc8] p-2 font-serif focus:outline-none focus:border-[#8d6e63] text-sm rounded">
                                    {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.title}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[#a1887f] text-[10px] uppercase mb-1 block">Entry Selection</label>
                                <div className="flex gap-2">
                                    <select value={selectedArticleId} onChange={handleEntryChange} className="flex-1 bg-[#1a120b] border border-[#4e342e] text-[#d7ccc8] p-2 font-serif focus:outline-none focus:border-[#8d6e63] text-sm rounded">
                                        <option value="">-- New Entry --</option>
                                        {currentCategory?.articles.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.title || 'Untitled'} {a.isDraft ? '(Draft)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={() => { setSelectedArticleId(''); clearForm(); }}
                                        className="bg-[#3e2723] text-[#d7ccc8] px-3 rounded border border-[#5d4037] hover:bg-[#4e342e] hover:text-white transition-colors"
                                        title="Create New Entry"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[#a1887f] text-[10px] uppercase mb-1 block">Entry Title</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title..." className="w-full bg-[#1a120b] border border-[#4e342e] text-[#d7ccc8] p-2 font-serif focus:outline-none focus:border-[#8d6e63] text-sm rounded" />
                            </div>
                            <div>
                                <label className="text-[#a1887f] text-[10px] uppercase mb-1 block">Location</label>
                                <div className="flex items-center bg-[#1a120b] border border-[#4e342e] rounded">
                                    <span className="material-symbols-outlined text-[#5d4037] pl-2 text-sm">pin_drop</span>
                                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-transparent text-[#d7ccc8] p-2 font-serif text-sm focus:outline-none" />
                                </div>
                            </div>
                            
                            {/* Improved Music Section */}
                            <div>
                                <label className="text-[#a1887f] text-[10px] uppercase mb-1 block">Background Music</label>
                                
                                {isUploading ? (
                                    <div className="w-full bg-[#1a120b] border border-[#4e342e] rounded p-2">
                                        <div className="flex justify-between text-[10px] text-[#a1887f] mb-1">
                                            <span>Uploading...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full h-1 bg-[#2d1b12] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#8d6e63] transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                ) : musicUrl ? (
                                    <div className="flex items-center justify-between bg-[#2d1b12] border border-[#4e342e] rounded p-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="material-symbols-outlined text-[#8d6e63] text-sm">music_note</span>
                                            <span className="text-[#d7ccc8] text-xs font-serif italic truncate max-w-[140px]">
                                                {musicUrl.startsWith('data:') ? 'Audio File Uploaded' : musicUrl}
                                            </span>
                                        </div>
                                        <button onClick={handleRemoveMusic} className="text-[#e57373] hover:text-[#ffcdd2] p-1 rounded hover:bg-[#3e2723]" title="Remove Audio">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 flex items-center bg-[#1a120b] border border-[#4e342e] rounded">
                                                <span className="material-symbols-outlined text-[#5d4037] pl-2 text-sm">link</span>
                                                <input type="text" value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} className="w-full bg-transparent text-[#d7ccc8] p-2 font-serif text-sm focus:outline-none" placeholder="https://..." />
                                            </div>
                                            <input type="file" ref={audioInputRef} onChange={handleAudioUpload} className="hidden" accept="audio/*" />
                                            <button 
                                                onClick={() => audioInputRef.current?.click()} 
                                                className="bg-[#3e2723] text-[#d7ccc8] px-3 py-2 rounded border border-[#5d4037] hover:bg-[#4e342e] hover:text-white transition-colors"
                                                title="Upload Audio File"
                                            >
                                                <span className="material-symbols-outlined text-sm">upload_file</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {uploadError && (
                                    <p className="text-[#ef5350] text-[10px] italic mt-1 animate-pulse">{uploadError}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                         <h3 className="text-[#8d6e63] text-xs font-display tracking-widest uppercase border-b border-[#3e2723] pb-2 flex justify-between">
                            <span>Cover Image</span>
                            {coverImage && <button onClick={() => setCoverImage(null)} className="text-[#e57373] text-[10px] hover:underline">Remove</button>}
                         </h3>
                         <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
                         {coverImage ? (
                             <div className="relative w-full aspect-video rounded overflow-hidden border border-[#5d4037] group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                                 <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <span className="text-white text-xs uppercase tracking-wider">Change Cover</span>
                                 </div>
                             </div>
                         ) : (
                             <button onClick={() => coverInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-[#3e2723] rounded flex flex-col items-center justify-center gap-2 hover:bg-[#2d1b12] hover:border-[#5d4037] transition-all group">
                                 <span className="material-symbols-outlined text-[#5d4037] group-hover:text-[#a1887f]">add_photo_alternate</span>
                                 <span className="text-[#5d4037] text-xs uppercase tracking-wider group-hover:text-[#a1887f]">Set Cover</span>
                             </button>
                         )}
                    </div>
                    <div className="space-y-2 flex-1 flex flex-col">
                        <h3 className="text-[#8d6e63] text-xs font-display tracking-widest uppercase border-b border-[#3e2723] pb-2">Asset Gallery</h3>
                        <p className="text-[#5d4037] text-[10px] italic">Click image to insert into text at cursor.</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                             <input type="file" ref={fileInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" multiple />
                             <button onClick={() => fileInputRef.current?.click()} className="aspect-square border border-dashed border-[#3e2723] rounded flex flex-col items-center justify-center hover:bg-[#2d1b12] transition-colors">
                                 <span className="material-symbols-outlined text-[#5d4037]">add</span>
                             </button>
                             {galleryImages.map((img) => (
                                 <div key={img.id} className="relative aspect-square rounded overflow-hidden border border-[#3e2723] group bg-[#1a120b]">
                                     <img src={img.url} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity cursor-copy" onClick={() => insertImageAtCursor(img)} title="Click to Insert" />
                                     <button onClick={() => removeGalleryImage(img.id)} className="absolute top-0 right-0 p-1 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900"><span className="material-symbols-outlined text-[10px]">close</span></button>
                                     <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-[#a1887f] px-1 truncate pointer-events-none">{img.id}</div>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative z-10">
                {(viewMode === 'edit' || viewMode === 'split') && (
                     <div className={`h-full flex flex-col p-4 md:p-8 justify-center transition-all duration-300 ${viewMode === 'split' ? 'w-1/2 border-r border-[#3e2723]/50 pr-0' : 'w-full'}`}>
                        <div className="w-full max-w-3xl h-full bg-[#d6c8a5] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative texture-parchment animate-fade-in flex flex-col mx-auto rounded-sm">
                            <div className="absolute inset-0 texture-foxing opacity-30 pointer-events-none"></div>
                            <div className="relative z-10 flex gap-2 p-2 border-b border-[#3e2723]/20 bg-[#d6c8a5]/80 backdrop-blur-sm">
                                <button onClick={() => { if(textAreaRef.current) textAreaRef.current.setRangeText('**Bold**', textAreaRef.current.selectionStart, textAreaRef.current.selectionEnd, 'select'); }} className="p-1.5 hover:bg-[#3e2723]/10 rounded text-[#3e2723] font-bold font-serif text-sm w-8">B</button>
                                <button onClick={() => { if(textAreaRef.current) textAreaRef.current.setRangeText('*Italic*', textAreaRef.current.selectionStart, textAreaRef.current.selectionEnd, 'select'); }} className="p-1.5 hover:bg-[#3e2723]/10 rounded text-[#3e2723] italic font-serif text-sm w-8">I</button>
                                <div className="w-[1px] h-6 bg-[#3e2723]/20 my-auto"></div>
                                <button onClick={() => { if(textAreaRef.current) textAreaRef.current.setRangeText('### ', textAreaRef.current.selectionStart, textAreaRef.current.selectionEnd, 'end'); }} className="p-1.5 hover:bg-[#3e2723]/10 rounded text-[#3e2723] font-display font-bold text-xs">H3</button>
                                <button onClick={() => { if(textAreaRef.current) textAreaRef.current.setRangeText('## ', textAreaRef.current.selectionStart, textAreaRef.current.selectionEnd, 'end'); }} className="p-1.5 hover:bg-[#3e2723]/10 rounded text-[#3e2723] font-display font-bold text-sm">H2</button>
                                <div className="w-[1px] h-6 bg-[#3e2723]/20 my-auto"></div>
                                <button onClick={() => { if(textAreaRef.current) textAreaRef.current.setRangeText('> ', textAreaRef.current.selectionStart, textAreaRef.current.selectionEnd, 'end'); }} className="p-1.5 hover:bg-[#3e2723]/10 rounded text-[#3e2723] font-serif"><span className="material-symbols-outlined text-sm">format_quote</span></button>
                            </div>
                            <div className="flex-1 p-8 md:p-12 relative">
                                <textarea ref={textAreaRef} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Begin your writing here..." className="w-full h-full bg-transparent resize-none focus:outline-none font-serif text-[#2a1b12] text-lg leading-relaxed placeholder-[#5d4037]/40 relative z-10 custom-scrollbar selection:bg-[#5d4037]/20" spellCheck={true} />
                            </div>
                        </div>
                    </div>
                )}
                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className={`h-full flex flex-col p-4 md:p-8 justify-center transition-all duration-300 animate-fade-in ${viewMode === 'split' ? 'w-1/2 pl-0' : 'w-full'}`}>
                        <div className="w-full max-w-3xl h-full bg-[#d6c8a5] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative texture-parchment overflow-hidden flex flex-col mx-auto rounded-sm">
                            <div className="absolute inset-0 texture-foxing opacity-60 pointer-events-none z-0"></div>
                            <div className="absolute inset-0 texture-damage z-0"></div>
                            <div className="flex-1 p-8 md:p-12 relative z-10 overflow-y-auto custom-scrollbar">
                                
                                {/* Header - Matched to OpenBook.tsx */}
                                <div className="flex justify-between items-center mb-6 border-b border-[#5d4037]/30 pb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#3e2723] uppercase">
                                            {new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}
                                        </span>
                                        {location && (
                                            <>
                                                <span className="text-[#5d4037]/40 text-[10px]">|</span>
                                                <span className="font-serif italic text-[#5d4037] text-sm">{location}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 bg-[#3e2723]/10 rounded-full px-3 py-1 backdrop-blur-sm shadow-inner">
                                        {musicUrl && (
                                            <>
                                                <button onClick={togglePreviewMusic} className={`flex items-center justify-center w-5 h-5 md:w-auto md:h-auto text-sm font-serif ${isPreviewPlaying ? 'text-[#1a120b] font-bold animate-pulse' : 'text-[#5d4037]'}`} title={isPreviewPlaying ? "Pause Music" : "Play Music"}>
                                                    <span className="material-symbols-outlined text-sm">{isPreviewPlaying ? 'music_note' : 'music_off'}</span>
                                                </button>
                                                <span className="text-[#5d4037]/40">|</span>
                                            </>
                                        )}
                                        <button onClick={() => setPreviewFontSize('small')} className={`text-xs font-serif ${previewFontSize === 'small' ? 'text-[#1a120b] font-bold' : 'text-[#5d4037]'}`}>A</button>
                                        <span className="text-[#5d4037]/40">|</span>
                                        <button onClick={() => setPreviewFontSize('medium')} className={`text-sm font-serif ${previewFontSize === 'medium' ? 'text-[#1a120b] font-bold' : 'text-[#5d4037]'}`}>A</button>
                                        <span className="text-[#5d4037]/40">|</span>
                                        <button onClick={() => setPreviewFontSize('large')} className={`text-lg font-serif ${previewFontSize === 'large' ? 'text-[#1a120b] font-bold' : 'text-[#5d4037]'}`}>A</button>
                                    </div>
                                </div>
                                
                                {coverImage && (
                                    <div className="float-right ml-6 mb-6 w-1/2 md:w-1/3 transform rotate-1 z-10 relative">
                                        <div className="bg-[#f0ebd8] p-2 shadow-lg border border-[#8d6e63] texture-parchment">
                                             <div className="border border-[#8d6e63]/50 p-1">
                                                <img src={coverImage} alt="Cover" className="w-full h-auto object-cover sepia-[.3] contrast-110 brightness-95" />
                                             </div>
                                        </div>
                                    </div>
                                )}
                                <h2 className="font-display text-3xl md:text-4xl text-[#1a120b] font-bold mb-6 leading-[1.1] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">{title || "Untitled Entry"}</h2>
                                <div className="prose prose-sm md:prose-base prose-p:font-serif prose-p:text-[#2d1b12] prose-headings:font-display prose-headings:text-[#1a120b] prose-blockquote:border-l-[#3e2723] prose-blockquote:text-[#2d1b12] prose-blockquote:bg-[#3e2723]/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic max-w-none">
                                    <Markdown urlTransform={(uri) => uri} components={markdownComponents}>
                                        {content + '\n\n' + definitions}
                                    </Markdown>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Confirmation Modal */}
        {isPublishConfirmOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPublishConfirmOpen(false)}></div>
                <div className="relative w-full max-w-sm bg-[#d6c8a5] texture-parchment border border-[#8d6e63] shadow-2xl p-8 rounded-sm animate-fade-in">
                    <div className="text-center space-y-4">
                         <h3 className="font-display text-xl font-bold text-[#3e2723] uppercase tracking-widest border-b border-[#3e2723]/20 pb-2">Publish Entry?</h3>
                         <p className="font-serif text-[#5d4037] italic">
                             This entry will be inscribed into the public archives. <br/> Are you sure you wish to proceed?
                         </p>
                         <div className="flex justify-center gap-4 pt-2">
                             <button onClick={() => setIsPublishConfirmOpen(false)} className="px-4 py-2 font-display text-xs uppercase tracking-widest text-[#5d4037] hover:bg-[#3e2723]/10 transition-colors">Cancel</button>
                             <button onClick={confirmPublish} className="px-6 py-2 bg-[#3e2723] text-[#f5f5f5] font-display text-xs uppercase tracking-widest hover:bg-[#2d1b12] shadow-lg transition-colors">Confirm</button>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* Success Notification */}
        {notification && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[70] animate-fade-in">
                <div className="bg-[#3e2723] text-[#d7ccc8] px-6 py-4 rounded shadow-2xl border border-[#5d4037] flex items-center gap-4 min-w-[300px]">
                    <div className="w-10 h-10 rounded-full border border-[#8d6e63] flex items-center justify-center bg-[#2d1b12]">
                        <span className="material-symbols-outlined text-green-700/80">check_circle</span>
                    </div>
                    <div>
                        <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[#efebe9]">{notification.title}</h4>
                        <p className="font-serif italic text-xs text-[#a1887f]">{notification.subtitle}</p>
                    </div>
                </div>
            </div>
        )}

        <PasswordModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onSuccess={handleConfirmDelete} title="CONFIRM DELETION" subtitle="Enter password to permanently delete this entry." />
    </div>
  );
};

export default Editor;