// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Loader2, Key, X, Upload, CheckCircle2, Video, ImageIcon, Copy, Download } from 'lucide-react';

// BARIS INI YANG MEMBUAT DEPLOY BERHASIL (EXPORT DEFAULT)
export default function SceneIklanGenerator({ onBack }) {
    const [selectedStyle, setSelectedStyle] = useState('story-telling');
    const [selectedSceneCount, setSelectedSceneCount] = useState(5);
    const [modelMode, setModelMode] = useState('upload'); 
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [results, setResults] = useState(null);

    const [productDesc, setProductDesc] = useState('');
    const [modelAIDesc, setModelAIDesc] = useState('');
    const [sellingType, setSellingType] = useState('soft-selling');
    const [uploadedFiles, setUploadedFiles] = useState({ product: null, background: null, model: null });

    const [apiKeys, setApiKeys] = useState(() => {
        const saved = localStorage.getItem('pabrik_api_pool');
        return saved ? JSON.parse(saved) : ["", "", "", "", ""];
    });
    const [showApiModal, setShowApiModal] = useState(false);

    useEffect(() => {
        localStorage.setItem('pabrik_api_pool', JSON.stringify(apiKeys));
    }, [apiKeys]);

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const getRandomApiKey = () => {
        const validKeys = apiKeys.filter(k => k && k.trim().length > 10);
        return validKeys.length > 0 ? validKeys[Math.floor(Math.random() * validKeys.length)] : null;
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setUploadedFiles(prev => ({ ...prev, [type]: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        const apiKey = getRandomApiKey();
        if (!apiKey) return setShowApiModal(true);
        if (!productDesc && !uploadedFiles.product) return alert("Mohon isi deskripsi atau unggah foto produk!");

        setLoading(true);
        setResults(null);
        const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

        try {
            setLoadingMsg("AI sedang menyusun naskah...");
            const planPrompt = `Anda sutradara AI. Buat konsep iklan ${sellingType} untuk produk ini. Gaya: ${selectedStyle}. Buat TEPAT ${selectedSceneCount} adegan. Output JSON: {"script": "naskah lengkap", "prompts": ["deskripsi visual adegan 1", "adegan 2", "..."]}`;
            
            const parts = [{ text: planPrompt }];
            if (productDesc) parts.push({ text: `Deskripsi: ${productDesc}` });
            if (uploadedFiles.product) parts.push({ inlineData: { mimeType: "image/png", data: uploadedFiles.product.split(',')[1] } });

            const resPlan = await fetch(`${baseUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } })
            });
            const dataPlan = await resPlan.json();
            const plan = JSON.parse(dataPlan.candidates[0].content.parts[0].text);

            const images = [];
            for (let i = 0; i < plan.prompts.length; i++) {
                const currentKey = getRandomApiKey() || apiKey; // Rotasi Key
                setLoadingMsg(`Membuat Visual Adegan ${i + 1}/${selectedSceneCount}...`);
                
                const imgRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-image-preview:generateContent?key=${currentKey}`, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        contents: [{ parts: [{ text: `${plan.prompts[i]}, ultra-realistic, cinematic lighting, 9:16 vertical` }] }],
                        generationConfig: { responseModalities: ["IMAGE"] }
                    })
                });
                
                if (imgRes.status === 429) {
                    setLoadingMsg("Limit RPM! Menunggu 10 detik...");
                    await delay(10000);
                    i--; continue;
                }

                const imgData = await imgRes.json();
                const base64 = imgData.candidates[0].content.parts.find(p => p.inlineData).inlineData.data;
                images.push(`data:image/png;base64,${base64}`);

                if (i < plan.prompts.length - 1) {
                    setLoadingMsg(`Jeda 5 detik agar API tidak panas...`);
                    await delay(5000); 
                }
            }

            setResults({ script: plan.script, images, prompts: plan.prompts });
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
            setLoadingMsg('');
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-gray-900 p-4 md:p-8 font-sans">
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
                <button onClick={onBack} className="text-gray-500 hover:text-purple-600 flex items-center gap-2 font-medium transition-all">
                    <ArrowLeft size={20}/> Kembali
                </button>
                <h1 className="text-2xl md:text-3xl font-bold">Video Grok <span className="text-purple-600">Generator</span></h1>
                <button onClick={() => setShowApiModal(true)} className="p-2 bg-white border border-gray-300 rounded-full text-amber-500 shadow-sm transition-all">
                    <Key size={20}/>
                </button>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-2 custom-scrollbar">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-4 capitalize">Langkah 1: Pilih Gaya</h2>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {['story-telling', 'promosi-produk'].map(style => (
                                <button key={style} onClick={() => setSelectedStyle(style)} className={`p-4 rounded-xl border-2 transition-all text-sm font-bold capitalize ${selectedStyle === style ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-100 bg-white'}`}>{style.replace('-', ' ')}</button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {[5, 8, 10].map(count => (
                                <button key={count} onClick={() => setSelectedSceneCount(count)} className={`flex-1 py-3 rounded-lg border text-sm font-bold ${selectedSceneCount === count ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-600'}`}>{count} Scene</button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-6 capitalize">Langkah 2: Detail Konten</h2>
                        <div className="space-y-6">
                            <div className="pl-7 space-y-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase">Produk & Background</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative border-2 border-dashed rounded-xl p-3 text-center group hover:bg-purple-50 transition-all">
                                        <input type="file" onChange={(e) => handleFileChange(e, 'product')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {uploadedFiles.product ? <CheckCircle2 className="mx-auto text-green-500" size={20}/> : <Upload className="mx-auto text-gray-400" size={20}/>}
                                        <p className="text-[9px] mt-1 text-gray-500">Produk</p>
                                    </div>
                                    <div className="relative border-2 border-dashed rounded-xl p-3 text-center group hover:bg-purple-50 transition-all">
                                        <input type="file" onChange={(e) => handleFileChange(e, 'background')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {uploadedFiles.background ? <CheckCircle2 className="mx-auto text-green-500" size={20}/> : <Upload className="mx-auto text-gray-400" size={20}/>}
                                        <p className="text-[9px] mt-1 text-gray-500">Background</p>
                                    </div>
                                </div>
                                <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs h-20 outline-none" placeholder="Deskripsi produk..."/>
                            </div>
                        </div>

                        <button onClick={handleGenerate} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl mt-8 shadow-lg shadow-purple-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                            {loading ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20} fill="currentColor"/>} GENERATE KONTEN
                        </button>
                    </section>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200 h-[85vh] flex flex-col">
                    <h2 className="text-xl font-bold mb-6 border-l-4 border-purple-600 pl-4">Visual Storyboard</h2>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                        {!results ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center text-sm italic">
                                <ImageIcon size={64} className="mb-4"/> Visual akan muncul di sini.
                            </div>
                        ) : (
                            results.images.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <img src={img} className="w-full aspect-[9/16] object-cover rounded-2xl border border-gray-100 shadow-sm" alt="Scene"/>
                                    <div className="absolute top-3 left-3 bg-purple-600 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-lg">ADEGAN {idx+1}</div>
                                    <a href={img} download={`scene-${idx+1}.png`} className="absolute bottom-3 right-3 p-2 bg-white rounded-full text-purple-600 shadow-md opacity-0 group-hover:opacity-100 transition-all"><Download size={14}/></a>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200 h-[85vh] flex flex-col">
                    <h2 className="text-xl font-bold mb-6 border-l-4 border-purple-600 pl-4">Script & Export</h2>
                    {!results ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center text-sm italic">
                            <Video size={64} className="mb-4"/> Naskah akan muncul di sini.
                        </div>
                    ) : (
                        <div className="space-y-4 h-full flex flex-col">
                            <textarea className="flex-1 w-full bg-purple-50/50 border border-purple-100 rounded-2xl p-4 text-xs leading-relaxed outline-none" value={results.script} readOnly />
                            <button onClick={() => navigator.clipboard.writeText(results.script)} className="w-full bg-gray-100 py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-gray-200"><Copy size={12}/> COPY NASKAH</button>
                            <a href="https://grok.com" target="_blank" rel="noreferrer" className="w-full bg-blue-600 text-white py-4 rounded-xl text-xs font-bold text-center shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">BUKA GROK (X.AI)</a>
                        </div>
                    )}
                </div>
            </main>

            {showApiModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl">
                        <button onClick={() => setShowApiModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X/></button>
                        <h2 className="text-xl font-bold text-center mb-6 uppercase tracking-tighter">API KEY <span className="text-amber-500">POOL</span></h2>
                        <div className="space-y-3">
                            {apiKeys.map((key, idx) => (
                                <input key={idx} type="password" value={key} onChange={e => { const nk = [...apiKeys]; nk[idx] = e.target.value; setApiKeys(nk); }} placeholder={`Gemini Key #${idx + 1}`} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs focus:ring-2 focus:ring-amber-500 outline-none" />
                            ))}
                        </div>
                        <button onClick={() => setShowApiModal(false)} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl mt-6 shadow-xl active:scale-95 transition-all">SIMPAN KONFIGURASI</button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4"/>
                        <p className="text-lg font-bold text-gray-900 tracking-tight uppercase">{loadingMsg}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
