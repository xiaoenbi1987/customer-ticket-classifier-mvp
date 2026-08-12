"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  function toggle() {
    setLanguage(language === "zh" ? "en" : "zh");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white py-1 pl-3 pr-1 text-sm text-slate-600 shadow-sm transition-colors hover:border-slate-400"
    >
      <span>{language === "zh" ? "语言" : "Language"}</span>
      <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
        {language === "zh" ? "EN" : "中文"}
      </span>
    </button>
  );
}
