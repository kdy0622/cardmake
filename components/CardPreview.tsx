
import React, { useMemo } from 'react';
import { GeneratedContent, LayoutFrame, TextFrame } from '../types';

interface CardPreviewProps {
  content: GeneratedContent;
  currentMessage: string;
  senderName: string;
  backgroundImage: string | null;
  backgroundVideo: string | null;
  fontFamily: string;
  aspectRatio: string;
  textAlign: 'left' | 'center' | 'right';
  isBold: boolean;
  isItalic: boolean;
  layoutFrame: LayoutFrame;
  textFrame: TextFrame;
  fontSizeScale: number;
  letterSpacingScale: number;
  lineHeightScale: number;
  textColor: string;
  textOpacity: number;
  textShadowIntensity: number;
  textShadowColor: string;
  frameColor: string;
  overlayOpacity: number;
}

const CardPreview: React.FC<CardPreviewProps> = ({ 
  content, currentMessage, senderName, backgroundImage, backgroundVideo,
  fontFamily, aspectRatio, textAlign, isBold, isItalic, 
  layoutFrame, textFrame,
  fontSizeScale, letterSpacingScale, lineHeightScale,
  textColor, textOpacity, textShadowIntensity, textShadowColor, frameColor,
  overlayOpacity
}) => {
  const ratioClasses: Record<string, string> = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '3:4': 'aspect-[3/4]',
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]'
  };

  const typography = useMemo(() => {
    const len = currentMessage.length;
    let baseFontSize = 24;
    let baseLineHeight = 1.6;
    let baseLetterSpacing = 0.02;
    let dynamicPadding = '20% 12%';

    if (len < 25) {
      baseFontSize = 42; baseLineHeight = 1.35; baseLetterSpacing = 0.08; dynamicPadding = '24% 15%';
    } else if (len < 55) {
      baseFontSize = 32; baseLineHeight = 1.55; baseLetterSpacing = 0.04; dynamicPadding = '22% 13%';
    } else if (len < 100) {
      baseFontSize = 24; baseLineHeight = 1.7; baseLetterSpacing = 0.01; dynamicPadding = '18% 10%';
    } else {
      baseFontSize = 18; baseLineHeight = 1.8; baseLetterSpacing = -0.01; dynamicPadding = '14% 8%';
    }

    return {
      fontSize: `${baseFontSize * fontSizeScale}px`,
      lineHeight: baseLineHeight * lineHeightScale,
      letterSpacing: `${(baseLetterSpacing + (letterSpacingScale - 1) * 0.05)}em`,
      padding: dynamicPadding,
      alignClass: textAlign === 'left' ? 'text-left items-start' : textAlign === 'right' ? 'text-right items-end' : 'text-center items-center',
      shadow: `0 ${textShadowIntensity}px ${textShadowIntensity * 2.2}px ${textShadowColor}`
    };
  }, [currentMessage, textAlign, fontSizeScale, letterSpacingScale, lineHeightScale, textShadowIntensity, textShadowColor]);

  const renderLayoutFrame = () => {
    const commonStyle = { borderColor: frameColor };
    switch (layoutFrame) {
      case 'FullGold': return (
        <>
          <div className="absolute inset-0 border-[16px] pointer-events-none z-30 opacity-90 transition-all duration-700 ease-out" style={commonStyle} />
          <div className="absolute top-2 left-2 right-2 bottom-2 border-[1px] border-white/20 pointer-events-none z-30" />
          <div className="absolute top-0 left-0 w-32 h-32 border-t-[8px] border-l-[8px] z-40 pointer-events-none" style={commonStyle} />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b-[8px] border-r-[8px] z-40 pointer-events-none" style={commonStyle} />
        </>
      );
      case 'OrnateAntique': return (
        <div className="absolute inset-0 border-[40px] shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] pointer-events-none z-30 overflow-hidden" style={{ borderColor: frameColor }}>
           <div className="absolute inset-0 border-[2px] border-white/10" />
        </div>
      );
      case 'ModernMinimal': return <div className="absolute inset-0 border-[2px] pointer-events-none z-30 opacity-70" style={commonStyle} />;
      case 'DeepWood': return <div className="absolute inset-0 border-[35px] shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none z-30" style={{ borderColor: '#2d1b10' }} />;
      case 'CyberNeon': return <div className="absolute inset-0 border-[3px] shadow-[0_0_30px_rgba(255,255,255,0.4)] pointer-events-none z-30" style={{ borderColor: frameColor, boxShadow: `0 0 20px ${frameColor}, inset 0 0 20px ${frameColor}` }} />;
      case 'RoyalSignature': return (
        <>
          <div className="absolute inset-0 border-[1px] border-white/20 pointer-events-none z-30" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-8 border-b-2 z-40" style={commonStyle} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-8 border-t-2 z-40" style={commonStyle} />
        </>
      );
      case 'GalleryEdge': return <div className="absolute inset-0 border-[60px] border-white pointer-events-none z-30 shadow-2xl" />;
      default: return null;
    }
  };

  const textFrameStyles = useMemo(() => {
    switch (textFrame) {
      case 'Bracket': return 'relative before:content-[""] before:absolute before:-left-12 before:top-0 before:bottom-0 before:w-8 before:border-l-[4px] before:border-t-[4px] before:border-b-[4px] after:content-[""] after:absolute after:-right-12 after:top-0 after:bottom-0 after:w-8 after:border-r-[4px] after:border-t-[4px] after:border-b-[4px] px-16 py-4';
      case 'Glass': return 'bg-white/5 backdrop-blur-2xl border border-white/10 px-14 py-12 rounded-[50px] shadow-[0_40px_80px_rgba(0,0,0,0.4)]';
      case 'Underline': return 'border-b-[4px] pb-8';
      case 'DoubleLine': return 'border-y-[1px] py-12 opacity-90 border-white/20';
      case 'SoftGlow': return 'bg-black/20 backdrop-blur-md p-14 rounded-[60px] shadow-[0_0_120px_rgba(0,0,0,0.6)]';
      case 'VerticalBar': return 'border-l-[8px] pl-12';
      default: return '';
    }
  }, [textFrame]);

  return (
    <div 
      id="card-to-save"
      className={`relative w-full max-w-[600px] mx-auto bg-[#010206] transition-all duration-700 overflow-hidden shadow-3xl ${ratioClasses[aspectRatio] || 'aspect-square'}`}
      style={{ fontFamily, fontWeight: isBold ? '900' : '400', fontStyle: isItalic ? 'italic' : 'normal', color: textColor }}
    >
      {backgroundVideo ? (
        <video 
          key={backgroundVideo} autoPlay loop muted playsInline 
          className="absolute inset-0 w-full h-full object-cover scale-[1.03]"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      ) : backgroundImage && (
        <div className="absolute inset-0 bg-cover bg-center scale-[1.03]" style={{ backgroundImage: `url(${backgroundImage})` }} />
      )}

      {/* Overlay & Gradient */}
      {(backgroundImage || backgroundVideo) && (
        <>
          <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-black/40" />
        </>
      )}

      {renderLayoutFrame()}

      <div className={`relative h-full flex flex-col z-10 ${typography.alignClass}`} style={{ padding: typography.padding }}>
        <div className={`flex-1 flex flex-col justify-center w-full ${typography.alignClass}`}>
          <div className={textFrameStyles} style={{ borderColor: frameColor }}>
            <p className="whitespace-pre-wrap transition-all duration-700" style={{ 
              fontSize: typography.fontSize, 
              lineHeight: typography.lineHeight, 
              letterSpacing: typography.letterSpacing, 
              textAlign: textAlign, 
              textShadow: typography.shadow, 
              opacity: textOpacity,
              wordBreak: 'keep-all',
              overflowWrap: 'break-word'
            }}>
              {currentMessage}
            </p>
          </div>
        </div>
        
        {senderName && (
          <div className={`mt-12 flex flex-col ${typography.alignClass} gap-6`}>
            <div className="h-[2px] w-16 opacity-30" style={{ backgroundColor: frameColor }} />
            <div className="text-[14px] font-black tracking-[1.3em] opacity-90 uppercase bg-black/40 px-8 py-3 rounded-2xl backdrop-blur-xl border border-white/5" style={{ textShadow: typography.shadow }}>
              {senderName}
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
    </div>
  );
};

export default CardPreview;
