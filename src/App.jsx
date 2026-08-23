import React, { useState } from 'react';
import CreateJoinModal from './components/CreateJoinModal';
import CinemaRoom from './components/CinemaRoom';
import { Film, Menu, X, Shield, FileText, UserCheck, Heart } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  return (
    <div className="min-h-screen bg-[#07090d] text-white flex flex-col justify-between selection:bg-teal-500 selection:text-black">
      
      {/* 1. Header & Navigation */}
      <header className="w-full border-b border-neutral-800/80 bg-[#0a0e14]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]">
              <Film size={18} />
            </div>
            <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-teal-300 to-teal-500 bg-clip-text text-transparent">
              Love Cast
            </span>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-all active:scale-95"
            aria-label="Open Navigation Menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* 2. Hamburger Slide Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-64 bg-[#0d131a] h-full border-l border-neutral-800 p-5 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Navigation</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-neutral-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 mt-4">
                <button
                  onClick={() => { setActiveModal('privacy'); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-teal-400 hover:bg-[#121c24] transition-all"
                >
                  <Shield size={16} className="text-teal-400" />
                  Privacy Policy
                </button>

                <button
                  onClick={() => { setActiveModal('terms'); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-teal-400 hover:bg-[#121c24] transition-all"
                >
                  <FileText size={16} className="text-teal-400" />
                  Terms & Conditions
                </button>

                <button
                  onClick={() => { setActiveModal('admin'); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-teal-400 hover:bg-[#121c24] transition-all"
                >
                  <UserCheck size={16} className="text-teal-400" />
                  Admin / Creator Info
                </button>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 text-center border-t border-neutral-800/80 pt-3">
              Love Cast v1.0
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {!session ? (
          <CreateJoinModal onEnterRoom={(data) => setSession(data)} />
        ) : (
          <CinemaRoom roomId={session.roomId} nickname={session.nickname} />
        )}
      </main>

      {/* 4. Footer */}
      {!session && (
        <footer className="w-full border-t border-neutral-900 bg-[#07090d] py-3 text-center text-xs text-neutral-500">
          <p className="flex items-center justify-center gap-1">
            Made with <Heart size={13} className="text-red-500 fill-red-500 animate-pulse inline" /> by <span className="text-neutral-300 font-semibold tracking-wide">Wasim Ibrar</span>
          </p>
        </footer>
      )}

      {/* 5. Legal & Admin Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d131a] border border-teal-500/30 rounded-2xl max-w-sm w-full p-5 shadow-[0_0_25px_rgba(20,184,166,0.15)] relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X size={18} />
            </button>

            {activeModal === 'privacy' && (
              <div>
                <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 mb-2">
                  <Shield size={16} /> Privacy Policy
                </h3>
                <div className="text-xs text-neutral-300 space-y-2 leading-relaxed max-h-60 overflow-y-auto pr-1">
                  <p>• <strong>Zero Data Retention:</strong> Love Cast does not require email, passwords, or personal credentials.</p>
                  <p>• <strong>Ephemeral Sync:</strong> Room sync metadata, presence, and playback timestamps are temporary and cleared automatically.</p>
                  <p>• <strong>Direct Streaming:</strong> Media streams are rendered straight from YouTube player embeds with zero intermediary proxy logs.</p>
                </div>
              </div>
            )}

            {activeModal === 'terms' && (
              <div>
                <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 mb-2">
                  <FileText size={16} /> Terms & Conditions
                </h3>
                <div className="text-xs text-neutral-300 space-y-2 leading-relaxed max-h-60 overflow-y-auto pr-1">
                  <p>• <strong>Personal Watch Parties:</strong> Love Cast is designed exclusively for synchronized private media viewing between peers.</p>
                  <p>• <strong>YouTube Compliance:</strong> Content playback is bound by official YouTube Terms of Service and copyright licensing.</p>
                  <p>• <strong>No Abuse:</strong> Automated socket spamming or room flooding will trigger automated rate limiting.</p>
                </div>
              </div>
            )}

            {activeModal === 'admin' && (
              <div>
                <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 mb-2">
                  <UserCheck size={16} /> About Creator
                </h3>
                <div className="text-xs text-neutral-300 space-y-2 leading-relaxed">
                  <p>Built by <strong>Wasim Ibrar</strong> — Web Developer & Digital Tech Creator.</p>
                  <p className="text-neutral-400">Crafting high-speed, real-time web applications with minimalist aesthetic design.</p>
                  <div className="pt-2 border-t border-neutral-800 flex justify-between text-[11px] text-teal-400 font-mono">
                    <span>Engine: Firebase RTDB</span>
                    <span>Status: Production Ready</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-4 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs py-2 rounded-xl font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}