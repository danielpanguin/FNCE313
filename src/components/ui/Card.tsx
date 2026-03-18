"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = "", title }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {title && <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{title}</h2>}
      {children}
    </div>
  );
}
