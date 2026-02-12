// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Zap, Loader2, Image as ImageIcon, Key, X, Copy } from 'lucide-react';

export default function SceneIklanGenerator({ onBack }) {
    // STATE MANDIRI
    const [manualApiKeys, setManualApiKeys] = useState(() => {
        const saved = localStorage.getItem('pabrik_api_pool');
        return saved ? JSON.parse(saved) : ["", "", "", "", ""];
    });
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [productDesc, setProductDesc] = useState('');
    const [generatedScenes, setGeneratedScenes] = useState([]);

    useEffect(() => {
        localStorage.setItem('pabrik_api_pool', JSON.stringify(manualApiKeys));
    }, [manualApiKeys]);

    const getSafeApiKey = () => {
        const validKeys = manualApiKeys.filter(k => k && k.trim().length > 10);
        return validKeys.length > 0 
            ? validKeys[Math.floor(Math.random() * validKeys.length)] 
            : "AIzaSyAS14B20OX6ddFnpFP6rsJD1-W8vs7lE_o";
    };

    const handleGenerate = async () => {
        if (!productDesc) return alert("Isi deskripsi produk!");
        setLoading(true);
        try {
            const apiKey = getSafeApiKey();
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const prompt = `Anda sutradara AI. Produk: "${productDesc}". Buat 5 adegan iklan video. Output JSON: {"scenes": [{"visualPrompt": "string"}]}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });
            const data = await response.json();
            const json = JSON.parse(data.candidates[0].content.parts[0].text);
            setGeneratedScenes(json.scenes);
        } catch (e) {
            alert("Gagal: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 font-sans">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-10 border-b border-[#262626] pb-6">
                <button onClick={onBack} className="text-gray-400 hover:text-[#D4AF37] flex items-center gap-2">
                    <ArrowLeft size={20}/> Kembali
                </button>
                <h1 className="text-2xl font-black uppercase tracking-tighter">SCENE IKLAN <span className="text-[#D4AF37]">GENERATOR</span></h1>
                <button onClick={() => setIsApiModalOpen(true)} className="p-2 bg-[#121212] border border-[#262626] rounded-full text-[#D4AF37]"><Key size={18}/></button>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Panel */}
                <div className="bg-[#121212] border border-[#262626] p-8 rounded-3xl h-fit space-y-6">
                    <h2 className="text-lg font-bold border-l-4 border-[#D4AF37] pl-3">Spesifikasi Konten</h2>
                    <textarea 
                        className="w-full bg-[#0d0d0d] border border-[#262626] rounded-2xl p-4 text-sm focus:border-[#D4AF37] outline-none h-32" 
                        placeholder="Apa produk yang ingin diiklankan?"
                        value={productDesc}
                        onChange={(e) => setProductDesc(e.target.value)}
                    />
                    <button onClick={handleGenerate} disabled={loading} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <Zap size={18} fill="black"/>} PROSES KONTEN
                    </button>
                </div>

                {/* Output Panel */}
                <div className="bg-[#121212] border border-[#262626] p-8 rounded-3xl h-[70vh] flex flex-col">
                    <h2 className="text-lg font-bold border-l-4 border-[#D4AF37] pl-3 mb-6">Storyboard Visual</h2>
                    <div className="overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {generatedScenes.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-20 mt-20"><ImageIcon size={64}/><p className="text-xs mt-4">Menunggu Produksi...</p></div>
                        ) : generatedScenes.map((scene, idx) => (
                            <div key={idx} className="bg-[#0d0d0d] border border-[#262626] p-5 rounded-2xl relative group">
                                <span className="absolute top-3 left-3 bg-[#D4AF37] text-black text-[9px] font-black px-2 py-0.5 rounded-full">ADEGAN {idx + 1}</span>
                                <p className="text-xs text-gray-400 mt-4 leading-relaxed italic">{scene.visualPrompt}</p>
                                <button onClick={() => navigator.clipboard.writeText(scene.visualPrompt)} className="mt-4 w-full bg-[#1A1A1A] py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:text-[#D4AF37] transition-all"><Copy size={12}/> COPY PROMPT</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal API */}
            {isApiModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#121212] border border-[#262626] w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl">
                        <button onClick={() => setIsApiModalOpen(false)} className="absolute top-6 right-6 text-gray-500"><X/></button>
                        <h2 className="text-xl font-black text-white mb-6 uppercase text-center">API Key Pool</h2>
                        <div className="space-y-3">
                            {manualApiKeys.map((key, idx) => (
                                <input 
                                    key={idx} type="password" value={key} 
                                    onChange={e => { const nk = [...manualApiKeys]; nk[idx] = e.target.value; setManualApiKeys(nk); }} 
                                    placeholder={`API Key Gemini #${idx + 1}`}
                                    className="w-full bg-[#050505] border border-[#262626] rounded-xl py-3 px-4 text-xs focus:border-[#D4AF37] outline-none"
                                />
                            ))}
                        </div>
                        <button onClick={() => setIsApiModalOpen(false)} className="w-full bg-[#D4AF37] text-black font-black py-4 rounded-2xl mt-8">SIMPAN & TUTUP</button>
                    </div>
                </div>
            )}
        </div>
    );
}
