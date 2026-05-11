import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Star, Link as LinkIcon } from 'lucide-react';

export interface InternalLink {
  id: string;
  anchor: string;
  url: string;
  active: boolean;
  starred: boolean;
}

interface Props {
  links: InternalLink[];
  setLinks: (links: InternalLink[]) => void;
}

export default function InternalLinkLibrary({ links, setLinks }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddLink = () => {
    const newLink: InternalLink = {
      id: Math.random().toString(36).substring(2, 9),
      anchor: '',
      url: '',
      active: true,
      starred: false,
    };
    setLinks([newLink, ...links]);
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const handleChange = (id: string, field: keyof InternalLink, value: any) => {
    setLinks(links.map(link => link.id === id ? { ...link, [field]: value } : link));
  };

  const filteredLinks = links.filter(link => 
    link.anchor.toLowerCase().includes(searchQuery.toLowerCase()) || 
    link.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">内链库 (Internal Link Library)</h2>
          </div>
          <p className="text-sm text-slate-500">
            管理用于自动插入的站内链接。系统将在生成文案时自动匹配并插入这些链接。
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索锚文本或URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleAddLink}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> 添加内链
          </button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[280px] border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-medium sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
            <tr>
              <th className="px-4 py-3 w-16 text-center">收藏</th>
              <th className="px-4 py-3 w-24">Status</th>
              <th className="px-4 py-3 w-1/4">Anchor Text *</th>
              <th className="px-4 py-3 w-1/3">URL *</th>
              <th className="px-4 py-3 w-16 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLinks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  暂无内链，点击右上角添加
                </td>
              </tr>
            ) : (
              filteredLinks.map(link => (
                <tr key={link.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleChange(link.id, 'starred', !link.starred)}
                      className="focus:outline-none"
                    >
                      <Star className={`w-5 h-5 ${link.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleChange(link.id, 'active', !link.active)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${link.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {link.active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={link.anchor}
                      onChange={(e) => handleChange(link.id, 'anchor', e.target.value)}
                      placeholder="例如: video editor"
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => handleChange(link.id, 'url', e.target.value)}
                      placeholder="例如: https://..."
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all text-indigo-600"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemoveLink(link.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
