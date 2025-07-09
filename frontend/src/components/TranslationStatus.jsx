import React, { useState, useEffect } from 'react';
import { Languages, Check, Sparkles, Globe } from 'lucide-react';
import toast from 'react-hot-toast';


const TranslationStatus = ({ translationEnabled, preferredLanguage, onClick }) => {

      const [isVisible, setIsVisible] = useState(false);
      const [animationState, setAnimationState] = useState('loading');

      useEffect(() => {
            if (translationEnabled) {
                  setIsVisible(true);
                  const timer = setTimeout(() => {
                        setAnimationState('active');
                  }, 1000);
                  return () => clearTimeout(timer);
            } else {
                  setIsVisible(false);
                  setAnimationState('loading');
            }
      }, [translationEnabled]);


      
      if (!isVisible) return null;

      return (
            <div  onClick={onClick}  className=" transition-all duration-500 ease-out">
                  <div  className="group relative">
                        {/* Animated background glow */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 animate-pulse"></div>

                        {/* Main container */}
                        <div className="relative flex items-center space-x-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/25">
                              {/* Status indicator */}
                              <div className="relative">
                                    {animationState === 'loading' ? (
                                          <div className="flex items-center justify-center">
                                                <Languages className="w-6 h-6 text-emerald-300 animate-spin" />
                                                <div className="absolute inset-0 w-6 h-6 rounded-full border-2 border-emerald-300/30 border-t-emerald-300 animate-spin"></div>
                                          </div>
                                    ) : (
                                          <div className="relative">
                                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-bounce">
                                                      <Check className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                                          </div>
                                    )}
                              </div>

                              {/* Text content */}
                              <div className="flex flex-col">
                                    <div className="flex items-center space-x-2">
                                          <span className="text-white font-semibold text-sm">
                                                {animationState === 'loading' ? 'Activating Translation...' : 'Translation Active'}
                                          </span>
                                          <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                                    </div>
                                    <div className="flex items-center space-x-1 mt-1">
                                          <Globe className="w-3 h-3 text-emerald-300" />
                                          <span className="text-emerald-200 text-xs font-medium">
                                                {preferredLanguage}
                                          </span>
                                    </div>
                              </div>

                              {/* Animated dots */}
                              <div className="flex space-x-1">
                                    {[0, 1, 2].map((i) => (
                                          <div
                                                key={i}
                                                className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-bounce"
                                                style={{
                                                      animationDelay: `${i * 0.1}s`,
                                                      animationDuration: '1s'
                                                }}
                                          ></div>
                                    ))}
                              </div>
                        </div>

                        {/* Floating particles */}
                        <div className="absolute -top-2 -left-2 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-60"></div>
                        <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.5s' }}></div>
                  </div>
            </div>
      );
};

export default TranslationStatus