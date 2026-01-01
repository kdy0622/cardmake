
import { Situation, Target, ImageType, ImageStylePreset, LayoutFrame, TextFrame, QuoteTheme } from './types';

export const SITUATIONS: Situation[] = [
  '자동 추천(절기 반영)', '일반 인사', '목표 달성', '팀 격려', '감사 인사', 
  '월초 인사', '월말 결산', '연말연시', '명절', '계절 인사'
];

export const TARGETS: Target[] = ['비즈니스 파트너', '스폰서', '형제라인', '고객', '업무상 관련인'];
export const QUOTE_THEMES: QuoteTheme[] = ['리더십', '용기', '행동', '위로', '감사', '결단'];

export const IMAGE_TYPES: ImageType[] = ['자연', '우주', '사물', '인물', '건물'];
export const IMAGE_STYLE_PRESETS: ImageStylePreset[] = ['시네마틱', '리얼', '애니메이션', '판타지', '한국화', '서양화', '팝업', '포스터'];

export const LAYOUT_FRAMES: { id: LayoutFrame; name: string }[] = [
  { id: 'None', name: '프레임 없음' },
  { id: 'FullGold', name: '가장자리 골드' },
  { id: 'OrnateAntique', name: '화려한 앤티크' },
  { id: 'ModernMinimal', name: '모던 엣지' },
  { id: 'DeepWood', name: '중후한 원목' },
  { id: 'CyberNeon', name: '네온 글로우' },
  { id: 'RoyalSignature', name: '왕실 문장' },
  { id: 'GalleryEdge', name: '갤러리 화이트' }
];

export const TEXT_FRAMES: { id: TextFrame; name: string }[] = [
  { id: 'None', name: '문구 프레임 없음' },
  { id: 'Bracket', name: '장식형 대괄호' },
  { id: 'Glass', name: '하이엔드 글래스' },
  { id: 'Underline', name: '강조 언더라인' },
  { id: 'DoubleLine', name: '더블 라인' },
  { id: 'SoftGlow', name: '은은한 빛 확산' },
  { id: 'VerticalBar', name: '리더십 수직 바' }
];

export const KOREAN_FONTS = [
  { category: '현대적 고딕(Sans)', name: '프리텐다드', value: "'Noto Sans KR', sans-serif" },
  { category: '현대적 고딕(Sans)', name: '고운돋움', value: "'Gowun Dodum', sans-serif" },
  { category: '현대적 고딕(Sans)', name: '도현체', value: "'Do Hyeon', sans-serif" },
  { category: '우아한 명조(Serif)', name: '함렛', value: "'Hahmlet', serif" },
  { category: '우아한 명조(Serif)', name: '나눔명조', value: "'Nanum Myeongjo', serif" },
  { category: '우아한 명조(Serif)', name: '송명체', value: "'Song Myung', serif" },
  { category: '캘리그라피(Calli)', name: '동해독도', value: "'East Sea Dokdo', cursive" },
  { category: '캘리그라피(Calli)', name: '나눔붓글씨', value: "'Nanum Brush Script', cursive" },
  { category: '캘리그라피(Calli)', name: '연성체', value: "'Yeon Sung', cursive" },
  { category: '디스플레이(Display)', name: '블랙한산스', value: "'Black Han Sans', sans-serif" },
  { category: '디스플레이(Display)', name: '해바라기', value: "'Sunflower', sans-serif" },
  { category: '디스플레이(Display)', name: '주아체', value: "'Jua', sans-serif" },
  { category: '디스플레이(Display)', name: '베이글팻', value: "'Bagel Fat One', system-ui" },
  { category: '손글씨(Hand)', name: '나눔펜', value: "'Nanum Pen Script', cursive" },
  { category: '손글씨(Hand)', name: '가구체', value: "'Gaegu', cursive" }
];

export const ENGLISH_FONTS = [
  { category: 'Luxury', name: 'Cinzel', value: "'Cinzel', serif" },
  { category: 'Luxury', name: 'Playfair Display', value: "'Playfair Display', serif" },
  { category: 'Luxury', name: 'Vidaloka', value: "'Vidaloka', serif" },
  { category: 'Cursive', name: 'Sacramento', value: "'Sacramento', cursive" },
  { category: 'Cursive', name: 'Marck Script', value: "'Marck Script', cursive" },
  { category: 'Modern', name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { category: 'Artistic', name: 'Abril Fatface', value: "'Abril Fatface', serif" }
];
