"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileAudio, 
  Mic, 
  LogOut, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  Headphones,
  FileText,
  User,
  Plus,
  Copy,
  Check,
  Zap
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";


interface Transcript {
  id: string;
  fileName: string;
  content: string;
  createdAt: string;
}

const PremiumLoader = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center gap-6">
    <div className="relative h-20 w-20">
      <div className="absolute inset-0 rounded-full border-4 border-white/5" />
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-t-iris border-r-transparent border-b-transparent border-l-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-3 rounded-full border-4 border-t-moss border-r-transparent border-b-transparent border-l-transparent"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap size={24} className="text-lace" fill="currentColor" />
        </motion.div>
      </div>
    </div>
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-black tracking-[0.3em] uppercase text-lace/40">{text}</p>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1 w-1 rounded-full bg-iris"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
              backgroundColor: ["#7B57CE", "#8F9D68", "#7B57CE"]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  </div>
);



export default function Dashboard() {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/login");
    }
  }, [session, sessionLoading, router]);

  useEffect(() => {
    if (session) {
      fetchTranscripts();
    }
  }, [session]);

  const fetchTranscripts = async () => {
    try {
      const res = await fetch("/api/transcripts");
      const data = await res.json();
      if (data.transcripts) {
        setTranscripts(data.transcripts);
      }
    } catch (err) {
      console.error("Failed to fetch transcripts");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadError("File size too large. Please upload less than 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setTranscripts([data.transcript, ...transcripts]);
        setSelectedTranscript(data.transcript);
      } else {
        setUploadError(data.error || "Transcription failed");
      }
    } catch (err) {
      setUploadError("Network error. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteTranscript = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this transcript?")) return;

    try {
      await fetch(`/api/transcripts?id=${id}`, { method: "DELETE" });
      setTranscripts(transcripts.filter((t) => t.id !== id));
      if (selectedTranscript?.id === id) setSelectedTranscript(null);
    } catch (err) {
      alert("Failed to delete transcript");
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFormattedText = (text: string) => {
    // If text has no line breaks, try to add them for better readability
    const paragraphs = text.split(/\n+/).filter(p => p.trim() !== "");
    
    if (paragraphs.length <= 1 && text.length > 200) {
      // Split into chunks of ~3 sentences if it's one big block
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const chunks = [];
      for (let i = 0; i < sentences.length; i += 3) {
        chunks.push(sentences.slice(i, i + 3).join(" "));
      }
      return chunks.map((chunk, i) => (
        <p key={i} className="mb-6 text-lg leading-[1.8] text-lace/70 font-light tracking-wide">
          {chunk.trim()}
        </p>
      ));
    }

    return paragraphs.map((para, i) => (
      <p key={i} className="mb-6 text-lg body-premium tracking-wide">
        {para.trim()}
      </p>
    ));
  };





  if (sessionLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-moss/20 to-iris/20 z-0"></div>
        <PremiumLoader text="Initializing Access" />
      </div>
    );
  }




  return (
    <div className="flex h-screen flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 sidebar-moss flex flex-col border-r border-black/5 shadow-xl relative z-20">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center text-lace shadow-inner">
              <Zap size={24} fill="#FFF8EB" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-lace">VibeScribe</span>
          </div>





          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-lace py-4 text-xs font-black uppercase tracking-[0.1em] shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 text-moss"
            >
              {isUploading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Loader2 size={20} />
                </motion.div>
              ) : (
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              )}
              {isUploading ? "Syncing..." : "Capture Data"}
            </button>




            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
            
            {uploadError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                <AlertCircle size={14} />
                {uploadError}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            Recent Transcripts
          </h3>
          
          <div className="space-y-2">
            {fetchLoading ? (
              <div className="py-20 flex justify-center">
                <PremiumLoader text="Fetching" />
              </div>
            ) : transcripts.length === 0 ? (

              <div className="p-8 text-center text-neutral-500">
                <FileAudio size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">No transcripts yet</p>
              </div>
            ) : (
              transcripts.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTranscript(item)}
                  className={cn(
                    "group relative w-full cursor-pointer rounded-2xl p-4 text-left transition-all",
                    selectedTranscript?.id === item.id ? "bg-white/20 border border-white/30 shadow-lg" : "hover:bg-white/10"
                  )}
                >


                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
                      selectedTranscript?.id === item.id
                        ? "border-iris bg-iris text-lace shadow-lg"
                        : "border-white/10 bg-white/10 text-iris"
                    )}>
                      <Headphones size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "truncate text-sm font-black transition-colors",
                        selectedTranscript?.id === item.id ? "text-white" : "text-lace"
                      )}>
                        {item.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-lace/40 mt-1.5 font-bold uppercase tracking-wider">
                        <Clock size={10} />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>



                    <button
                      onClick={(e) => deleteTranscript(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-white/10">
          <div className="flex items-center justify-between rounded-2xl p-4 bg-white/10 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-xs font-black text-white shadow-lg border border-white/20">
                {session?.user?.username?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-lace truncate">{session?.user?.username}</p>
                <p className="text-[10px] text-lace/70 truncate uppercase tracking-[0.2em] font-black">Authorized</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 text-lace/60 hover:text-white hover:bg-white/20 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative z-10 bg-[#FFF8EB] overflow-hidden">
        {/* Background Blobs for Depth */}
        <div className="blob-depth bg-iris top-20 right-20 opacity-10"></div>
        <div className="blob-depth bg-moss bottom-20 left-20 opacity-10 animation-delay-[5s]"></div>
        
        <AnimatePresence mode="wait">

          {selectedTranscript ? (
            <motion.div
              key={selectedTranscript.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-auto max-w-5xl"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <div className="flex items-center gap-2 text-moss/80 font-bold mb-3 uppercase tracking-[0.4em]">
                    <CheckCircle2 size={16} />
                    <span>Intel Received</span>
                  </div>

                  <h2 className="text-3xl lg:text-5xl heading-premium text-iris-dark tracking-tighter leading-tight">
                    {selectedTranscript.fileName}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-6 py-2 rounded-full glass border border-iris/20 text-[10px] text-iris-dark font-bold uppercase tracking-[0.3em]">
                    {formatDate(selectedTranscript.createdAt)}
                  </span>
                </div>
              </div>

              <div className="premium-glass-card p-10 lg:p-16 relative group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                  <FileText size={300} className="text-iris" />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-2 bg-iris/40 rounded-full shadow-sm"></div>
                      <h4 className="text-sm muted-premium uppercase tracking-[0.5em]">Data Stream</h4>
                    </div>

                    <button
                      onClick={() => copyToClipboard(selectedTranscript.content)}
                      className={cn(
                        "flex items-center gap-4 px-8 py-3 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest",
                        copied 
                          ? "bg-white text-iris shadow-xl scale-105" 
                          : "glass-button-premium"
                      )}
                    >

                      {copied ? (
                        <>
                          <Check size={16} />
                          <span>Synced</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Clone Text</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="max-w-none">
                    {renderFormattedText(selectedTranscript.content)}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full flex-col items-center justify-center text-center p-16 glass rounded-[40px] border-white shadow-xl"
            >
              <div className="mb-10 h-32 w-32 bg-white shadow-2xl rounded-3xl flex items-center justify-center relative">
                <Upload size={56} className="text-iris animate-float relative z-10" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-iris-dark mb-6 tracking-tighter">Initialize Transcription</h2>
              <p className="text-iris-dark/50 max-w-md mx-auto mb-12 leading-relaxed font-bold text-lg">
                Transmit your audio data to the VibeScribe nexus for high-fidelity extraction.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group inline-flex items-center gap-4 px-10 py-5 rounded-2xl btn-iris text-white font-black shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105 active:scale-95"
              >
                <Plus size={28} className="group-hover:rotate-90 transition-transform" />
                Capture Data
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>




    </div>
  );
}
