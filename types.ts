
export type Situation = 
  | '자동 추천(절기 반영)' | '일반 인사' | '목표 달성' | '팀 격려' | '감사 인사' 
  | '월초 인사' | '월말 결산' | '연말연시' | '명절' | '계절 인사';

export type Target = '비즈니스 파트너' | '스폰서' | '형제라인' | '고객' | '업무상 관련인';
export type MessageStyle = '에너지' | '감성' | '강력' | '따뜻함' | '심플';
export type QuoteTheme = '리더십' | '용기' | '행동' | '위로' | '감사' | '결단';

export type ImageType = '자연' | '우주' | '사물' | '인물' | '건물';
export type ImageStylePreset = '시네마틱' | '리얼' | '애니메이션' | '판타지' | '한국화' | '서양화' | '팝업' | '포스터';

export type LayoutFrame = 
  | 'None' 
  | 'FullGold' 
  | 'OrnateAntique' 
  | 'ModernMinimal' 
  | 'DeepWood' 
  | 'CyberNeon' 
  | 'RoyalSignature' 
  | 'GalleryEdge';

export type TextFrame = 'None' | 'Bracket' | 'Glass' | 'Underline' | 'DoubleLine' | 'SoftGlow' | 'VerticalBar';

export type ImageStyle = 'Everyday' | 'Anime' | 'Realistic' | 'Artistic' | 'Futuristic';

export interface QuoteOption {
  text: string;
  author: string;
}

export interface GeneratedContent {
  target?: string;
  situation?: string;
  sender: string;
  mainMessage: string;
  alternativeMessage: string;
  wiseSayingOptions: QuoteOption[];
  bgTheme: string;
  recommendedSeason: string;
}
