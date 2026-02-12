// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, Loader2, Key, X, Copy, Download, Play, Pause, RefreshCw, FileText, Video } from 'lucide-react';

export default function SceneIklanGenerator({ onBack }) {
    // --- STATE MANAGEMENT ---
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [sceneCount, setSceneCount] = useState(5);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [productDesc, setProductDesc] = useState('');
    const [sellingType, setSellingType] = useState('soft-selling');
    const [results, setResults] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // API POOL STATE
    const [apiKeys, setApiKeys] = useState(() => {
        const saved = localStorage.getItem('pabrik_api_pool');
        return saved ? JSON.parse(saved) : ["", "", "", "", ""];
    });
    const [showApiModal, setShowApiModal] = useState(false);

    useEffect(() => {
        localStorage.setItem('pabrik_api_pool', JSON.stringify(apiKeys));
    }, [apiKeys]);

    const getActiveKey = () => {
        const valid = apiKeys.filter(k => k.trim().length > 10);
        return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : "AIzaSy..."; 
    };

    // --- LOGIKA CORE GENERATOR ---
    const handleGenerate = async () => {
        if (!selectedStyle || !productDesc) return alert("Pilih gaya dan isi deskripsi produk!");
        setLoading(true);
        setResults(null);
        
        try {
            const apiKey = getActiveKey();
            const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
            
            // 1. GENERATE PLAN & NASKAH
            setLoadingMsg("Menulis Konsep & Naskah...");
            const planPrompt = `Anda sutradara AI. Produk: "${productDesc}", Gaya: "${selectedStyle}", Tipe: "${sellingType}". Buat TEPAT ${sceneCount} adegan. Output JSON: {"tiktokScript": "teks naskah lengkap", "shotPrompts": ["deskripsi visual detil adegan 1", "adegan 2", "..."]}`;
            
            const planRes = await fetch(`${baseUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: planPrompt }] }], generationConfig: { responseMimeType: "application/json" } })
            });
            const planData = await planRes.json();
            const planJson = JSON.parse(planData.candidates[0].content.parts[0].text);

            // 2. GENERATE IMAGES (Sequential to avoid rate limit)
            const generatedImages = [];
            for(let i=0; i < planJson.shotPrompts.length; i++) {
                setLoadingMsg(`Membuat Visual Adegan ${i+1}/${sceneCount}...`);
                const imgPrompt = `${planJson.shotPrompts[i]}, ultra-realistic, 8k, cinematic lighting, vertical 9:16 aspect ratio`;
                
                const imgRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-image-preview:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    body: JSON.stringify({ contents: [{ parts: [{ text: imgPrompt }] }], generationConfig: { responseModalities: ["IMAGE"] } })
                });
                const imgData = await imgRes.json();
                const base64 = imgData.candidates[0].content.parts.find(p => p.inlineData).inlineData.data;
                generatedImages.push(`data:image/png;base64,${base64}`);
            }

            setResults({
                script: planJson.tiktokScript,
                prompts: planJson.shotPrompts,
                images: generatedImages
            });

        } catch (e) {
            alert("Gagal: " + e.message);
        } finally {
            setLoading(false);
            setLoadingMsg('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4 md:p-8">
            {/* Header Asli Video Grok */}
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
                <button onClick={onBack} className="text-gray-500 hover:text-purple-600 flex items-center gap-2 font-medium">
                    <ArrowLeft size={20}/> Kembali
                </button>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Video Grok <span className="text-purple-600">Generator</span></h1>
                <button onClick={() => setShowApiModal(true)} className="p-2 bg-white border border-gray-300 rounded-full text-amber-500 shadow-sm hover:shadow-md transition-all">
                    <Key size={20}/>
                </button>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* KOLOM 1: INPUT DETAIL (Langkah 1 & 2) */}
                <div className="space-y-6">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs text-bold">1</span> Pilih Gaya
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {['Story Telling', 'Promosi Produk'].map(style => (
                                <button 
                                    key={style}
                                    onClick={() => setSelectedStyle(style)}
                                    className={`p-4 rounded-xl border-2 transition-all text-sm font-semibold ${selectedStyle === style ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white hover:border-purple-300'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Durasi Video</h3>
                            <div className="flex gap-2">
                                {[5, 8, 10].map(count => (
                                    <button 
                                        key={count}
                                        onClick={() => setSceneCount(count)}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-bold ${sceneCount === count ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                    >
                                        {count} Scene
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs text-bold">2</span> Detail Konten
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Deskripsi Produk</label>
                                <textarea 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none h-32"
                                    placeholder="Contoh: Tas sekolah anti air dengan desain astronot..."
                                    value={productDesc}
                                    onChange={(e) => setProductDesc(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tipe Iklan</label>
                                <select 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                                    value={sellingType}
                                    onChange={(e) => setSellingType(e.target.value)}
                                >
                                    <option value="soft-selling">Soft Selling (Edukasi)</option>
                                    <option value="hard-selling">Hard Selling (Promo)</option>
                                    <option value="story-selling">Story Selling (Drama)</option>
                                </select>
                            </div>
                            <button 
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin"/> : <Zap size={18} fill="currentColor"/>} GENERATE KONTEN
                            </button>
                        </div>
                    </section>
                </div>

                {/* KOLOM 2: VISUAL STORYBOARD */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[80vh] flex flex-col">
                    <h2 className="text-lg font-bold mb-6 border-l-4 border-purple-600 pl-3">Visual Storyboard</h2>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                        {!results ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                <Video size={64}/>
                                <p className="text-sm mt-4 italic">Visual adegan akan muncul di sini...</p>
                            </div>
                        ) : (
                            results.images.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="aspect-[9/16] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                        <img src={img} className="w-full h-full object-cover" alt={`Scene ${idx+1}`}/>
                                        <div className="absolute top-4 left-4 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                            ADEGAN {idx+1}
                                        </div>
                                        <a href={img} download={`scene-${idx+1}.png`} className="absolute bottom-4 right-4 p-2 bg-white/90 rounded-full text-purple-600 shadow-md opacity-0 group-hover:opacity-100 transition-all">
                                            <Download size={18}/>
                                        </a>
                                    </div>
                                    <p className="mt-3 text-[11px] text-gray-500 italic leading-tight px-2">{results.prompts[idx]}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* KOLOM 3: SCRIPT & AUDIO */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[80vh] flex flex-col">
                    <h2 className="text-lg font-bold mb-6 border-l-4 border-purple-600 pl-3">Script & Export</h2>
                    {!results ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                            <FileText size={64}/>
                            <p className="text-sm mt-4 italic">Naskah otomatis akan dibuatkan AI...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 flex-1 flex flex-col">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Naskah TikTok / Reels</label>
                                <textarea 
                                    className="w-full h-full min-h-[300px] bg-purple-50/50 border border-purple-100 rounded-2xl p-5 text-sm leading-relaxed text-gray-700 outline-none"
                                    value={results.script}
                                    readOnly
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                                    <Copy size={14}/> COPY NASKAH
                                </button>
                                <button className="p-3 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                                    <Video size={14}/> BUKA GROK
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL API POOL (GOLD KEY SYSTEM) */}
            {showApiModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl border border-gray-100">
                        <button onClick={() => setShowApiModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X/></button>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-inner">
                                <Key size={32}/>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">API KEY <span className="text-amber-500">POOL</span></h2>
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-1">Sistem Anti-Limit Produksi</p>
                        </div>
                        <div className="space-y-3">
                            {apiKeys.map((key, idx) => (
                                <div key={idx} className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-500">#{idx+1}</span>
                                    <input 
                                        type="password" value={key} 
                                        onChange={e => { const nk = [...apiKeys]; nk[idx] = e.target.value; setApiKeys(nk); }} 
                                        placeholder="Masukkan API Key Gemini..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-xs focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowApiModal(false)} className="w-full bg-gray-900 text-white font-bold py-5 rounded-3xl mt-8 hover:bg-black transition-all shadow-xl">
                            SIMPAN KONFIGURASI
                        </button>
                    </div>
                </div>
            )}

            {/* LOADING OVERLAY */}
            {loading && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="relative mb-8">
                            <Loader2 className="w-20 h-20 text-purple-600 animate-spin mx-auto"/>
                            <Zap className="absolute inset-0 m-auto text-purple-600 animate-pulse" size={32}/>
                        </div>
                        <p className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">{loadingMsg}</p>
                        <p className="text-sm text-gray-400 animate-bounce italic">Mohon tunggu, AI sedang bekerja keras untuk Anda...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
