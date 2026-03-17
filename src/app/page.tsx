import Link from "next/link";
import { MonitorPlay, Smartphone, MonitorUp, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fuchsia-600/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="z-10 text-center mb-16">
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-fuchsia-500 to-amber-500 drop-shadow-lg">
          CLICK-MASTER
        </h1>
        <p className="text-2xl text-zinc-400 mt-4 font-medium tracking-wide">
          Interactive Event Engine
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl z-10 p-4">
        
        {/* Projector Screen */}
        <Link href="/screen" className="group flex flex-col items-center p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-zinc-800 hover:border-blue-500 transition-all cursor-pointer shadow-xl hover:shadow-blue-500/20 active:scale-95">
          <MonitorPlay size={48} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-black mb-1">Projector Screen</h2>
          <p className="text-zinc-500 text-center text-sm">
            המסך הגדול שמוצג לקהל באולם
          </p>
        </Link>
        
        {/* Play Controller */}
        <Link href="/play" className="group flex flex-col items-center p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-zinc-800 hover:border-fuchsia-500 transition-all cursor-pointer shadow-xl hover:shadow-fuchsia-500/20 active:scale-95">
          <Smartphone size={48} className="text-fuchsia-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-black mb-1">Play Controller</h2>
          <p className="text-zinc-500 text-center text-sm">
            שלט המשחק החכם של כל משתתף בקהל
          </p>
        </Link>

        {/* Host Remote */}
        <Link href="/host" className="group flex flex-col items-center p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-zinc-800 hover:border-amber-500 transition-all cursor-pointer shadow-xl hover:shadow-amber-500/20 active:scale-95">
          <MonitorUp size={48} className="text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-black mb-1">Host Remote</h2>
          <p className="text-zinc-500 text-center text-sm">
            שלט המנחה לשליטה מלאה בחידון ובמקרן
          </p>
        </Link>

        {/* Quiz Editor */}
        <Link href="/admin/quiz-editor" className="group flex flex-col items-center p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-zinc-800 hover:border-emerald-500 transition-all cursor-pointer shadow-xl hover:shadow-emerald-500/20 active:scale-95">
          <FileText size={48} className="text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-black mb-1">Quiz Editor</h2>
          <p className="text-zinc-500 text-center text-sm">
            יצירה ועריכה של חידונים (CSV) בצורה נוחה
          </p>
        </Link>
      </div>
    </div>
  );
}
