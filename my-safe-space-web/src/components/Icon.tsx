import {
  BookOpen,
  BarChart3,
  Heart,
  Headphones,
  MessageCircle,
  MessageSquareHeart,
  ShieldCheck,
  Stethoscope,
  Settings,
  Phone,
  User,
  LogOut,
  Home,
  X,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Paperclip,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Clock,
  MapPin,
  Send,
  Smile,
  Lock,
  Eye,
  EyeOff,
  ImagePlus,
  Play,
  Pause,
  Volume2,
  Search,
  ExternalLink,
  Camera,
  UserRound,
  Award,
  HeartHandshake,
  Trash2,
  Menu,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type IconName =
  | 'book'
  | 'chart'
  | 'heart'
  | 'headphones'
  | 'message'
  | 'message-heart'
  | 'shield'
  | 'stethoscope'
  | 'settings'
  | 'phone'
  | 'user'
  | 'logout'
  | 'home'
  | 'x'
  | 'chevron-left'
  | 'chevron-right'
  | 'pencil'
  | 'paperclip'
  | 'sparkles'
  | 'info'
  | 'check'
  | 'alert'
  | 'mail'
  | 'clock'
  | 'map-pin'
  | 'send'
  | 'smile'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'image'
  | 'play'
  | 'pause'
  | 'volume'
  | 'search'
  | 'external'
  | 'camera'
  | 'user-round'
  | 'award'
  | 'hands'
  | 'trash'
  | 'menu';

const ICONS: Record<IconName, LucideIcon> = {
  book: BookOpen,
  chart: BarChart3,
  heart: Heart,
  headphones: Headphones,
  message: MessageCircle,
  'message-heart': MessageSquareHeart,
  shield: ShieldCheck,
  stethoscope: Stethoscope,
  settings: Settings,
  phone: Phone,
  user: User,
  logout: LogOut,
  home: Home,
  x: X,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  pencil: Pencil,
  paperclip: Paperclip,
  sparkles: Sparkles,
  info: Info,
  check: CheckCircle2,
  alert: AlertTriangle,
  mail: Mail,
  clock: Clock,
  'map-pin': MapPin,
  send: Send,
  smile: Smile,
  lock: Lock,
  eye: Eye,
  'eye-off': EyeOff,
  image: ImagePlus,
  play: Play,
  pause: Pause,
  volume: Volume2,
  search: Search,
  external: ExternalLink,
  camera: Camera,
  'user-round': UserRound,
  award: Award,
  hands: HeartHandshake,
  trash: Trash2,
  menu: Menu,
};

interface IconProps {
  name: IconName;
  className?: string;
  size?: number | string;
  strokeWidth?: number;
}

export function Icon({ name, className, size = 20, strokeWidth = 2 }: IconProps) {
  const Cmp = ICONS[name];
  return <Cmp className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

/** โลโก้นกฮูก SVG สไตล์ Duolingo (มาแทน 🦉) */
export function OwlLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#58cc02" />
      <ellipse cx="20" cy="23" rx="9.5" ry="9" fill="#ffffff" />
      <ellipse cx="20" cy="22" rx="7" ry="6.2" fill="#58cc02" />
      <circle cx="20" cy="21.5" r="5.2" fill="#ffffff" />
      <circle cx="20" cy="22" r="2.6" fill="#100f3e" />
      <circle cx="20" cy="21" r="0.9" fill="#ffffff" />
      <path d="M13 13.5 Q16 10.5 19 13 L18.6 14.5 Q16 12.6 13.4 15 Z" fill="#58a700" />
      <path d="M27 13.5 Q24 10.5 21 13 L21.4 14.5 Q24 12.6 26.6 15 Z" fill="#58a700" />
      <path d="M14 24.5 Q14 29 20 29 Q26 29 26 24.5 Q26 26.5 20 26.5 Q14 26.5 14 24.5 Z" fill="#ff9600" />
    </svg>
  );
}

/** โลโก้บ้าน — ใช้แทน 🏠 ในคำโปรย/header */
export function HomeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#58cc02" />
      <path d="M20 9 L31 18.5 V30 a1.5 1.5 0 0 1 -1.5 1.5 H25.5 V22.5 h-11 V31.5 H10.5 A1.5 1.5 0 0 1 9 30 V18.5 Z" fill="#ffffff" />
      <circle cx="20" cy="17" r="1.6" fill="#58cc02" />
    </svg>
  );
}
