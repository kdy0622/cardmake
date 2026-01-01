
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

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const b = reader.result as string;
                setReferenceImage(b);
                calculateAspectRatio(b);
              };
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  useEffect(() => {
    if (content) {
      setCurrentMessage(content.mainMessage);
      if (content.sender && !senderName) setSenderName(content.sender);
    }
  }, [content]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.height = 'auto';
      editorRef.current.style.height = (editorRef.current.scrollHeight + 20) + 'px';
    }
  }, [currentMessage, fontSizeScale, lineHeightScale]);

  const handleFetchQuotes = async () => {
    setIsQuoteFetching(true);
    try {
      const quotes = await fetchQuoteOptions(quoteTheme);
      setQuoteOptions(quotes);
      setSelectedQuote(null);
    } catch (e) {
      alert("명언 추출 중 오류가 발생했습니다.");
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
      if (result.recommendedSeason) setDesignRequirement(result.recommendedSeason);
      setTextAlign('center'); 
    } catch (error) {
      alert("카드 생성 도중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkApiKey = async () => {
    if (!(await window.aistudio.hasSelectedApiKey())) {
      alert("영상 생성을 위해 API 키 선택이 필요합니다.");
      await window.aistudio.openSelectKey();
      return true;
    }
    return true;
  };

  const handleGenerateVisual = async (type: 'image' | 'video', isRefinement: boolean = false) => {
    if (!content) {
      alert("먼저 카드 문구를 생성해주세요.");
      return;
    }
    
    setIsVisualLoading(true);
    setVisualLoadMessage(type === 'image' ? '베테랑 디자이너가 배경을 합성 중입니다...' : 'AI가 시네마틱 영상을 렌더링 중입니다. 약 1~2분이 소요될 수 있습니다.');
    
    try {
      if (type === 'video') {
        await checkApiKey();
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
      if (error.message?.includes("Requested entity was not found")) {
        alert("API 키 프로젝트를 다시 확인해주세요 (유료 계정 필요).");
        await window.aistudio.openSelectKey();
      } else {
        console.error("생성 실패", error);
        alert("생성 도중 오류가 발생했습니다.");
      }
    } finally {
      setIsVisualLoading(false);
    }
  };

  const handleApplyReferenceAsBackground = () => {
    if (!referenceImage) {
      alert("먼저 예시 이미지를 업로드하세요.");
      return;
    }
    setBackgroundImage(referenceImage);
    setBackgroundVideo(null);
  };

  const calculateAspectRatio = (base64: string) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio > 1.25) setDetectedRatio('4:3');
      else if (ratio < 0.75) setDetectedRatio('3:4');
      else setDetectedRatio('1:1');
    };
    img.src = base64;
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
            title: '20년 베테랑의 시그니처 인사말',
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
    <div className="min-h-screen bg-[#010206] text-[#f8fafc] flex flex-col font-sans selection:bg-amber-500/50">
      <header className="no-print bg-black/90 py-4 px-6 md:px-10 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(245,158,11,0.4)]">M</div>
          <h1 className="text-sm md:text-base font-black tracking-widest uppercase">비즈 마스터 <span className="text-amber-500">시그니처 Lab</span></h1>
        </div>
        {content && (
          <button onClick={handleShare} className="px-5 py-2.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black hover:bg-white hover:text-black transition-all">모바일 전송</button>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <section className="no-print lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-24">
          <div className="bg-[#0b0d12] p-8 rounded-[40px] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20 group-hover:bg-amber-500 transition-all duration-500" />
            <h2 className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> 01. 리더십 오더 시트
            </h2>

            <div className="flex bg-black/60 p-1.5 rounded-[22px] border border-white/5">
              <button onClick={() => setMainTab('greeting')} className={`flex-1 py-3 text-xs font-black rounded-[18px] transition-all ${mainTab === 'greeting' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-white/30 hover:text-white/60'}`}>인사말</button>
              <button onClick={() => setMainTab('quote')} className={`flex-1 py-3 text-xs font-black rounded-[18px] transition-all ${mainTab === 'quote' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-white/30 hover:text-white/60'}`}>명언</button>
            </div>

            <div className="space-y-6">
              {mainTab === 'greeting' ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="space-y-3"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">메시지 스타일</label><div className="grid grid-cols-3 gap-2">{(['강력', '따뜻함', '심플'] as const).map(s => <button key={s} onClick={() => setMessageStyle(s)} className={`py-2.5 text-[10px] font-black rounded-xl border border-white/5 transition-all ${messageStyle === s ? 'bg-white/10 text-amber-500 border-amber-500/50' : 'bg-black/20 text-white/20 hover:text-white/40'}`}>{s}</button>)}</div></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">받는 분</label><select value={target} onChange={(e) => setTarget(e.target.value as any)} className="w-full p-3.5 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-amber-500">{TARGETS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">상황 설정</label><select value={situation} onChange={(e) => setSituation(e.target.value as any)} className="w-full p-3.5 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-amber-500">{SITUATIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="space-y-3"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">명언 주제</label><div className="grid grid-cols-3 gap-2">{(['리더십', '행동', '위로', '감사', '결단'] as const).map(q => <button key={q} onClick={() => setQuoteTheme(q)} className={`py-2.5 text-[10px] font-black rounded-xl border border-white/5 transition-all ${quoteTheme === q ? 'bg-white/10 text-amber-500 border-amber-500/50' : 'bg-black/20 text-white/20 hover:text-white/40'}`}>{q}</button>)}</div></div>
                  <button onClick={handleFetchQuotes} disabled={isQuoteFetching} className="w-full py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-amber-500 flex items-center justify-center gap-3 shadow-lg">{isQuoteFetching && <div className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />}명언 생성 (5개 랜덤 추출)</button>
                  {quoteOptions.length > 0 && <div className="space-y-2 max-h-64 overflow-y-auto pr-1 no-scrollbar border-t border-white/5 pt-4"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">명언 셀렉션</label>{quoteOptions.map((opt, idx) => <div key={idx} onClick={() => setSelectedQuote(opt)} className={`p-4 rounded-2xl border cursor-pointer transition-all text-[11px] leading-relaxed ${selectedQuote === opt ? 'bg-amber-500 text-black border-transparent shadow-xl' : 'bg-black/40 text-white/60 border-white/5 hover:border-white/20'}`}>"{opt.text}" <br/><span className="opacity-70 text-[10px] font-black mt-2 block">- {opt.author}</span></div>)}</div>}
                </div>
              )}
              <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">작성자(본인)</label><input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="성함 입력" className="w-full p-4 bg-black/60 border border-white/10 rounded-xl text-xs font-bold outline-none focus:border-amber-500 text-white shadow-inner" /></div>
                <textarea value={userRequirement} onChange={(e) => setUserRequirement(e.target.value)} placeholder="베테랑 디자이너에게 전하는 추가 요청" className="w-full p-5 bg-black/60 border border-white/10 rounded-2xl h-24 text-xs resize-none outline-none focus:border-amber-500 text-white/80 shadow-inner" />
                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    onClick={handleGenerateCard} 
                    disabled={isLoading || (mainTab === 'quote' && !selectedQuote)} 
                    className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-400 text-black text-sm font-black rounded-2xl shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                  >
                    {isLoading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
                    카드 디자인 완성하기
                  </button>
                  {content && (
                    <button 
                      onClick={handleGenerateCard} 
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/40 shadow-xl"
                    >
                      다른 문구 추천 (AI)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0b0d12] p-8 rounded-[40px] border border-white/5 space-y-6 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400/20 group-hover:bg-cyan-400 transition-all duration-500" />
             <h2 className="text-[11px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> 02. 비주얼 마스터 엔진</h2>
            
            <div className={`space-y-6 ${!content ? 'opacity-20 pointer-events-none' : ''}`}>
              <div className="flex gap-3">
                <div onClick={() => fileInputRef.current?.click()} className="group relative flex-1 h-32 border-2 border-dashed border-white/5 bg-black/80 hover:border-cyan-400/50 cursor-pointer flex flex-col items-center justify-center rounded-3xl overflow-hidden shadow-inner">{referenceImage ? <img src={referenceImage} alt="Ref" className="w-full h-full object-contain p-2" /> : <div className="text-center p-4"><span className="text-[10px] text-white/30 font-black uppercase tracking-widest block">레퍼런스 업로드</span><span className="text-[8px] text-white/10 italic">Ctrl+V 지원</span></div>}<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const b = reader.result as string; setReferenceImage(b); calculateAspectRatio(b); }; reader.readAsDataURL(file); } }} /></div>
                {referenceImage && <button onClick={handleApplyReferenceAsBackground} className="w-16 h-32 bg-cyan-500/10 border border-cyan-500/30 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-cyan-500 hover:text-black transition-all group shadow-lg"><span className="text-[8px] font-black uppercase tracking-tighter [writing-mode:vertical-lr] rotate-180">USE RAW IMAGE</span></button>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">배경 테마</label><select value={imageType} onChange={(e) => setImageType(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none">{IMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest ml-1">아트 스타일</label><select value={imageStylePreset} onChange={(e) => setImageStylePreset(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none">{IMAGE_STYLE_PRESETS.map(preset => <option key={preset} value={preset}>{preset}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => handleGenerateVisual('image')} disabled={isVisualLoading} className="w-full py-4 bg-cyan-500 text-black text-[10px] font-black rounded-2xl hover:bg-cyan-400 transition-all shadow-xl flex items-center justify-center gap-2">{isVisualLoading ? <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}AI 시네마틱 배경 생성</button>
                <button onClick={() => handleGenerateVisual('video')} disabled={isVisualLoading} className="w-full py-4 border border-cyan-500 text-cyan-500 text-[10px] font-black rounded-2xl hover:bg-cyan-500 hover:text-black transition-all shadow-xl flex items-center justify-center gap-2">멋진 비주얼 영상 생성 (VEO 3.1)</button>
              </div>
              {isVisualLoading && <p className="text-[9px] text-cyan-400 animate-pulse text-center font-bold">{visualLoadMessage}</p>}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-10">
          {!content ? (
            <div className="h-[750px] flex flex-col items-center justify-center bg-black/30 rounded-[70px] border border-white/5 border-dashed p-10 shadow-inner relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="text-[11px] font-black text-white/5 tracking-[1em] uppercase text-center leading-loose animate-pulse">Designing your signature presence...</div>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex justify-center p-2 md:p-12 bg-black/60 rounded-[40px] md:rounded-[80px] border border-white/5 shadow-[inset_0_0_100px_rgba(0,0,0,1)] relative overflow-hidden group">
                <div className="w-full max-w-[600px] transform transition-transform group-hover:scale-[1.01] duration-700">
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

              <div className="bg-[#0b0d12] p-6 md:p-12 rounded-[50px] border border-white/5 space-y-12 shadow-2xl relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4 bg-white/[0.02] p-6 rounded-[35px] border border-white/5">
                    <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-1">디자인 세부 피드백</label>
                    <div className="flex gap-2 items-center flex-nowrap w-full"><input value={refinementText} onChange={(e) => setRefinementText(e.target.value)} placeholder="예: 대비를 높여주고 텍스처를 선명하게" className="flex-1 bg-black/80 border border-white/10 rounded-2xl px-5 py-3.5 text-xs outline-none focus:border-cyan-500 font-bold transition-colors min-w-0" /><button onClick={() => handleGenerateVisual('image', true)} disabled={isVisualLoading} className="flex-shrink-0 px-6 py-3.5 bg-cyan-500 text-black text-[11px] font-black rounded-2xl active:scale-95 transition-all shadow-lg hover:bg-cyan-400 whitespace-nowrap">반영</button></div>
                  </div>
                  <div className="space-y-4 bg-white/[0.02] p-6 rounded-[35px] border border-white/5">
                    <label className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest ml-1">시그니처 프레임워크</label>
                    <div className="grid grid-cols-2 gap-3 w-full"><select value={selectedLayoutFrame} onChange={(e) => setSelectedLayoutFrame(e.target.value as any)} className="w-full px-4 py-3.5 bg-black/80 border border-white/10 rounded-2xl text-[10px] text-white outline-none font-black hover:border-amber-500 appearance-none text-center">{LAYOUT_FRAMES.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select><select value={selectedTextFrame} onChange={(e) => setSelectedTextFrame(e.target.value as any)} className="w-full px-4 py-3.5 bg-black/80 border border-white/10 rounded-2xl text-[10px] text-white outline-none font-black hover:border-amber-500 appearance-none text-center">{TEXT_FRAMES.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Color & Contrast</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] text-white/30 uppercase">텍스트</label>
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-12 bg-black border border-white/10 rounded-2xl cursor-pointer transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] text-white/30 uppercase">프레임</label>
                        <input type="color" value={frameColor} onChange={(e) => setFrameColor(e.target.value)} className="w-full h-12 bg-black border border-white/10 rounded-2xl cursor-pointer transition-colors" />
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                       <div className="flex justify-between"><label className="text-[9px] text-white/30 uppercase">글자 투명도</label><span className="text-[10px] text-amber-500 font-black">{Math.round(textOpacity * 100)}%</span></div>
                       <input type="range" min="0" max="1" step="0.05" value={textOpacity} onChange={(e) => setTextOpacity(parseFloat(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-3 pt-2">
                       <div className="flex justify-between"><label className="text-[9px] text-white/30 uppercase">그림자 심도</label><span className="text-[10px] text-amber-500 font-black">{textShadowIntensity}px</span></div>
                       <input type="range" min="0" max="50" value={textShadowIntensity} onChange={(e) => setTextShadowIntensity(parseInt(e.target.value))} className="w-full" />
                    </div>
                  </div>

                  <div className="space-y-6"><h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Font Selection</h4><select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-xs text-white font-black shadow-inner focus:border-white/30 outline-none">{KOREAN_FONTS.map(f => <option key={f.category + f.name} value={f.value}>{f.name}</option>)}{ENGLISH_FONTS.map(f => <option key={f.category + f.name} value={f.value}>{f.name}</option>)}</select><div className="flex gap-2"><div className="flex-1 grid grid-cols-3 bg-black rounded-2xl border border-white/10 p-1">{(['left', 'center', 'right'] as const).map(a => <button key={a} onClick={() => setTextAlign(a)} className={`py-2 text-[10px] font-black rounded-xl transition-all ${textAlign === a ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>{a.toUpperCase()}</button>)}</div><button onClick={() => setIsBold(!isBold)} className={`w-12 py-3 text-[10px] font-black rounded-2xl border border-white/10 transition-all ${isBold ? 'bg-white text-black' : 'text-white/20 hover:text-white'}`}>B</button><button onClick={() => setIsItalic(!isItalic)} className={`w-12 py-3 text-[10px] font-black rounded-2xl border border-white/10 italic transition-all ${isItalic ? 'bg-white text-black' : 'text-white/20 hover:text-white'}`}>I</button></div></div>
                  <div className="space-y-6"><h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Typography Engine</h4><div className="space-y-5 bg-black/30 p-5 rounded-3xl border border-white/5 shadow-inner"><div className="space-y-2"><div className="flex justify-between text-[8px] opacity-40 uppercase"><span>크기</span><span>{Math.round(fontSizeScale*100)}%</span></div><input type="range" min="0.5" max="2.0" step="0.05" value={fontSizeScale} onChange={(e) => setFontSizeScale(parseFloat(e.target.value))} className="w-full" /></div><div className="space-y-2"><div className="flex justify-between text-[8px] opacity-40 uppercase"><span>자간</span><span>{letterSpacingScale}x</span></div><input type="range" min="0.0" max="5.0" step="0.1" value={letterSpacingScale} onChange={(e) => setLetterSpacingScale(parseFloat(e.target.value))} className="w-full" /></div><div className="space-y-2"><div className="flex justify-between text-[8px] opacity-40 uppercase"><span>행간</span><span>{lineHeightScale}x</span></div><input type="range" min="0.5" max="3.0" step="0.1" value={lineHeightScale} onChange={(e) => setLineHeightScale(parseFloat(e.target.value))} className="w-full" /></div></div></div>
                </div>

                <div className="space-y-4 pt-10 border-t border-white/5 relative">
                  <div className="flex items-center justify-between px-2 mb-4"><label className="text-[10px] font-black text-white/30 uppercase tracking-[1.5em]">Interactive Design Board</label><div className="text-[9px] font-black text-amber-500/70 uppercase italic tracking-wider">베테랑의 지능형 오토-레이아웃</div></div>
                  <div className="relative rounded-[50px] bg-black/90 p-2 border border-white/5 shadow-3xl overflow-hidden min-h-[400px]"><textarea ref={editorRef} value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} className="w-full bg-transparent resize-none outline-none transition-all duration-300 overflow-hidden block scroll-smooth no-scrollbar" style={typographyStyles} spellCheck={false} placeholder="메시지를 수정하면 전문가의 배치가 실시간으로 적용됩니다..." /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10"><button onClick={handleDownload} className="py-6 bg-gradient-to-r from-amber-600 to-amber-200 text-black font-black uppercase tracking-[0.6em] text-xs rounded-3xl shadow-2xl active:scale-[0.98] transition-all hover:brightness-110">High-Res Download</button><button onClick={handleShare} className="py-6 border border-white/10 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-3xl hover:bg-white/5 active:scale-[0.98] transition-all">스마트 공유하기</button></div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <footer className="py-20 px-10 border-t border-white/5 text-center opacity-10 select-none font-black tracking-[1.5em] uppercase leading-relaxed italic">Biz Master AI Studio • Signature Typography Engine v4.1</footer>
    </div>
  );
};

export default App;
