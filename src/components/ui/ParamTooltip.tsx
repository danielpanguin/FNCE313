export default function ParamTooltip({ text }: { text: string }) {
  return (
    <span className="relative group ml-2 cursor-help inline-flex items-center">
      <span className="text-[10px] font-bold text-gray-900 bg-white border border-gray-900 group-hover:bg-gray-100 rounded-full w-4 h-4 inline-flex items-center justify-center leading-none transition-colors select-none">?</span>
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-56 bg-gray-900 text-white text-[11px] leading-relaxed rounded-xl px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}
