import React, { useState, useRef, useEffect } from 'react';
import { Article } from '../types';

interface AIChatProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const AIChat: React.FC<AIChatProps> = ({ article, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'I am Kuroneko, guardian of the archives. How may I assist?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize or Reset Chat Session when article changes
  useEffect(() => {
     // Initial Message Update
     if (article) {
         setMessages([{ role: 'model', text: `I am reading "${article.title}" with you.\n\nWhat curious details shall we uncover?` }]);
     } else {
         setMessages([{ role: 'model', text: 'I am Kuroneko. The archives are open. Ask, and I shall answer briefly.' }]);
     }
  }, [article])

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;

    setInput('');
    
    // Optimistically update UI
    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not accessible. Please check Vercel settings.");

      // Construct System Prompt
      const systemInstruction = article 
        ? `You are "Kuroneko" (Black Cat), a spirit guardian of this digital archive.
          You help the reader quickly understand the article.
          Article title: "${article.title}".
          Article content: "${article.content}".
           
          Your job: summarize, highlight key takeaways, surface structure, and answer clarifying questions.
          Persona:
          - Intelligent, elegant, concise; occasional cat imagery but remain dignified.
          - Always keep answers SHORT (bullets or compact sentences).
          - Prefer 3-5 bullet summaries when asked to summarize.
          - Avoid long paragraphs.`
        : `You are "Kuroneko", the black cat guardian of this writing portfolio. You are elegant, intelligent, concise, and give short answers.`;

      // Map internal 'model' role to API 'assistant' role
      const apiMessages = [
        { role: 'system', content: systemInstruction },
        ...updatedMessages.map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.text
        }))
      ];

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: apiMessages,
          stream: false,
          temperature: 1.0 // Balanced creativity
        })
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "The archives are silent.";
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMessage = "Meow... the connection is broken. Go find SHIRONEKO for help @lucas20041121@gmail.com";
      if (error.message?.includes("401")) errorMessage = "Invalid API Key. Access denied.";
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  // --- Prompt Document Logic ---
    const getSuggestedPrompts = () => {
      if (article) {
        return [
          "Give a 3-bullet summary",
          "What should I pay attention to?",
          "Outline the sections",
          "Explain the tone in one line"
        ];
      }
      return [
        "What is in this archive?",
        "Suggest a random entry",
        "Who are you?",
        "Tell me a very short story"
      ];
    };

    const readerActions = article ? [
      { label: '3-bullet summary', prompt: 'Provide a 3-bullet summary of this article.' },
      { label: 'Key takeaways', prompt: 'List 3 key takeaways the reader should remember.' },
      { label: 'Quick outline', prompt: 'Outline this article in 4 short bullet points.' },
      { label: 'Tone & mood', prompt: 'Describe the tone and mood in one sentence.' }
    ] : [];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-8 w-80 md:w-96 bg-[#f0e6d2] rounded-lg shadow-2xl border border-[#d7ccc8] flex flex-col overflow-hidden z-50 font-serif h-[500px] animate-fade-in">
      {/* Background Texture Applied to whole card for integration */}
      <div className="absolute inset-0 texture-parchment opacity-40 pointer-events-none z-0"></div>
      
      {/* Header - Keep distinct to separate window */}
      <div className="relative z-20 bg-[#5d4037] text-[#efebe9] p-3 flex justify-between items-center shadow-md border-b border-[#3e2723]">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">pets</span>
            <span className="font-display tracking-widest text-xs uppercase">Kuroneko</span>
        </div>
        <button onClick={onClose} className="hover:text-white text-[#d7ccc8] transition-colors">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 custom-scrollbar">
        {article && readerActions.length > 0 && (
          <div className="border border-[#d7ccc8] bg-white/70 p-3 rounded-sm shadow-sm">
            <h4 className="font-display text-xs uppercase tracking-widest text-[#5d4037] mb-2">Reader Aids</h4>
            <div className="grid grid-cols-2 gap-2">
              {readerActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  className="text-left text-[13px] font-serif text-[#5d4037] hover:text-[#2d1b12] bg-[#f7f1e8] border border-[#e0d7c6] rounded px-2 py-2 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="space-y-4">
            {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`text-lg ${
                msg.role === 'user' 
                    ? 'bg-[#5d4037] text-[#efebe9] border border-[#3e2723] p-3 rounded-sm shadow-sm max-w-[85%]' 
                    : 'text-[#2c2c2c] p-0 pl-0 max-w-[95%] leading-relaxed' 
                }`}>
                 {msg.role === 'model' ? (
                     <div className="whitespace-pre-wrap">{msg.text}</div>
                 ) : msg.text}
                </div>
            </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start">
                    <div className="p-0 pl-0 text-base italic text-[#8d6e63] flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                        Thinking...
                    </div>
                </div>
            )}
            
            {/* Suggested Prompts - Cleaned up to match */}
            {messages.length <= 2 && !isLoading && (
                <div className="mt-6 mx-2">
                    <div className="border-t border-b border-[#d7ccc8] p-4 relative bg-transparent"> 
                        <h4 className="font-display text-[#5d4037] text-xs uppercase tracking-widest mb-3 text-center">
                            Curiosities
                        </h4>
                        <ul className="space-y-2">
                            {getSuggestedPrompts().map((prompt, idx) => (
                                <li key={idx}>
                                    <button 
                                        onClick={() => handleSend(prompt)}
                                        className="w-full text-left text-base text-[#5d4037] hover:text-[#2d1b12] hover:translate-x-1 transition-transform p-1 font-serif italic flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm opacity-50">arrow_right</span>
                                        {prompt}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Compacted: Reduced Padding, Inline Button, Removed Helper Text */}
      <div className="p-3 relative z-20 bg-[#5d4037] border-t border-[#3e2723]">
        <div className="flex items-end gap-2 relative">
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Kuroneko..."
                className="flex-1 bg-transparent border-none p-0 text-lg text-[#efebe9] focus:ring-0 resize-none font-serif leading-relaxed placeholder-[#d7ccc8]/50"
                style={{ minHeight: '24px', maxHeight: '120px' }}
                rows={1}
            />
            
            <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="text-[#d7ccc8] hover:text-white disabled:opacity-30 transition-colors p-1 mb-0.5"
                title="Submit Query"
            >
                <span className="material-symbols-outlined text-2xl block">arrow_upward</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;