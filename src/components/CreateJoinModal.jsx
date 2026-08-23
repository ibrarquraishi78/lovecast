import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebaseConfig';
import { ref, set, get, child } from 'firebase/database';
import { Lock, User, Film, PlusCircle, LogIn } from 'lucide-react';

export default function CreateJoinModal({ onEnterRoom }) {
  const [activeTab, setActiveTab] = useState('create');
  const [roomId, setRoomId] = useState('');
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom && !sessionStorage.getItem('created_locally')) {
      setRoomId(urlRoom);
      setActiveTab('join');
    }
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || pin.length !== 4) {
      setErrorMsg('Please enter nickname and a 4-digit PIN');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const newRoomId = 'lovecast-' + Math.random().toString(36).substring(2, 7);

    try {
      await set(ref(db, `rooms/${newRoomId}`), {
        pin: pin.trim(),
        createdAt: Date.now(),
        videoId: 'cNV5hLSa9H8'
      });
      sessionStorage.setItem('created_locally', 'true');
      onEnterRoom({ roomId: newRoomId, nickname: nickname.trim() });
    } catch (err) {
      setErrorMsg('Error creating room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !roomId.trim() || pin.length !== 4) {
      setErrorMsg('Please enter Nickname, Room ID, and 4-digit PIN');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const roomSnapshot = await get(child(ref(db), `rooms/${roomId.trim()}`));
      if (!roomSnapshot.exists()) {
        setErrorMsg('Room not found. Check Room ID.');
        setLoading(false);
        return;
      }

      const roomData = roomSnapshot.val();
      if (roomData.pin !== pin.trim()) {
        setErrorMsg('Invalid 4-digit PIN. Access denied.');
        setLoading(false);
        return;
      }

      onEnterRoom({ roomId: roomId.trim(), nickname: nickname.trim() });
    } catch (err) {
      setErrorMsg('Verification failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-[#0d131a] border border-teal-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(20,184,166,0.12)]">
      
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/40 rounded-full flex items-center justify-center text-teal-400 mb-2 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
          <Film size={24} />
        </div>
        <h1 className="text-lg font-bold tracking-wide">Love Cast</h1>
        <p className="text-xs text-neutral-400">Zero latency watch party</p>
      </div>

      <div className="flex bg-[#07090d] p-1 rounded-xl border border-neutral-800 mb-6">
        <button
          onClick={() => { setActiveTab('create'); setErrorMsg(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'create' ? 'bg-[#121c24] text-teal-400 border border-teal-500/30' : 'text-neutral-400'}`}
        >
          <PlusCircle size={14} /> Create Room
        </button>
        <button
          onClick={() => { setActiveTab('join'); setErrorMsg(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'join' ? 'bg-[#121c24] text-teal-400 border border-teal-500/30' : 'text-neutral-400'}`}
        >
          <LogIn size={14} /> Join Room
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg mb-4 text-center">
          {errorMsg}
        </div>
      )}

      {activeTab === 'create' ? (
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="text-[11px] text-neutral-400 font-medium">Your Nickname</label>
            <div className="flex items-center bg-[#07090d] border border-neutral-800 rounded-xl px-3 py-2 mt-1 focus-within:border-teal-500/50">
              <User size={15} className="text-neutral-500 mr-2" />
              <input
                type="text"
                placeholder="e.g. Wasim"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-transparent w-full text-xs text-neutral-200 focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-neutral-400 font-medium">Set 4-Digit Room PIN</label>
            <div className="flex items-center bg-[#07090d] border border-neutral-800 rounded-xl px-3 py-2 mt-1 focus-within:border-teal-500/50">
              <Lock size={15} className="text-neutral-500 mr-2" />
              <input
                type="password"
                maxLength={4}
                placeholder="e.g. 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="bg-transparent w-full text-xs text-neutral-200 focus:outline-none tracking-widest"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 py-2.5 rounded-xl text-xs font-bold tracking-wide mt-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'CREATE LOVE CAST ROOM'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div>
            <label className="text-[11px] text-neutral-400 font-medium">Room ID</label>
            <input
              type="text"
              placeholder="lovecast-xyz12"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-[#07090d] border border-neutral-800 rounded-xl px-3 py-2 mt-1 text-xs text-neutral-200 focus:outline-none focus:border-teal-500/50 font-mono"
              required
            />
          </div>
          <div>
            <label className="text-[11px] text-neutral-400 font-medium">Your Nickname</label>
            <div className="flex items-center bg-[#07090d] border border-neutral-800 rounded-xl px-3 py-2 mt-1 focus-within:border-teal-500/50">
              <User size={15} className="text-neutral-500 mr-2" />
              <input
                type="text"
                placeholder="e.g. Partner"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-transparent w-full text-xs text-neutral-200 focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-neutral-400 font-medium">4-Digit Room PIN</label>
            <div className="flex items-center bg-[#07090d] border border-neutral-800 rounded-xl px-3 py-2 mt-1 focus-within:border-teal-500/50">
              <Lock size={15} className="text-neutral-500 mr-2" />
              <input
                type="password"
                maxLength={4}
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="bg-transparent w-full text-xs text-neutral-200 focus:outline-none tracking-widest"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 py-2.5 rounded-xl text-xs font-bold tracking-wide mt-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'ENTER ROOM'}
          </button>
        </form>
      )}

    </div>
  );
}