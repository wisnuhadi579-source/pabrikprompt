// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Loader2, Key, X, Upload, CheckCircle2, Video, ImageIcon, Plus } from 'lucide-react';

export default function SceneIklanGenerator({ onBack }) {
    // --- STATE UTAMA ---
    const [selectedStyle, setSelectedStyle] = useState('story-telling');
    const [selectedSceneCount, setSelectedSceneCount] = useState(5);
    const [modelMode, setModelMode] = useState('upload'); // 'upload' atau 'generate'
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    // --- STATE INPUT (SELENGKAP ASLINYA) ---
    const [productDesc, setProductDesc] = useState('');
    const [modelAIDesc, setModelAIDesc] = useState('');
    const [sellingType, setSellingType] = useState('soft-selling');
    const [uploadedFiles, setUploadedFiles] = useState({
        product: null,
        background: null,
        model: null
    });

    // --- API POOL SYSTEM ---
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
        return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : "MASUKKAN_KEY_ANDA";
    };

    // --- HANDLER UPLOAD ---
    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedFiles(prev => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-gray-900 p-4 md:p-8 font-sans">
            {/* Header */}
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
                <button onClick={onBack} className="text-gray-500 hover:text-purple-600 flex items-center gap-2 font-medium transition-all">
                    <ArrowLeft size={20}/> Kembali
                </button>
                <h1 className="text-2xl md:text-3xl font-bold">Video Grok <span className="text-purple-600">Generator</span></h1>
                <button onClick={() => setShowApiModal(true)} className="p-2 bg-white border border-gray-300 rounded-full text-amber-500 shadow-sm hover:scale-110 transition-all">
                    <Key size={20}/>
                </button>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* KOLOM 1: INPUT LENGKAP (Langkah 1 & 2) */}
                <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-2 custom-scrollbar">
                    
                    {/* Langkah 1: Pilih Gaya */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-1">Langkah 1: Pilih Gaya Konten</h2>
                        <p className="text-xs text-gray-500 mb-5">Pilih template untuk alur cerita visual.</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {['story-telling', 'promosi-produk'].map(style => (
                                <button 
                                    key={style}
                                    onClick={() => setSelectedStyle(style)}
                                    className={`p-4 rounded-xl border-2 transition-all text-sm font-bold capitalize ${selectedStyle === style ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-100 bg-white hover:border-purple-200'}`}
                                >
                                    {style.replace('-', ' ')}
                                </button>
                            ))}
                        </div>

                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Durasi Video (Scene):</h3>
                        <div className="flex gap-2">
                            {[5, 8, 10].map(count => (
                                <button 
                                    key={count}
                                    onClick={() => setSelectedSceneCount(count)}
                                    className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all ${selectedSceneCount === count ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                >
                                    {count} <span className="block text-[10px] font-normal opacity-80">~{count * 6} Detik</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Langkah 2: Detail Konten (SESUAI ASLINYA) */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-6">Langkah 2: Detail Konten</h2>
                        
                        <div className="space-y-6">
                            {/* 1. Produk Utama */}
                            <div>
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                                    <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span> Produk Utama
                                </h3>
                                <div className="pl-7 space-y-4">
                                    <label className="block text-xs text-gray-600 font-medium">Foto Produk Utama<span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <input type="file" onChange={(e) => handleFileChange(e, 'product')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center group-hover:border-purple-500 group-hover:bg-purple-50 transition-all">
                                            {uploadedFiles.product ? <CheckCircle2 className="mx-auto text-green-500 mb-1" size={24}/> : <Upload className="mx-auto text-gray-400 mb-1" size={24}/>}
                                            <p className="text-[10px] text-gray-500">{uploadedFiles.product ? "File Berhasil Diunggah" : "Klik untuk Upload File"}</p>
                                        </div>
                                    </div>
                                    <label className="block text-xs text-gray-600 font-medium mt-4">Upload Background<span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <input type="file" onChange={(e) => handleFileChange(e, 'background')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center group-hover:border-purple-500 group-hover:bg-purple-50 transition-all">
                                            {uploadedFiles.background ? <CheckCircle2 className="mx-auto text-green-500 mb-1" size={24}/> : <Upload className="mx-auto text-gray-400 mb-1" size={24}/>}
                                            <p className="text-[10px] text-gray-500">{uploadedFiles.background ? "Background Siap" : "Klik untuk Upload Background"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Model */}
                            <div>
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                                    <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span> Model
                                </h3>
                                <div className="pl-7">
                                    <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                                        <button onClick={() => setModelMode('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modelMode === 'upload' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500'}`}>Upload Foto</button>
                                        <button onClick={() => setModelMode('generate')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modelMode === 'generate' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500'}`}>Generator AI</button>
                                    </div>
                                    
                                    {modelMode === 'upload' ? (
                                        <div className="relative group">
                                            <input type="file" onChange={(e) => handleFileChange(e, 'model')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center group-hover:border-purple-500 group-hover:bg-purple-50 transition-all">
                                                {uploadedFiles.model ? <CheckCircle2 className="mx-auto text-green-500 mb-1" size={24}/> : <Upload className="mx-auto text-gray-400 mb-1" size={24}/>}
                                                <p className="text-[10px] text-gray-500">Upload Foto Model</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <textarea 
                                            value={modelAIDesc}
                                            onChange={(e) => setModelAIDesc(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-purple-500 h-24"
                                            placeholder="Cth: Wanita Asia usia 20an, rambut hitam panjang, make up natural..."
                                        />
                                    )}
                                </div>
                            </div>

                            {/* 3. Pengaturan Iklan */}
                            <div>
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                                    <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span> Pengaturan Iklan
                                </h3>
                                <div className="pl-7 space-y-4">
                                    <label className="block text-xs text-gray-600 font-medium">Rasio Video</label>
                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                                        <span className="text-sm font-bold text-purple-700">9:16</span>
                                        <span className="text-[10px] text-purple-500 font-bold uppercase">TikTok/Reels/Shorts</span>
                                    </div>
                                    <label className="block text-xs text-gray-600 font-medium mt-4">Tipe Konten (Selling)</label>
                                    <select 
                                        value={sellingType}
                                        onChange={(e) => setSellingType(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="soft-selling">Soft Selling (Edukasi/Halus)</option>
                                        <option value="hard-selling">Hard Selling (Promo Langsung)</option>
                                        <option value="story-selling">Story Selling (Bercerita)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button 
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl mt-10 shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20} fill="currentColor"/>} GENERATE KONTEN
                        </button>
                    </section>
                </div>

                {/* KOLOM 2: VISUAL STORYBOARD */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200 h-[85vh] flex flex-col">
                    <h2 className="text-xl font-bold mb-6 border-l-4 border-purple-600 pl-4">Visual Storyboard</h2>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar flex flex-col items-center justify-center opacity-30 italic text-center">
                        <ImageIcon size={64}/>
                        <p className="text-sm mt-4">Gambar visual iklan akan muncul di sini.</p>
                    </div>
                </div>

                {/* KOLOM 3: SCRIPT & AUDIO */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200 h-[85vh] flex flex-col">
                    <h2 className="text-xl font-bold mb-6 border-l-4 border-purple-600 pl-4">Script & Audio</h2>
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic text-center">
                        <Video size={64}/>
                        <p className="text-sm mt-4">Teks naskah dan suara narator akan muncul di sini.</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-bold mb-4">Generate Video</h3>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 transition-all">
                            Buka Grok (X.ai)
                        </button>
                    </div>
                </div>
            </main>

            {/* API MODAL */}
            {showApiModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl">
                        <button onClick={() => setShowApiModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X/></button>
                        <h2 className="text-xl font-bold text-center mb-8 uppercase tracking-tighter">API KEY <span className="text-amber-500">POOL</span></h2>
                        <div className="space-y-3">
                            {apiKeys.map((key, idx) => (
                                <input 
                                    key={idx} type="password" value={key} 
                                    onChange={e => { const nk = [...apiKeys]; nk[idx] = e.target.value; setApiKeys(nk); }} 
                                    placeholder={`Gemini API Key #${idx + 1}`}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            ))}
                        </div>
                        <button onClick={() => setShowApiModal(false)} className="w-full bg-gray-900 text-white font-bold py-5 rounded-2xl mt-8 shadow-xl">SIMPAN KONFIGURASI</button>
                    </div>
                </div>
            )}
        </div>
    );
}
