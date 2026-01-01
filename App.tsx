
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
// Fixed: Use the existing global AIStudio type to avoid redeclaration and modifier conflicts.
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  // Business States
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
  const [imageType, setImageType] = useState<ImageType>('자연');
  const [imageStylePreset, setImageStylePreset] = useState<ImageStylePreset>('시네마틱');
  const [selectedLayoutFrame, setSelectedLayoutFrame] = useState<LayoutFrame>('FullGold');
  const [selectedTextFrame, setSelectedTextFrame] = useState<TextFrame>('None');
  const [designRequirement, setDesignRequirement] = useState('');
  const [selectedFont, setSelectedFont] = useState(KOREAN_FONTS[0].value);
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

  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) {
        setHasKey(false);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    try {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Proceed assuming success per race condition instructions
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  const handleFetchQuotes = async () => {
    setIsQuoteFetching(true);
    try {
      const options = await fetchQuoteOptions(quoteTheme);
      setQuoteOptions(options);
      if (options.length > 0) setSelectedQuote(options[0]);
    } catch (error: any) {
      console.error(error);
      alert("명언 추출에 실패했습니다. 키 설정을 확인해주세요.");
    } finally {
      setIsQuoteFetching(false);
    }
  };

  const handleGenerateCard = async () => {
    setIsLoading(true);
    try {
      const isQuoteOnly = mainTab === 'quote';
      const result = await generateGreetingContent(
        situation, target, senderName, userRequirement, messageStyle, quoteTheme, 
        isQuoteOnly, isQuoteOnly && selectedQuote ? `${selectedQuote.text}\n- ${selectedQuote.author}` : undefined
      );
      setContent(result);
      setCurrentMessage(result.mainMessage);
      if (result.recommendedSeason) setDesignRequirement(result.recommendedSeason);
    } catch (error: any) {
      if (error.message?.includes("entity was not found")) {
        setHasKey(false);
        alert("선택된 API 키를 찾을 수 없습니다. 다시 선택해주세요.");
      } else {
        alert(`생성 오류: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVisual = async (type: 'image' | 'video') => {
    if (!content) return;
    setIsVisualLoading(true);
    setVisualLoadMessage(type === 'image' ? '배경 이미지를 생성 중...' : '시네마틱 영상을 렌더링 중 (약 1분)...');
    try {
      if (type === 'video') {
        const videoUrl = await generateCardVideo(content.bgTheme, designRequirement, undefined, detectedRatio === '9:16' ? '9:16' : '16:9', currentMessage);
        setBackgroundVideo(videoUrl);
        setBackgroundImage(null);
      } else {
        const imageUrl = await generateCardImage(content.bgTheme, 'Realistic', designRequirement, undefined, detectedRatio as any || '1:1', imageType, imageStylePreset, '', currentMessage);
        setBackgroundImage(imageUrl);
        setBackgroundVideo(null);
      }
    } catch (error: any) {
      alert("비주얼 생성 실패: " + error.message);
    } finally {
      setIsVisualLoading(false);
    }
  };

  const handleDownload = () => {
    const el = document.getElementById('card-to-save');
    if (el) html2canvas(el, { scale: 4, useCORS: true }).then((canvas: any) => {
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
          await navigator.share({ files: [file], title: '비즈 마스터 인사말', text: '리더의 품격이 담긴 카드입니다.' });
        } catch (e) { console.error(e); }
      }
    });
  };

  const typographyStyles = useMemo(() => {
    const len = currentMessage.length;
    let baseFontSize = len < 25 ? 42 : len < 55 ? 32 : len < 100 ? 24 : 18;
    return {
      fontFamily: selectedFont,
      fontStyle: isItalic ? 'italic' : 'normal',
      fontWeight: isBold ? '900' : '400',
      textAlign: textAlign as any,
      fontSize: `${baseFontSize * fontSizeScale}px`,
      letterSpacing: `${0.02 + (letterSpacingScale - 1) * 0.05}em`,
      lineHeight: 1.6 * lineHeightScale,
      color: textColor,
      opacity: textOpacity,
      textShadow: `0 ${textShadowIntensity}px ${textShadowIntensity * 2.2}px ${textShadowColor}`,
      padding: '20% 12%',
      whiteSpace: 'pre-wrap' as any,
      wordBreak: 'keep-all' as any,
    };
  }, [currentMessage, selectedFont, isItalic, isBold, textAlign, fontSizeScale, letterSpacingScale, lineHeightScale, textColor, textOpacity, textShadowIntensity, textShadowColor]);

  if (isCheckingKey) return <div className="h-screen bg-[#02040a] flex items-center justify-center"><div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /></div>;

  if (!hasKey) {
    return (
      <div className="h-screen bg-[#02040a] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#0b0d12] p-10 rounded-[40px] border border-white/5 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center text-4xl font-black text-black">M</div>
          <div className="space-y-4">
            <h1 className="text-2xl font-black tracking-tighter text-white">SIGNATURE LAB ACCESS</h1>
            <p className="text-white/40 text-sm leading-relaxed">
              고성능 AI 시각화 및 카피라이팅 엔진을 활성화하기 위해<br/>
              본인의 유료 API 키를 연결해야 합니다.
            </p>
          </div>
          <button 
            onClick={handleOpenKeyDialog}
            className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all"
          >
            시그니처 랩 입장 (키 선택)
          </button>
          <div className="pt-4 space-y-2 border-t border-white/5">
            <p className="text-[10px] text-white/20 uppercase tracking-widest">Billing Documentation</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] text-amber-500/50 hover:underline">
              ai.google.dev/gemini-api/docs/billing
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010206] text-[#f8fafc] flex flex-col font-sans">
      <header className="bg-black/90 py-4 px-10 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black font-black">M</div>
          <h1 className="text-base font-black tracking-widest uppercase">BIZ MASTER <span className="text-amber-500">SIGNATURE LAB</span></h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleOpenKeyDialog} className="px-4 py-2 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Key Change</button>
          {content && <button onClick={handleShare} className="px-5 py-2.5 bg-amber-500 text-black rounded-full text-[10px] font-black hover:brightness-110 shadow-lg">모바일 공유</button>}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-4 space-y-8">
          <div className="bg-[#0b0d12] p-8 rounded-[40px] border border-white/5 space-y-8 shadow-2xl overflow-hidden">
            <h2 className="text-[11px] font-black text-amber-500 uppercase tracking-widest">01. 메시지 오더 시트</h2>
            <div className="flex bg-black/60 p-1.5 rounded-[22px] border border-white/5">
              <button onClick={() => setMainTab('greeting')} className={`flex-1 py-3 text-xs font-black rounded-[18px] transition-all ${mainTab === 'greeting' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-white/30'}`}>인사말</button>
              <button onClick={() => setMainTab('quote')} className={`flex-1 py-3 text-xs font-black rounded-[18px] transition-all ${mainTab === 'quote' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-white/30'}`}>명언</button>
            </div>
            <div className="space-y-6">
              {mainTab === 'greeting' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest">대상</label><select value={target} onChange={(e) => setTarget(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-amber-500">{TARGETS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase tracking-widest">상황</label><select value={situation} onChange={(e) => setSituation(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-amber-500">{SITUATIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <button onClick={handleFetchQuotes} disabled={isQuoteFetching} className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-amber-500 hover:bg-white/10 transition-all">{isQuoteFetching ? "추출 중..." : "AI 명언 추천"}</button>
                  {quoteOptions.length > 0 && <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">{quoteOptions.map((opt, idx) => <div key={idx} onClick={() => setSelectedQuote(opt)} className={`p-3 rounded-xl border text-[10px] leading-relaxed cursor-pointer transition-all ${selectedQuote === opt ? 'bg-amber-500 text-black border-transparent shadow-md' : 'bg-black/40 text-white/60 border-white/5 hover:border-white/20'}`}>"{opt.text}" <br/><span className="font-bold opacity-60">- {opt.author}</span></div>)}</div>}
                </div>
              )}
              <div className="space-y-4 pt-2 border-t border-white/5">
                <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="작성자 성함 (선택사항)" className="w-full p-4 bg-black/60 border border-white/10 rounded-xl text-xs outline-none focus:border-amber-500" />
                <textarea value={userRequirement} onChange={(e) => setUserRequirement(e.target.value)} placeholder="추가 요청사항 (예: 봄 느낌 물씬 나게)" className="w-full p-4 bg-black/60 border border-white/10 rounded-xl h-20 text-xs resize-none outline-none focus:border-amber-500" />
                <button onClick={handleGenerateCard} disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-400 text-black text-sm font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]">{isLoading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "카드 문구 완성"}</button>
              </div>
            </div>
          </div>

          <div className="bg-[#0b0d12] p-8 rounded-[40px] border border-white/5 space-y-6 shadow-2xl relative">
            <h2 className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">02. 비주얼 마스터</h2>
            <div className={`space-y-6 ${!content ? 'opacity-20 pointer-events-none' : ''}`}>
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase ml-1">배경 테마</label><select value={imageType} onChange={(e) => setImageType(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-cyan-500">{IMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase ml-1">아트 스타일</label><select value={imageStylePreset} onChange={(e) => setImageStylePreset(e.target.value as any)} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-cyan-500">{IMAGE_STYLE_PRESETS.map(preset => <option key={preset} value={preset}>{preset}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => handleGenerateVisual('image')} disabled={isVisualLoading} className="w-full py-4 bg-cyan-500 text-black text-[10px] font-black rounded-2xl shadow-xl hover:bg-cyan-400 transition-all">{isVisualLoading ? "생성 중..." : "AI 시네마틱 배경 생성"}</button>
                <button onClick={() => handleGenerateVisual('video')} disabled={isVisualLoading} className="w-full py-4 border border-cyan-500 text-cyan-500 text-[10px] font-black rounded-2xl hover:bg-cyan-500 hover:text-black transition-all">시네마틱 영상 렌더링</button>
              </div>
              {isVisualLoading && <p className="text-[9px] text-cyan-400 animate-pulse text-center font-bold">{visualLoadMessage}</p>}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-10">
          {!content ? (
            <div className="h-[750px] flex flex-col items-center justify-center bg-black/30 rounded-[70px] border border-white/5 border-dashed p-10">
               <div className="text-[11px] font-black text-white/5 tracking-[1em] uppercase text-center animate-pulse">Design Lab Waiting...</div>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="flex justify-center p-12 bg-black/60 rounded-[80px] border border-white/5 shadow-inner">
                <div className="w-full max-w-[600px] shadow-2xl">
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

              <div className="bg-[#0b0d12] p-12 rounded-[50px] border border-white/5 space-y-12 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Color & Style</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase">글자 색</label><input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-12 bg-black border border-white/10 rounded-2xl cursor-pointer" /></div>
                      <div className="space-y-2"><label className="text-[9px] text-white/30 uppercase">프레임 색</label><input type="color" value={frameColor} onChange={(e) => setFrameColor(e.target.value)} className="w-full h-12 bg-black border border-white/10 rounded-2xl cursor-pointer" /></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Typography</h4>
                    <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-xs text-white outline-none">{KOREAN_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}</select>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Scale</h4>
                    <input type="range" min="0.5" max="2.0" step="0.05" value={fontSizeScale} onChange={(e) => setFontSizeScale(parseFloat(e.target.value))} className="w-full" />
                  </div>
                </div>

                <div className="space-y-4 pt-10 border-t border-white/5">
                  <div className="relative rounded-[50px] bg-black/90 p-6 border border-white/5 min-h-[300px] shadow-2xl">
                    <textarea ref={editorRef} value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} className="w-full bg-transparent resize-none outline-none no-scrollbar" style={typographyStyles} spellCheck={false} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10">
                    <button onClick={handleDownload} className="py-6 bg-gradient-to-r from-amber-600 to-amber-200 text-black font-black uppercase tracking-[0.6em] text-xs rounded-3xl shadow-2xl transition-all">이미지 다운로드</button>
                    <button onClick={handleShare} className="py-6 border border-white/10 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-3xl transition-all">모바일 스마트 공유</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <footer className="py-20 text-center opacity-10 select-none font-black tracking-[1.5em] uppercase italic">Biz Master AI Signature Lab</footer>
    </div>
  );
};

export default App;
