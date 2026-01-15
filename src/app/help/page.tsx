"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Book, ArrowLeft, Shield, Wrench, FileText, ChevronRight, HelpCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { KB_DATA, KBArticle } from "@/lib/data/kbData";

export default function HelpCenter() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

    // Filter Logic
    const filteredArticles = useMemo(() => {
        if (!user) return [];

        return KB_DATA.filter(article => {
            // 1. Role Security Check
            if (article.restrictedTo) {
                if (!article.restrictedTo.includes(user.role)) {
                    return false; // Hidden from this user
                }
            }

            // 2. Search Filter
            const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) ||
                article.content.toLowerCase().includes(search.toLowerCase());

            // 3. Category Filter
            const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [user, search, selectedCategory]);

    const categories = ["All", ...Array.from(new Set(KB_DATA.map(a => a.category).filter(c => {
        // Only show categories relevant to the user
        const articles = KB_DATA.filter(art => art.category === c);
        const hasVisible = articles.some(art => !art.restrictedTo || (user && art.restrictedTo.includes(user.role)));
        return hasVisible;
    })))];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">

            {/* SIDEBAR NAVIGATION */}
            <aside className="w-full md:w-64 bg-gray-800 border-r border-gray-700 p-6 flex flex-col h-auto md:min-h-screen shrink-0">
                <div className="mb-8">
                    <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
                        <ArrowLeft size={16} /> Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Book className="text-blue-500" /> Help Center
                    </h1>
                </div>

                {/* Categories */}
                <nav className="space-y-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setSelectedCategory(cat); setSelectedArticle(null); }}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        >
                            <span className="text-sm font-medium">{cat}</span>
                            {selectedCategory === cat && <ChevronRight size={14} />}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-gray-700">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                        <h4 className="font-bold text-sm mb-1 text-gray-200">Need more help?</h4>
                        <p className="text-xs text-gray-500 mb-3">Contact Tech Support directly.</p>
                        <div className="text-xs bg-black/50 p-2 rounded text-center font-mono text-green-400">
                            PIN: 9999
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Header / Search */}
                <header className="bg-gray-900 border-b border-gray-800 p-6">
                    <div className="relative max-w-2xl mx-auto md:mx-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search knowledgebase..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-12">

                    {/* Article View */}
                    {selectedArticle ? (
                        <div className="max-w-3xl animate-fade-in">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center gap-1"
                            >
                                <ArrowLeft size={14} /> Back to results
                            </button>

                            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300 font-medium">
                                        {selectedArticle.category}
                                    </span>
                                    {selectedArticle.restrictedTo && selectedArticle.restrictedTo.includes('TECH') && (
                                        <span className="px-3 py-1 bg-green-900/30 text-green-400 border border-green-800/50 rounded-full text-xs font-mono flex items-center gap-1">
                                            <Wrench size={10} /> TECH ONLY
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-3xl font-bold mb-8 text-white">{selectedArticle.title}</h1>

                                <div className="prose prose-invert prose-blue max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed font-light">
                                        {selectedArticle.content.trim()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* List View */
                        <div className="max-w-5xl">
                            <h2 className="text-xl font-bold mb-6 text-gray-200">
                                {search ? `Results for "${search}"` : `${selectedCategory} Articles`}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredArticles.length > 0 ? filteredArticles.map(article => (
                                    <button
                                        key={article.id}
                                        onClick={() => setSelectedArticle(article)}
                                        className="bg-gray-800 hover:bg-gray-750 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition text-left group h-full flex flex-col"
                                    >
                                        <div className="mb-4 flex justify-between items-start">
                                            <div className="p-3 bg-gray-900 rounded-lg group-hover:scale-110 transition">
                                                {article.restrictedTo?.includes('TECH') ? (
                                                    <Wrench size={20} className="text-green-500" />
                                                ) : (
                                                    <FileText size={20} className="text-blue-400" />
                                                )}
                                            </div>
                                            {article.restrictedTo?.includes('TECH') && (
                                                <Shield size={16} className="text-green-700" />
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition">{article.title}</h3>
                                        <p className="text-sm text-gray-400 line-clamp-2 mt-auto">
                                            {article.content.slice(0, 100).replace(/[#\*]/g, '')}...
                                        </p>
                                    </button>
                                )) : (
                                    <div className="col-span-full text-center py-12 text-gray-500">
                                        <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>No articles found matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
