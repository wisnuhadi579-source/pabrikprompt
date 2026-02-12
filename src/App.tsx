// @ts-nocheck
import React, { useState } from 'react';
import SceneIklanGenerator from './components/SceneIklanGenerator';

export default function App() {
  const [menu, setMenu] = useState('home');

  if (menu === 'home') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
        <header className="text-center mb-12">
            <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase">
                PABRIK <span className="text-[#D4AF37]">PROMPT</span>
            </h1>
            <p className="text-gray-500 text-xs uppercase tracking-[0.3em]">Standalone Production System</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button 
            onClick={() => setMenu('scene-iklan')} 
            className="p-8 bg-[#121212] border border-[#262626] rounded-3xl hover:border-[#D4AF37] transition-all text-left group"
          >
            <h2 className="text-xl font-bold group-hover:text-[#D4AF37]">Scene Iklan Generator</h2>
            <p className="text-gray-500 text-sm mt-2 italic">UI + API dalam satu file mandiri.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {menu === 'scene-iklan' && <SceneIklanGenerator onBack={() => setMenu('home')} />}
    </>
  );
}
