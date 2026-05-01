"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({
  initial,
  asLink = false,
}: {
  initial?: string;
  asLink?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");

  if (asLink) {
    return (
      <Link
        href="/search"
        className="flex h-12 w-full items-center gap-2 rounded-2xl bg-ink-100 px-4 text-[14px] text-ink-500"
      >
        <Search size={18} />
        <span>Поиск по товарам</span>
      </Link>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
      className="flex h-12 w-full items-center gap-2 rounded-2xl bg-ink-100 px-4 text-[14px] text-ink-700 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-200"
    >
      <Search size={18} className="text-ink-500" />
      <input
        autoFocus={!initial}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Поиск по товарам"
        className="flex-1 bg-transparent outline-none placeholder:text-ink-500"
      />
    </form>
  );
}
