import React from "react";
import { FiFileText, FiClock } from "react-icons/fi";
import type { News } from "../../types";
import { getFullImageUrl } from "../../utils/url";

interface NewsHighlightProps {
  article: News;
  onClick: () => void;
  index: number;
}

export const NewsHighlight: React.FC<NewsHighlightProps> = ({
  article,
  onClick,
  index,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative card overflow-hidden bg-slate-900 border-white/5 card-hover cursor-pointer animate-in fade-in zoom-in-95 duration-700 animate-stagger-${index + 1}`}
    >
      <div className="aspect-video w-full overflow-hidden relative">
        {article.image_url ? (
          <img
            src={getFullImageUrl(article.image_url)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
            alt={article.title}
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <FiFileText size={40} className="text-slate-700" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-6 relative">
        <h4 className="text-lg font-black text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
          {article.title}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
          {article.content}
        </p>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase">
          <FiClock /> {new Date(article.created_at || "").toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
