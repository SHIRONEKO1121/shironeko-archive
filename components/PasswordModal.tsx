import React, { useState, useEffect, useRef } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess, title, subtitle }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isShake, setIsShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Updated password check
    if (password === '071213') {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      setPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0f0f0f]/90 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative w-full max-w-md transform transition-all duration-300 ${isShake ? 'translate-x-[-5px]' : 'translate-x-0'}`}>
         
         {/* Paper Sheet */}
         <div className="relative bg-[#d6c8a5] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm border border-[#bcaaa4] texture-parchment overflow-hidden">
            {/* Textures */}
            <div className="absolute inset-0 texture-foxing opacity-50 pointer-events-none"></div>
            
            {/* Wax Seal Decoration */}
            <div className="absolute top-4 right-6 w-12 h-12 rounded-full bg-[#8d2a2a] shadow-inner flex items-center justify-center border-2 border-[#5d1818] opacity-80">
                <span className="material-symbols-outlined text-[#3e0e0e] text-2xl" style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.2))' }}>lock</span>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                
                <div className="space-y-2">
                    <h2 className="font-display text-2xl font-bold text-[#3e2723] tracking-widest uppercase border-b-2 border-[#3e2723] pb-2 inline-block">
                        {title || "SHIRONEKO ONLY"}
                    </h2>
                    <p className="font-serif italic text-[#5d4037]">
                        {subtitle || "\"Forest, wind, and stars.\""}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-6 mt-4">
                    <div className="relative group">
                        <input
                            ref={inputRef}
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            className="w-full bg-transparent border-b-2 border-[#8d6e63] text-center font-serif text-xl text-[#3e2723] placeholder-[#8d6e63]/50 focus:outline-none focus:border-[#3e2723] py-2 transition-colors"
                            placeholder="Enter Passphrase"
                        />
                    </div>
                    
                    {error && (
                        <p className="text-[#8d2a2a] font-serif text-sm animate-pulse">
                            The archives remain closed to you.
                        </p>
                    )}

                    <div className="flex justify-center pt-2">
                        <button 
                            type="submit"
                            className="font-display text-sm tracking-[0.2em] text-[#f5f5f5] bg-[#3e2723] px-8 py-3 hover:bg-[#2d1b12] transition-colors shadow-lg uppercase"
                        >
                            Unlock
                        </button>
                    </div>
                </form>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PasswordModal;