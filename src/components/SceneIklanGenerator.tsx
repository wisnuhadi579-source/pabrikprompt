// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Loader2, Key, X, Upload, CheckCircle2, Video, ImageIcon, Copy, Download } from 'lucide-react';

// PASTIKAN ADA KATA 'export default' DI DEPAN FUNGSI INI
export default function SceneIklanGenerator({ onBack }) {
    // --- STATE INTERNAL (Pastikan state ini sudah ada di dalam fungsi) ---
    const [selectedStyle, setSelectedStyle] = useState('story-telling');
    const [selectedSceneCount, setSelectedSceneCount] = useState(5);
    const [modelMode, setModelMode] = useState('upload'); 
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [results, setResults] = useState(null);
    const [productDesc, setProductDesc] = useState('');
    const [sellingType, setSellingType] = useState('soft-selling');
    const [uploadedFiles, setUploadedFiles] = useState({ product: null, background: null, model: null });
    const [showApiModal, setShowApiModal] = useState(false);

    // API POOL STATE
    const [apiKeys, setApiKeys] = useState(() => {
        const saved = localStorage.getItem('pabrik_api_pool');
        return saved ? JSON.parse(saved) : ["", "", "", "", ""];
    });

    useEffect(() => {
        localStorage.setItem('pabrik_api_pool', JSON.stringify(apiKeys));
    }, [apiKeys]);

    // --- FUNGSI PEMBANTU (HELPERS) ---
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const getRandomApiKey = () => {
        const validKeys = apiKeys.filter(k => k && k.trim().length > 10);
        if (validKeys.length === 0) return null;
        return validKeys[Math.floor(Math.random() * validKeys.length)];
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setUploadedFiles(prev => ({ ...prev, [type]: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    // --- LOGIKA GENERATE UTAMA ---
    const handleGenerate = async () => {
        if (!productDesc && !uploadedFiles.product) return alert("Isi deskripsi atau unggah foto produk!");
        
        setLoading(true);
        setResults(null);

        try {
            // 1. BUAT KONSEP & NASKAH (Rotasi Key)
            const planKey = getRandomApiKey();
            if (!planKey) {
                setLoading(false);
                return setShowApiModal(true);
            }
            
            setLoadingMsg("AI sedang menyusun naskah...");
            const planPrompt = `Anda sutradara AI. Produk: "${productDesc}". Gaya: ${selectedStyle}. Tipe: ${sellingType}. Buat TEPAT ${selectedSceneCount} adegan. Output JSON: {"script": "naskah lengkap", "prompts": ["deskripsi visual adegan 1", "adegan 2", "..."]}`;
            
            const parts = [{ text: planPrompt }];
            if (uploadedFiles.product) parts.push({ inlineData: { mimeType: "image/png", data: uploadedFiles.product.split(',')[1] } });

            const resPlan = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${planKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } })
            });
            const dataPlan = await resPlan.json();
            const plan = JSON.parse(dataPlan.candidates[0].content.parts[0].text);

            // 2. BUAT VISUAL (ROTASI API KEY + JEDA 5 DETIK)
            const images = [];
            for (let i = 0; i < plan.prompts.length; i++) {
                const currentKey = getRandomApiKey();
                setLoadingMsg(`Adegan ${i + 1}/${selectedSceneCount}: Menggunakan Key Cadangan...`);

                const imgRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-image-preview:generateContent?key=${currentKey}`, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        contents: [{ parts: [{ text: `${plan.prompts[i]}, ultra-realistic, cinematic lighting, 9:16 vertical` }] }],
                        generationConfig: { responseModalities: ["IMAGE"] }
                    })
                });

                if (imgRes.status === 429) {
                    setLoadingMsg("Key Terkena Limit! Menunggu 10 detik...");
                    await delay(10000);
                    i--; // Ulangi adegan yang sama
                    continue;
                }

                const imgData = await imgRes.json();
                const base64 = imgData.candidates[0].content.parts.find(p => p.inlineData).inlineData.data;
                images.push(`data:image/png;base64,${base64}`);

                if (i < plan.prompts.length - 1) {
                    setLoadingMsg(`Adegan ${i+1} Selesai. Istirahat 5 detik...`);
                    await delay(5000); 
                }
            }

            setResults({ script: plan.script, images, prompts: plan.prompts });
        } catch (e) {
            alert("Terjadi gangguan: " + e.message);
        } finally {
            setLoading(false);
            setLoadingMsg('');
        }
    };

    // --- BAGIAN RETURN UI (Harus tetap ada agar bisa tampil) ---
    return (
        <div className="min-h-screen bg-[#f3f4f6] p-4 md:p-8">
            {/* Header, Input, Result, dan Modal UI Anda tetap di sini seperti kode sebelumnya */}
            <button onClick={onBack}>Kembali</button>
            <button onClick={handleGenerate}>Generate</button>
            {/* ... rest of your UI code ... */}
        </div>
    );
}
