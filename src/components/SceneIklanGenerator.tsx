// --- FUNGSI PEMBANTU ---
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // Fungsi untuk mengambil satu kunci acak setiap kali dipanggil
    const getRandomApiKey = () => {
        const validKeys = apiKeys.filter(k => k.trim().length > 10);
        if (validKeys.length === 0) return null;
        return validKeys[Math.floor(Math.random() * validKeys.length)];
    };

    const handleGenerate = async () => {
        if (!productDesc && !uploadedFiles.product) return alert("Isi deskripsi atau unggah foto produk!");
        
        setLoading(true);
        setResults(null);

        try {
            // 1. BUAT KONSEP & NASKAH (Gunakan 1 key acak)
            const planKey = getRandomApiKey();
            if (!planKey) return setShowApiModal(true);
            
            setLoadingMsg("AI sedang menyusun naskah...");
            const planPrompt = `Anda sutradara AI. Buat konsep iklan untuk produk ini. Gaya: ${selectedStyle}. Buat TEPAT ${selectedSceneCount} adegan. Output JSON: {"script": "naskah lengkap", "prompts": ["deskripsi visual adegan 1", "adegan 2", "..."]}`;
            
            const parts = [{ text: planPrompt }];
            if (productDesc) parts.push({ text: `Deskripsi: ${productDesc}` });
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
                // AMBIL KEY BARU UNTUK SETIAP GAMBAR (ROTASI)
                const currentKey = getRandomApiKey();
                setLoadingMsg(`Adegan ${i + 1}/${selectedSceneCount}: Menggunakan Key Cadangan...`);

                const imgRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-image-preview:generateContent?key=${currentKey}`, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        contents: [{ parts: [{ text: `${plan.prompts[i]}, ultra-realistic, cinematic lighting, 9:16 vertical` }] }],
                        generationConfig: { responseModalities: ["IMAGE"] }
                    })
                });

                // Jika kena limit meski sudah rotasi, tunggu lebih lama
                if (imgRes.status === 429) {
                    setLoadingMsg("Semua Key sedang sibuk. Menunggu 10 detik...");
                    await delay(10000);
                    i--; // Ulangi adegan yang sama
                    continue;
                }

                const imgData = await imgRes.json();
                const base64 = imgData.candidates[0].content.parts.find(p => p.inlineData).inlineData.data;
                images.push(`data:image/png;base64,${base64}`);

                // JEDA 5 DETIK WAJIB SETIAP SELESAI GAMBAR
                if (i < plan.prompts.length - 1) {
                    setLoadingMsg(`Berhasil! Jeda 5 detik agar API tidak panas...`);
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
