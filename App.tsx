
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  SITUATIONS, TARGETS, KOREAN_FONTS, ENGLISH_FONTS, 
  IMAGE_TYPES, IMAGE_STYLE_PRESETS, LAYOUT_FRAMES, TEXT_FRAMES, QUOTE_THEMES 
} from './constants';
import { 
  Situation, Target, MessageStyle, QuoteTheme, GeneratedContent, 
  ImageType, ImageStylePreset, LayoutFrame, TextFrame, QuoteOption 
} from './types';
import { generateGreetingContent, generateCardImage, fetchQuoteOptions, generateCardVideo } from './services/geminiService';
import CardPreview from './components/CardPreview';

declare var html2canvas: any;
declare var window: any;

const App: React.FC = () => {
  const [senderName, setSenderName] = useState('');
  const [situation, setSituation] = useState<Situation>(SITUATIONS[0]);
  const [target, setTarget] = useState<Target>(TARGETS[0]);
  
  const [mainTab, setMainTab] = useState<'greeting' | 'quote'>('greeting');
  const [messageStyle, setMessageStyle] = useState<MessageStyle>('강력');
  const [quoteTheme, setQuoteTheme] = useState<QuoteTheme>('리더십');
  
  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(null);
  const [isQuoteFetching, setIsQuoteFetching] = useState(false);

  const [userRequirement, setUserRequirement] = useState('');
  const [refinementText, setRefinementText] = useState('');

  const [imageType, setImageType] = useState<ImageType>('자연');
  const [imageStylePreset, setImageStylePreset] = useState<ImageStylePreset>('시네마틱');
  const [selectedLayoutFrame, setSelectedLayoutFrame] = useState<LayoutFrame>('FullGold');
  const [selectedTextFrame, setSelectedTextFrame] = useState<TextFrame>('None');
  const [designRequirement, setDesignRequirement] = useState('');
  
  const [selectedFont, setSelectedFont] = useState(KOREAN_FONTS[0].value);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [detectedRatio, setDetectedRatio] = useState<string>('1:1');
  
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(1.0);
  const [letterSpacingScale, setLetterSpacingScale] = useState(1.0); 
  const [lineHeightScale, setLineHeightScale] = useState(1.0);

  const [textColor, setTextColor] = useState('#ffffff');
  const [textOpacity, setTextOpacity] = useState(1.0);
  const [textShadowIntensity, setTextShadowIntensity] = useState(12);
  const [textShadowColor, setTextShadowColor] = useState('rgba(0,0,0,0.9)');
  const [frameColor, setFrameColor] = useState('#f59e0b');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [visualLoadMessage, setVisualLoadMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Fix: Improved API key check to follow race condition guidelines
  const checkAndRequestApiKey = async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        alert("고성능 AI 모델 사용을 위해 먼저 API 키 프로젝트를 선택해주세요.");
        await window.aistudio.openSelectKey();
        return true; // Assume success after opening
      }
    }
    return true;
  };

  // Fix: Added missing handleFetchQuotes function
  const handleFetchQuotes = async () => {
    setIsQuoteFetching(true);
    try {
      await checkAndRequestApiKey();
      const options = await fetchQuoteOptions(quoteTheme);
      setQuoteOptions(options);
      if (options.length > 0) setSelectedQuote(options[0]);
    } catch (error: any) {
      console.error("Quote Fetch Error:", error);
      alert("명언을 가져오는 도중 오류가 발생했습니다.");
    } finally {
      setIsQuoteFetching(false);
    }
  };

  const handleGenerateCard = async () => {
    const isQuoteOnly = mainTab === 'quote';
    if (isQuoteOnly && !selectedQuote) {
      alert("명언 추출 후 하나를 선택해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await checkAndRequestApiKey();
      const result = await generateGreetingContent(
        situation, 
        target, 
        senderName, 
        userRequirement, 
        messageStyle, 
        quoteTheme, 
        isQuoteOnly,
        isQuoteOnly && selectedQuote ? `${selectedQuote.text}\n- ${selectedQuote.author}` : undefined
      );
      setContent(result);
      // Fix: Update currentMessage when new content is generated
      setCurrentMessage(result.mainMessage);
      if (result.recommendedSeason) setDesignRequirement(result.recommendedSeason);
      setTextAlign('center'); 
    } catch (error: any) {
      console.error("Content Gen Error:", error);
      if (error.message?.includes("API_KEY")) {
        alert("API 키가 유효하지 않거나 선택되지 않았습니다. AI Studio에서 키를 다시 확인해주세요.");
        if (window.aistudio) window.aistudio.openSelectKey();
      } else {
        alert(`카드 생성 도중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVisual = async (type: 'image' | 'video', isRefinement: boolean = false) => {
    if (!content) {
      alert("먼저 카드 문구를 생성해주세요.");
      return;
    }
    
    setIsVisualLoading(true);
    setVisualLoadMessage(type === 'image' ? '베테랑 디자이너가 배경을 합성 중입니다...' : 'AI가 시네마틱 영상을 렌더링 중입니다. 약 1~2분이 소요될 수 있습니다.');
    
    try {
      await checkAndRequestApiKey();
      if (type === 'video') {
        const videoUrl = await generateCardVideo(
          content.bgTheme,
          designRequirement,
          referenceImage || undefined,
          detectedRatio === '9:16' ? '9:16' : '16:9',
          currentMessage
        );
        setBackgroundVideo(videoUrl);
        setBackgroundImage(null);
      } else {
        const imageUrl = await generateCardImage(
          content.bgTheme, 'Realistic', designRequirement, 
          referenceImage || undefined, detectedRatio as any, imageType, imageStylePreset,
          isRefinement ? refinementText : undefined,
          currentMessage
        );
        setBackgroundImage(imageUrl);
        setBackgroundVideo(null);
      }
    } catch (error: any) {
      console.error("Visual Gen Error:", error);
      if (error.message?.includes("entity was not found") || error.message?.includes("API_KEY")) {
        alert("API 키 설정 문제로 생성을 실패했습니다. 유료 프로젝트 키가 필요합니다.");
        if (window.aistudio) window.aistudio.openSelectKey();
      } else {
        alert("비주얼 생성 도중 오류가 발생했습니다.");
      }
    } finally {
      setIsVisualLoading(false);
    }
  };

  const handleDownload = () => {
    const el = document.getElementById('card-to-save');
    if (el) html2canvas(el, { scale: 5, useCORS: true }).then((canvas: any) => {
      const link = document.createElement('a');
      link.download = `Signature_Card_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleShare = async () => {
    const el = document.getElementById('card-to-save');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 3, useCORS: true });
    canvas.toBlob(async (blob: any) => {
      if (blob && navigator.share) {
        const file = new File([blob], "signature.png", { type: "image/png" });
        try {
          await navigator.share({
            files: [file],
            title: '비즈 마스터 시그니처 인사말',
            text: '전문가의 감각이 담긴 리더십 카드를 공유합니다.',
          });
        } catch (e) { console.error(e); }
      } else {
        alert("이미지 다운로드 후 전달해주세요.");
      }
    });
  };

  const typographyStyles = useMemo(() => {
    const len = currentMessage.length;
    let baseFontSize = 24;
    let baseLineHeight = 1.6;
    let baseLetterSpacing = 0.02;
    let dynamicPadding = '20% 12%';

    if (len < 25) {
      baseFontSize = 42; baseLineHeight = 1.35; baseLetterSpacing = 0.08; dynamicPadding = '25% 15%';
    } else if (len < 55) {
      baseFontSize = 32; baseLineHeight = 1.55; baseLetterSpacing = 0.04; dynamicPadding = '22% 13%';
    } else if (len < 100) {
      baseFontSize = 24; baseLineHeight = 1.7; baseLetterSpacing = 0.01; dynamicPadding = '18% 10%';
    } else {
      baseFontSize = 18; baseLineHeight = 1.8; baseLetterSpacing = -0.01; dynamicPadding = '14% 8%';
    }

    return {
      fontFamily: selectedFont,
      fontStyle: isItalic ? 'italic' : 'normal',
      fontWeight: isBold ? '900' : '400',
      textAlign: textAlign as any,
      fontSize: `${baseFontSize * fontSizeScale}px`,
      letterSpacing: `${(baseLetterSpacing + (letterSpacingScale - 1) * 0.05)}em`,
      lineHeight: baseLineHeight * lineHeightScale,
      color: textColor,
      opacity: textOpacity,
      textShadow: `0 ${textShadowIntensity}px ${textShadowIntensity * 2.2}px ${textShadowColor}`,
      padding: dynamicPadding,
      whiteSpace: 'pre-wrap' as any,
      wordBreak: 'keep-all' as any,
      overflowWrap: 'break-word' as any,
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    };
  }, [currentMessage, selectedFont, isItalic, isBold, textAlign, fontSizeScale, letterSpacingScale, lineHeightScale, textColor, textOpacity, textShadowIntensity, textShadowColor]);

  return (
    <div className="min-h-screen bg-[#010206] text-[#f8fafc] flex flex-col font-sans">
      <header className="bg-black/90 py-4 px-6 md:px-10 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black font-black">M</div>
          <h1 className="text-sm md:text-base font-black tracking-widest uppercase">BIZ MASTER <span className="text-amber-500">SIGNATURE LAB</span></h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.aistudio?.openSelectKey()} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold hover:bg-white/10 transition-all">API 키 설정</button>
          {content && <button onClick={handleShare} className="px-5 py-2.5 bg-amber-500 text-black rounded-full text-[10px] font-black hover:brightness-110">전송</button>}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-24">
          <div className="bg-[#0b0d12] p-8 rounded-[40px] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
            <h2 className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">01. 메시지 오더</h2>
            <div className="flex bg-black/60 p-1.5 rounded-[22px] border border-white/5">
              <button onClick={() => setMainTab('greeting')} className={`flex-1 py-3 text-xs font-black rounded-[18px] transition-all ${mainTab === 'greeting' ? 'bg-amber-500 text-black' : 'text-white/30'}`}>인사말</button>
              <button onClick={() => setMainTab('quote')} className={`flex-1 py-3 text-xs font-black rounded-[18px] transition-all ${mainTab === 'quote' ? 'bg-amber-500 text-black' : 'text-white/30'}`}>명언</button>
            </div>
            <div className="space-y-6">
              {mainTab === 'greeting' ? (
                <div className="space-y-6">
                  <div className="space-y-3"><label className="text-[9px] text-white/30 uppercase tracking-widest">스타일</label><div className="grid grid-cols-3 gap-2">{(['강력', '따뜻함', '심플'] as const).map(s => <button key={s} onClick={() => setMessageStyle(s)} className={`py-2 text-[10px] font-black rounded-xl border border-white/5 ${messageStyle === s ? 'bg-white/10 text-amber-500 border-amber-500' : 'bg-black/20 text-white/20'}`}>{s}</button>)}</div></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest">대상</label><select value={target} onChange={(e) => setTarget(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold outline-none">{TARGETS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest">상황</label><select value={situation} onChange={(e) => setSituation(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold outline-none">{SITUATIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3"><label className="text-[9px] text-white/30 uppercase tracking-widest">주제</label><div className="grid grid-cols-3 gap-2">{(['리더십', '행동', '감사'] as const).map(q => <button key={q} onClick={() => setQuoteTheme(q)} className={`py-2 text-[10px] font-black rounded-xl border border-white/5 ${quoteTheme === q ? 'bg-white/10 text-amber-500 border-amber-500' : 'bg-black/20 text-white/20'}`}>{q}</button>)}</div></div>
                  <button onClick={handleFetchQuotes} disabled={isQuoteFetching} className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-amber-500">{isQuoteFetching ? "추출 중..." : "명언 후보 생성"}</button>
                  {quoteOptions.length > 0 && <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar border-t border-white/5 pt-4">{quoteOptions.map((opt, idx) => <div key={idx} onClick={() => setSelectedQuote(opt)} className={`p-3 rounded-xl border text-[10px] cursor-pointer ${selectedQuote === opt ? 'bg-amber-500 text-black border-transparent' : 'bg-black/40 text-white/60 border-white/5'}`}>"{opt.text}" - {opt.author}</div>)}</div>}
                </div>
              )}
              <div className="space-y-4 pt-2 border-t border-white/5">
                <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="보내는 분 성함" className="w-full p-4 bg-black/60 border border-white/10 rounded-xl text-xs outline-none focus:border-amber-500" />
                <textarea value={userRequirement} onChange={(e) => setUserRequirement(e.target.value)} placeholder="AI에게 특별한 요청사항이 있나요?" className="w-full p-4 bg-black/60 border border-white/10 rounded-xl h-20 text-xs resize-none outline-none focus:border-amber-500" />
                <button onClick={handleGenerateCard} disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-400 text-black text-sm font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2">{isLoading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}카드 문구 완성</button>
              </div>
            </div>
          </div>

          <div className="bg-[#0b0d12] p-8 rounded-[40px] border border-white/5 space-y-6 shadow-2xl relative">
            <h2 className="text-[11px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">02. 비주얼 마스터</h2>
            <div className={`space-y-6 ${!content ? 'opacity-20 pointer-events-none' : ''}`}>
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">배경 테마</label><select value={imageType} onChange={(e) => setImageType(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none">{IMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">아트 스타일</label><select value={imageStylePreset} onChange={(e) => setImageStylePreset(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none">{IMAGE_STYLE_PRESETS.map(preset => <option key={preset} value={preset}>{preset}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => handleGenerateVisual('image')} disabled={isVisualLoading} className="w-full py-4 bg-cyan-500 text-black text-[10px] font-black rounded-2xl shadow-xl flex items-center justify-center gap-2">{isVisualLoading ? "생성 중..." : "AI 시네마틱 배경 생성"}</button>
                <button onClick={() => handleGenerateVisual('video')} disabled={isVisualLoading} className="w-full py-4 border border-cyan-500 text-cyan-500 text-[10px] font-black rounded-2xl flex items-center justify-center gap-2">비주얼 영상 생성 (VEO 3.1)</button>
              </div>
              {isVisualLoading && <p className="text-[9px] text-cyan-400 animate-pulse text-center font-bold">{visualLoadMessage}</p>}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-10">
          {!content ? (
            <div className="h-[750px] flex flex-col items-center justify-center bg-black/30 rounded-[70px] border border-white/5 border-dashed p-10 shadow-inner relative overflow-hidden group">
               <div className="text-[11px] font-black text-white/5 tracking-[1em] uppercase text-center animate-pulse">Designing your signature card...</div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="flex justify-center p-2 md:p-12 bg-black/60 rounded-[40px] md:rounded-[80px] border border-white/5 shadow-inner">
                <div className="w-full max-w-[600px]">
                  <CardPreview 
                    content={content} currentMessage={currentMessage} senderName={senderName}
                    backgroundImage={backgroundImage} backgroundVideo={backgroundVideo}
                    fontFamily={selectedFont} aspectRatio={detectedRatio} textAlign={textAlign}
                    isBold={isBold} isItalic={isItalic} 
                    layoutFrame={selectedLayoutFrame} textFrame={selectedTextFrame}
                    fontSizeScale={fontSizeScale} letterSpacingScale={letterSpacingScale} lineHeightScale={lineHeightScale}
                    textColor={textColor} textOpacity={textOpacity} textShadowIntensity={textShadowIntensity} 
                    textShadowColor={textShadowColor} frameColor={frameColor} overlayOpacity={overlayOpacity}
                  />
                </div>
              </div>

              <div className="bg-[#0b0d12] p-10 rounded-[50px] border border-white/5 space-y-12 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Color & Contrast</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase">텍스트</label><input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-12 bg-black border border-white/10 rounded-2xl cursor-pointer" /></div>
                      <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase">프레임</label><input type="color" value={frameColor} onChange={(e) => setFrameColor(e.target.value)} className="w-full h-12 bg-black border border-white/10 rounded-2xl cursor-pointer" /></div>
                    </div>
                    <div className="space-y-3 pt-2">
                       <div className="flex justify-between"><label className="text-[9px] text-white/30 uppercase">글자 투명도</label><span className="text-[10px] text-amber-500 font-black">{Math.round(textOpacity * 100)}%</span></div>
                       <input type="range" min="0" max="1" step="0.05" value={textOpacity} onChange={(e) => setTextOpacity(parseFloat(e.target.value))} className="w-full" />
                    </div>
                  </div>

                  <div className="space-y-6"><h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Font Selection</h4><select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-xs text-white outline-none">{KOREAN_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}</select></div>
                  <div className="space-y-6"><h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Typography Engine</h4><div className="space-y-5 bg-black/30 p-5 rounded-3xl"><div className="space-y-2"><input type="range" min="0.5" max="2.0" step="0.05" value={fontSizeScale} onChange={(e) => setFontSizeScale(parseFloat(e.target.value))} className="w-full" /></div></div></div>
                </div>

                <div className="space-y-4 pt-10 border-t border-white/5">
                  <div className="relative rounded-[50px] bg-black/90 p-2 border border-white/5 overflow-hidden min-h-[300px]"><textarea ref={editorRef} value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} className="w-full bg-transparent resize-none outline-none no-scrollbar" style={typographyStyles} spellCheck={false} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10"><button onClick={handleDownload} className="py-6 bg-gradient-to-r from-amber-600 to-amber-200 text-black font-black uppercase tracking-[0.6em] text-xs rounded-3xl shadow-2xl transition-all">Download</button><button onClick={handleShare} className="py-6 border border-white/10 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-3xl">Smart Share</button></div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <footer className="py-20 text-center opacity-10 select-none font-black tracking-[1.5em] uppercase italic">Biz Master AI Studio v4.4</footer>
    </div>
  );
};

export default App;
