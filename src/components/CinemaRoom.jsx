import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { db } from '../lib/firebaseConfig';
import { ref, set, update, onValue, push, onDisconnect, remove, onChildAdded } from 'firebase/database';
import { Search, Copy, Check, Film, Settings, Hash, Loader2 } from 'lucide-react';

export default function CinemaRoom({ roomId, nickname }) {
  const [videoId, setVideoId] = useState('cNV5hLSa9H8');
  const [videoTitle, setVideoTitle] = useState('Loading Title...');
  const [inputUrl, setInputUrl] = useState('');
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerName, setPartnerName] = useState('Partner');
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  
  const playerRef = useRef(null);
  const isRemoteAction = useRef(false);
  const userKeyRef = useRef(nickname + '_' + Math.random().toString(36).substring(2, 6));

  // Universal YouTube URL / Video ID Extractor
  const extractVideoId = (url) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
    const match = cleanUrl.match(regExp);
    if (match && match[1]) return match[1];
    if (/^[\w-]{11}$/.test(cleanUrl)) return cleanUrl;
    return null;
  };

  // Fetch title whenever video changes
  useEffect(() => {
    if (!videoId) return;
    setIsLoadingVideo(true);
    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.title) {
          setVideoTitle(data.title);
        } else {
          setVideoTitle('YouTube Video');
        }
      })
      .catch(() => setVideoTitle('YouTube Video'))
      .finally(() => setIsLoadingVideo(false));
  }, [videoId]);

  // Handle mid-session video changes atomically
  const handleLoadMovie = async () => {
    const id = extractVideoId(inputUrl);
    if (!id) {
      alert("Invalid YouTube Link! Please paste a valid YouTube URL or 11-digit Video ID.");
      return;
    }

    // Atomic update: Update videoId and RESET playback to 0 at the same instant
    try {
      await update(ref(db, `rooms/${roomId}`), {
        videoId: id,
        playback: {
          action: 'PLAY',
          time: 0,
          sender: userKeyRef.current,
          timestamp: Date.now()
        }
      });
      setInputUrl('');
    } catch (err) {
      alert("Error changing video: " + err.message);
    }
  };

  const triggerEmoji = (emoji) => {
    const id = Date.now() + Math.random();
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2000);

    push(ref(db, `rooms/${roomId}/reactions`), {
      emoji,
      sender: nickname,
      timestamp: Date.now()
    });
  };

  useEffect(() => {
    // 1. User Presence
    const userPresenceRef = ref(db, `rooms/${roomId}/presence/${userKeyRef.current}`);
    set(userPresenceRef, { nickname, onlineAt: Date.now() });
    onDisconnect(userPresenceRef).remove();

    const presenceListRef = ref(db, `rooms/${roomId}/presence`);
    const unsubscribePresence = onValue(presenceListRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = Object.values(snapshot.val());
        if (users.length >= 2) {
          setPartnerConnected(true);
          const otherUser = users.find(u => u.nickname !== nickname);
          if (otherUser) setPartnerName(otherUser.nickname);
        } else {
          setPartnerConnected(false);
        }
      } else {
        setPartnerConnected(false);
      }
    });

    // 2. Video ID listener
    const videoIdRef = ref(db, `rooms/${roomId}/videoId`);
    const unsubscribeVideo = onValue(videoIdRef, (snapshot) => {
      if (snapshot.exists() && snapshot.val()) {
        setVideoId(snapshot.val());
      }
    });

    // 3. Playback listener
    const playbackRef = ref(db, `rooms/${roomId}/playback`);
    const unsubscribePlayback = onValue(playbackRef, (snapshot) => {
      if (!snapshot.exists() || !playerRef.current) return;
      const data = snapshot.val();
      
      if (data.sender === userKeyRef.current) return;

      isRemoteAction.current = true;
      const player = playerRef.current;

      try {
        if (data.action === 'PLAY') {
          player.seekTo(data.time || 0, true);
          player.playVideo();
        } else if (data.action === 'PAUSE') {
          player.seekTo(data.time || 0, true);
          player.pauseVideo();
        }
      } catch (err) {
        console.error("Player sync error:", err);
      }

      setTimeout(() => { isRemoteAction.current = false; }, 500);
    });

    // 4. Reactions listener
    const reactionsRef = ref(db, `rooms/${roomId}/reactions`);
    const unsubscribeReactions = onChildAdded(reactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.sender !== nickname && Date.now() - data.timestamp < 3000) {
        const id = Date.now() + Math.random();
        setFloatingEmojis((prev) => [...prev, { id, emoji: data.emoji }]);
        setTimeout(() => {
          setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
        }, 2000);
      }
    });

    return () => {
      remove(userPresenceRef);
      unsubscribePresence();
      unsubscribeVideo();
      unsubscribePlayback();
      unsubscribeReactions();
    };
  }, [roomId, nickname]);

  const onPlayerStateChange = (event) => {
    if (isRemoteAction.current) return;
    const time = event.target.getCurrentTime();
    
    if (event.data === 1) { // PLAY
      set(ref(db, `rooms/${roomId}/playback`), {
        action: 'PLAY',
        time,
        sender: userKeyRef.current,
        timestamp: Date.now()
      });
    } else if (event.data === 2) { // PAUSE
      set(ref(db, `rooms/${roomId}/playback`), {
        action: 'PAUSE',
        time,
        sender: userKeyRef.current,
        timestamp: Date.now()
      });
    }
  };

  const copyRoomLink = () => {
    const fullLink = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-sm flex flex-col justify-between items-center relative min-h-[85vh]">
      
      {/* Floating Emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 text-4xl animate-float-up opacity-0"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* 1. Header Badges: Room ID & Partner Status */}
      <div className="w-full flex items-center justify-between gap-2 pt-1 px-1">
        {/* Room Name Badge */}
        <div className="inline-flex items-center gap-1.5 bg-[#0d131a] border border-teal-500/30 px-3 py-1.5 rounded-full text-xs font-mono font-medium text-teal-300 shadow-sm">
          <Hash size={13} className="text-teal-400" />
          <span>{roomId}</span>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 bg-[#121820]/90 border border-neutral-800 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide shadow-inner">
          <span className={`w-2 h-2 rounded-full ${partnerConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`}></span>
          <span className="text-neutral-300 text-[11px]">
            {partnerConnected ? `${nickname} & ${partnerName}` : 'Waiting for partner...'}
          </span>
        </div>
      </div>

      {/* 2. Main Player */}
      <div className="w-full my-3">
        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-teal-500/40 shadow-[0_0_20px_rgba(20,184,166,0.18)] relative">
          <YouTube
            videoId={videoId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                playsinline: 1,
                controls: 1,
                modestbranding: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : undefined
              }
            }}
            onReady={(e) => { 
              playerRef.current = e.target;
            }}
            onStateChange={onPlayerStateChange}
            className="w-full h-full"
          />
        </div>

        {/* Video Title Bar */}
        <div className="flex items-center justify-center gap-1.5 mt-2 px-1 text-center">
          {isLoadingVideo ? (
            <Loader2 size={12} className="animate-spin text-teal-400" />
          ) : (
            <span className="text-[11px] text-teal-400/90 font-medium truncate max-w-[300px]">
              🎬 {videoTitle}
            </span>
          )}
        </div>
      </div>

      {/* 3. URL Bar */}
      <div className="w-full flex items-center bg-[#0d131a] border border-teal-500/30 rounded-xl p-1 shadow-[0_0_15px_rgba(20,184,166,0.08)]">
        <div className="pl-3 text-neutral-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Paste YouTube Link or Video ID..."
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          className="w-full bg-transparent px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
        />
        <button
          onClick={handleLoadMovie}
          className="bg-[#121c24] hover:bg-teal-950/40 text-teal-400 border border-teal-500/40 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 whitespace-nowrap"
        >
          LOAD MOVIE
        </button>
      </div>

      {/* 4. Synced Status Tag */}
      <p className="text-[11px] text-neutral-400 tracking-wide font-medium my-2">
        {partnerConnected ? `Both in Cinema, synced in real-time.` : 'Share link to sync playback.'}
      </p>

      {/* 5. Emojis Dock */}
      <div className="w-full grid grid-cols-4 gap-3 px-2">
        {['❤️', '😂', '🍿', '🥺'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => triggerEmoji(emoji)}
            className="h-14 bg-[#0d131a]/80 hover:bg-[#121c24] border border-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.12)] rounded-xl flex items-center justify-center text-2xl transition-all transform active:scale-90 hover:scale-105"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* 6. Earphone Tip */}
      <div className="bg-[#0e141a]/90 border border-neutral-800/80 px-4 py-1.5 rounded-xl text-[11px] text-neutral-400 mt-3 shadow-sm">
        Tip: For best call experience, use Earphones!
      </div>

      {/* 7. Share Link Bar */}
      <div className="w-full flex items-center justify-between bg-[#0a0e14] border border-neutral-800/90 rounded-xl px-4 py-2 mt-3">
        <span className="text-xs text-neutral-400 font-mono truncate max-w-[200px]">
          {window.location.origin}/?room={roomId}
        </span>
        <button
          onClick={copyRoomLink}
          className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium active:scale-95 transition-all"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy Link'}
        </button>
      </div>

      {/* 8. Footer */}
      <div className="w-full flex justify-around items-center pt-4 pb-2 border-t border-neutral-900/60 mt-2">
        <button className="flex flex-col items-center gap-1 text-teal-400">
          <Film size={18} />
          <span className="text-[10px] font-medium">Watch</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-400">
          <Settings size={18} />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>

    </div>
  );
}