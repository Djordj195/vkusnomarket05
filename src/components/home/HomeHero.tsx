"use client";

import Link from "next/link";
import { Apple, Pizza, Store, Bike, Search } from "lucide-react";

import { BrandPill } from "@/components/layout/Logo";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1080&q=80";

type Tile = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  big?: boolean;
};

const TOP_TILES: Tile[] = [
  { href: "/section/market", label: "Рынок", icon: Apple, big: true },
  { href: "/section/food", label: "Готовая еда", icon: Pizza, big: true },
];

const BOTTOM_TILES: Tile[] = [
  { href: "/shops", label: "Лавки", icon: Store },
  { href: "/orders", label: "Доставка", icon: Bike },
  { href: "/search", label: "Поиск", icon: Search },
];

type HomeHeroProps = {
  /**
   * Слот для CityPicker — рендерится server-компонентом (страница /),
   * чтобы пробросить текущий город из куки.
   */
  citySlot?: React.ReactNode;
};

export function HomeHero({ citySlot }: HomeHeroProps) {
  return (
    <header className="relative isolate overflow-hidden">
      {/* Background image with food theme */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/45 to-black/65"
        aria-hidden="true"
      />

      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="ВКУСНОМАРКЕТ — на главную"
            className="block"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-ink-900 text-[10px] font-extrabold leading-none text-accent-300 shadow-md shadow-black/30">
              ВМ
            </span>
          </Link>
          <BrandPill />
          {citySlot}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {TOP_TILES.map((t) => (
            <HeroTile key={t.href} tile={t} />
          ))}
        </div>
        <div className="mt-2.5 mb-5 grid grid-cols-3 gap-2.5">
          {BOTTOM_TILES.map((t) => (
            <HeroTile key={t.href} tile={t} />
          ))}
        </div>
      </div>
    </header>
  );
}

function HeroTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  return (
    <Link
      href={tile.href}
      className={`glass-tile relative flex ${
        tile.big ? "h-24 flex-col justify-between" : "h-20 flex-col justify-between"
      } rounded-2xl p-3 text-white transition active:scale-[0.98]`}
    >
      <Icon size={tile.big ? 24 : 20} strokeWidth={2} />
      <span
        className={`font-semibold leading-tight ${
          tile.big ? "text-[15px]" : "text-[13px]"
        }`}
      >
        {tile.label}
      </span>
    </Link>
  );
}
