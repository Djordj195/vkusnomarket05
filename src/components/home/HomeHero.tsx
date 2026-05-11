"use client";

import Link from "next/link";
import { Pizza, ShoppingBasket, Pill, SprayCan } from "lucide-react";

import { BrandPill } from "@/components/layout/Logo";
import type { Vertical } from "@/lib/types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1080&q=80";

type VerticalTile = {
  vertical: Vertical;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  gradient: string;
};

const VERTICALS: VerticalTile[] = [
  {
    vertical: "food",
    label: "Готовая еда",
    hint: "Кафе, рестораны, доставка блюд",
    icon: Pizza,
    gradient: "from-amber-500/30 to-rose-500/30",
  },
  {
    vertical: "grocery",
    label: "Продукты",
    hint: "Овощи, фрукты, мясо, выпечка",
    icon: ShoppingBasket,
    gradient: "from-emerald-500/30 to-lime-500/30",
  },
  {
    vertical: "pharmacy",
    label: "Аптека",
    hint: "OTC-препараты и БАДы",
    icon: Pill,
    gradient: "from-sky-500/30 to-cyan-400/30",
  },
  {
    vertical: "chemistry",
    label: "Бытовая химия",
    hint: "Уборка, гигиена, для дома",
    icon: SprayCan,
    gradient: "from-violet-500/30 to-fuchsia-500/30",
  },
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
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/55 to-black/75"
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

        <div className="mt-4 mb-1">
          <h1 className="text-[20px] font-extrabold leading-tight text-white drop-shadow-sm">
            ВКУСНОМАРКЕТ
          </h1>
          <p className="text-[12px] font-medium leading-tight text-white/80">
            Еда. Продукты. Аптека. Дом — в одном приложении
          </p>
        </div>

        <div className="mt-3 mb-5 grid grid-cols-2 gap-2.5">
          {VERTICALS.map((t) => (
            <VerticalHeroTile key={t.vertical} tile={t} />
          ))}
        </div>
      </div>
    </header>
  );
}

function VerticalHeroTile({ tile }: { tile: VerticalTile }) {
  const Icon = tile.icon;
  return (
    <Link
      href={`/vertical/${tile.vertical}`}
      className={`glass-tile relative flex h-[104px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${tile.gradient} p-3 text-white transition active:scale-[0.98]`}
    >
      <Icon size={26} strokeWidth={2} />
      <div className="leading-tight">
        <div className="text-[15px] font-bold">{tile.label}</div>
        <div className="mt-0.5 text-[11px] font-medium text-white/85 line-clamp-1">
          {tile.hint}
        </div>
      </div>
    </Link>
  );
}
