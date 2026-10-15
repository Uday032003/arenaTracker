import React from 'react';
import {
  Activity,
  Footprints,
  Bike,
  Phone,
  Utensils,
  BookOpen,
  Dumbbell,
  ShoppingBag,
  Coffee,
  Heart,
  Car,
  Plane,
  Film,
  Music,
  MapPin,
  Clock,
  Tag,
  Folder,
  Calendar,
  Sparkles,
  IndianRupee,
  Wallet,
  HandCoins,
} from 'lucide-react';

const iconMap = {
  activity: Activity,
  footprints: Footprints,
  walk: Footprints,
  bike: Bike,
  ride: Bike,
  phone: Phone,
  call: Phone,
  food: Utensils,
  utensils: Utensils,
  chocolate: Utensils,
  study: BookOpen,
  book: BookOpen,
  workout: Dumbbell,
  dumbbell: Dumbbell,
  shopping: ShoppingBag,
  coffee: Coffee,
  heart: Heart,
  car: Car,
  trip: Car,
  plane: Plane,
  movie: Film,
  film: Film,
  music: Music,
  pin: MapPin,
  clock: Clock,
  tag: Tag,
  folder: Folder,
  calendar: Calendar,
  sparkles: Sparkles,
  wallet: Wallet,
  money: IndianRupee,
  rupee: IndianRupee,
  receivable: HandCoins,
  handcoins: HandCoins,
};

export function TrackingIcon({ name = 'activity', size = 18, color, className = '' }) {
  const normalized = (name || 'activity').toLowerCase().trim();
  const IconComponent = iconMap[normalized] || Activity;

  return React.createElement(IconComponent, {
    size,
    color,
    className,
  });
}
