import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, 
  Shuffle, 
  Trophy, 
  Timer, 
  Hash, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Constants & Types ---

type Color = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green';
type FaceName = 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';

const COLORS: Record<Color, string> = {
  white: '#FFFFFF',
  yellow: '#FFD700',
  red: '#FF4444',
  orange: '#FF8800',
  blue: '#3366FF',
  green: '#00C851',
};

const INITIAL_STATE: Record<FaceName, Color[][]> = {
  front: Array(3).fill(null).map(() => Array(3).fill('white')),
  back: Array(3).fill(null).map(() => Array(3).fill('yellow')),
  top: Array(3).fill(null).map(() => Array(3).fill('blue')),
  bottom: Array(3).fill(null).map(() => Array(3).fill('green')),
  left: Array(3).fill(null).map(() => Array(3).fill('orange')),
  right: Array(3).fill(null).map(() => Array(3).fill('red')),
};

// --- Helper Functions ---

const rotateMatrix = (matrix: Color[][], clockwise: boolean = true): Color[][] => {
  const n = matrix.length;
  const result = Array(n).fill(null).map(() => Array(n).fill('white'));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (clockwise) {
        result[j][n - 1 - i] = matrix[i][j];
      } else {
        result[n - 1 - j][i] = matrix[i][j];
      }
    }
  }
  return result;
};

const getMovedCube = (prev: Record<FaceName, Color[][]>, face: FaceName, clockwise: boolean = true): Record<FaceName, Color[][]> => {
  const next: Record<FaceName, Color[][]> = JSON.parse(JSON.stringify(prev));
  
  // Rotate the face itself
  next[face] = rotateMatrix(prev[face], clockwise);

  // Rotate adjacent edges
  if (face === 'front') {
    const topRow = [...prev.top[2]];
    const rightCol = [prev.right[0][0], prev.right[1][0], prev.right[2][0]];
    const bottomRow = [...prev.bottom[0]];
    const leftCol = [prev.left[0][2], prev.left[1][2], prev.left[2][2]];

    if (clockwise) {
      next.right[0][0] = topRow[0]; next.right[1][0] = topRow[1]; next.right[2][0] = topRow[2];
      next.bottom[0][0] = rightCol[2]; next.bottom[0][1] = rightCol[1]; next.bottom[0][2] = rightCol[0];
      next.left[0][2] = bottomRow[0]; next.left[1][2] = bottomRow[1]; next.left[2][2] = bottomRow[2];
      next.top[2][0] = leftCol[2]; next.top[2][1] = leftCol[1]; next.top[2][2] = leftCol[0];
    } else {
      next.left[0][2] = topRow[2]; next.left[1][2] = topRow[1]; next.left[2][2] = topRow[0];
      next.bottom[0][0] = leftCol[0]; next.bottom[0][1] = leftCol[1]; next.bottom[0][2] = leftCol[2];
      next.right[0][0] = bottomRow[2]; next.right[1][0] = bottomRow[1]; next.right[2][0] = bottomRow[0];
      next.top[2][0] = rightCol[0]; next.top[2][1] = rightCol[1]; next.top[2][2] = rightCol[2];
    }
  } else if (face === 'back') {
    const topRow = [...prev.top[0]];
    const leftCol = [prev.left[0][0], prev.left[1][0], prev.left[2][0]];
    const bottomRow = [...prev.bottom[2]];
    const rightCol = [prev.right[0][2], prev.right[1][2], prev.right[2][2]];

    if (clockwise) {
      next.left[0][0] = topRow[2]; next.left[1][0] = topRow[1]; next.left[2][0] = topRow[0];
      next.bottom[2][0] = leftCol[0]; next.bottom[2][1] = leftCol[1]; next.bottom[2][2] = leftCol[2];
      next.right[0][2] = bottomRow[2]; next.right[1][2] = bottomRow[1]; next.right[2][2] = bottomRow[0];
      next.top[0][0] = rightCol[0]; next.top[0][1] = rightCol[1]; next.top[0][2] = rightCol[2];
    } else {
      next.right[0][2] = topRow[0]; next.right[1][2] = topRow[1]; next.right[2][2] = topRow[2];
      next.bottom[2][0] = rightCol[2]; next.bottom[2][1] = rightCol[1]; next.bottom[2][2] = rightCol[0];
      next.left[0][0] = bottomRow[0]; next.left[1][0] = bottomRow[1]; next.left[2][0] = bottomRow[2];
      next.top[0][0] = leftCol[2]; next.top[0][1] = leftCol[1]; next.top[0][2] = leftCol[0];
    }
  } else if (face === 'top') {
    const frontRow = [...prev.front[0]];
    const leftRow = [...prev.left[0]];
    const backRow = [...prev.back[0]];
    const rightRow = [...prev.right[0]];
    if (clockwise) {
      next.front[0] = rightRow; next.left[0] = frontRow; next.back[0] = leftRow; next.right[0] = backRow;
    } else {
      next.front[0] = leftRow; next.left[0] = backRow; next.back[0] = rightRow; next.right[0] = frontRow;
    }
  } else if (face === 'bottom') {
    const frontRow = [...prev.front[2]];
    const rightRow = [...prev.right[2]];
    const backRow = [...prev.back[2]];
    const leftRow = [...prev.left[2]];
    if (clockwise) {
      next.front[2] = leftRow; next.right[2] = frontRow; next.back[2] = rightRow; next.left[2] = backRow;
    } else {
      next.front[2] = rightRow; next.right[2] = backRow; next.back[2] = leftRow; next.left[2] = frontRow;
    }
  } else if (face === 'right') {
    const frontCol = [prev.front[0][2], prev.front[1][2], prev.front[2][2]];
    const topCol = [prev.top[0][2], prev.top[1][2], prev.top[2][2]];
    const backCol = [prev.back[2][0], prev.back[1][0], prev.back[0][0]];
    const bottomCol = [prev.bottom[0][2], prev.bottom[1][2], prev.bottom[2][2]];
    if (clockwise) {
      next.top[0][2] = frontCol[0]; next.top[1][2] = frontCol[1]; next.top[2][2] = frontCol[2];
      next.back[0][0] = topCol[2]; next.back[1][0] = topCol[1]; next.back[2][0] = topCol[0];
      next.bottom[0][2] = backCol[0]; next.bottom[1][2] = backCol[1]; next.bottom[2][2] = backCol[2];
      next.front[0][2] = bottomCol[0]; next.front[1][2] = bottomCol[1]; next.front[2][2] = bottomCol[2];
    } else {
      next.bottom[0][2] = frontCol[0]; next.bottom[1][2] = frontCol[1]; next.bottom[2][2] = frontCol[2];
      next.back[0][0] = bottomCol[2]; next.back[1][0] = bottomCol[1]; next.back[2][0] = bottomCol[0];
      next.top[0][2] = backCol[0]; next.top[1][2] = backCol[1]; next.top[2][2] = backCol[2];
      next.front[0][2] = topCol[0]; next.front[1][2] = topCol[1]; next.front[2][2] = topCol[2];
    }
  } else if (face === 'left') {
    const frontCol = [prev.front[0][0], prev.front[1][0], prev.front[2][0]];
    const topCol = [prev.top[0][0], prev.top[1][0], prev.top[2][0]];
    const backCol = [prev.back[2][2], prev.back[1][2], prev.back[0][2]];
    const bottomCol = [prev.bottom[0][0], prev.bottom[1][0], prev.bottom[2][0]];
    if (clockwise) {
      next.bottom[0][0] = frontCol[0]; next.bottom[1][0] = frontCol[1]; next.bottom[2][0] = frontCol[2];
      next.back[0][2] = bottomCol[2]; next.back[1][2] = bottomCol[1]; next.back[2][2] = bottomCol[0];
      next.top[0][0] = backCol[0]; next.top[1][0] = backCol[1]; next.top[2][0] = backCol[2];
      next.front[0][0] = topCol[0]; next.front[1][0] = topCol[1]; next.front[2][0] = topCol[2];
    } else {
      next.top[0][0] = frontCol[0]; next.top[1][0] = frontCol[1]; next.top[2][0] = frontCol[2];
      next.back[0][2] = topCol[2]; next.back[1][2] = topCol[1]; next.back[2][2] = topCol[0];
      next.bottom[0][0] = backCol[0]; next.bottom[1][0] = backCol[1]; next.bottom[2][0] = backCol[2];
      next.front[0][0] = bottomCol[0]; next.front[1][0] = bottomCol[1]; next.front[2][0] = bottomCol[2];
    }
  }

  return next;
};

export default function App() {
  const [cube, setCube] = useState(INITIAL_STATE);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [rotation, setRotation] = useState({ x: -25, y: -45 });
  const [showTutorial, setShowTutorial] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isActive && !isSolved) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isSolved]);

  // Check if solved
  const checkSolved = useCallback((state: typeof INITIAL_STATE) => {
    for (const face of Object.values(state)) {
      const firstColor = face[0][0];
      if (!face.every(row => row.every(cell => cell === firstColor))) {
        return false;
      }
    }
    return true;
  }, []);

  // Move Logic
  const performMove = useCallback((face: FaceName, clockwise: boolean = true) => {
    if (isSolved) return;
    setIsActive(true);

    setCube((prev) => getMovedCube(prev, face, clockwise));
    setMoves((m) => m + 1);
  }, [isSolved]);

  // Check for solution after moves
  useEffect(() => {
    if (moves > 0 && !isSolved && checkSolved(cube)) {
      setIsSolved(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: Object.values(COLORS)
      });
    }
  }, [cube, moves, isSolved, checkSolved]);

  const scramble = useCallback(() => {
    setIsSolved(false);
    setMoves(0);
    setTime(0);
    setIsActive(false);
    
    const faces: FaceName[] = ['front', 'top', 'right', 'left', 'bottom', 'back'];
    let currentCube = JSON.parse(JSON.stringify(INITIAL_STATE));

    // Perform 20 random moves on all axes
    for (let i = 0; i < 20; i++) {
      const randomFace = faces[Math.floor(Math.random() * faces.length)];
      const clockwise = Math.random() > 0.5;
      currentCube = getMovedCube(currentCube, randomFace, clockwise);
    }
    
    setCube(currentCube);
  }, []);

  const reset = useCallback(() => {
    setCube(INITIAL_STATE);
    setMoves(0);
    setTime(0);
    setIsActive(false);
    setIsSolved(false);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts for laptop users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSolved) return;
      const key = e.key.toLowerCase();
      switch (key) {
        case 'f': performMove('front'); break;
        case 'u': performMove('top'); break;
        case 'r': performMove('right'); break;
        case 'l': performMove('left'); break;
        case 'd': performMove('bottom'); break;
        case 'b': performMove('back'); break;
        case 'arrowleft': setRotation(r => ({ ...r, y: r.y - 45 })); break;
        case 'arrowright': setRotation(r => ({ ...r, y: r.y + 45 })); break;
        case 'arrowup': setRotation(r => ({ ...r, x: r.x + 45 })); break;
        case 'arrowdown': setRotation(r => ({ ...r, x: r.x - 45 })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSolved, performMove]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-4 md:p-8 font-sans safe-area-inset">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <Sparkles className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 truncate">Rubik's Kid</h1>
            <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">Adventure</p>
          </div>
        </div>

        <div className="flex gap-2 md:gap-4">
          <div className="bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Timer className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
            <span className="font-mono font-bold text-sm md:text-lg">{formatTime(time)}</span>
          </div>
          <div className="bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Hash className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            <span className="font-mono font-bold text-sm md:text-lg">{moves}</span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 w-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 py-4 md:py-8 overflow-y-auto">
        
        {/* Cube Visualization */}
        <div className="relative cube-container flex items-center justify-center">
          <motion.div 
            className={`cube ${isSolved ? 'solved-animation' : ''}`}
            animate={{ 
              rotateX: rotation.x, 
              rotateY: rotation.y 
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            {/* Faces */}
            {(Object.entries(cube) as [FaceName, Color[][]][]).map(([face, grid]) => (
              <div key={face} className={`cube-face face-${face}`}>
                {grid.map((row, r) => 
                  row.map((color, c) => (
                    <div 
                      key={`${face}-${r}-${c}`} 
                      className="sticker"
                      style={{ backgroundColor: COLORS[color] }}
                    />
                  ))
                )}
              </div>
            ))}
          </motion.div>

          {/* Rotation Controls (Overlay) */}
          <div className="absolute -bottom-12 md:-bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            <button 
              onClick={() => setRotation(r => ({ ...r, y: r.y - 45 }))}
              className="p-2.5 md:p-3 bg-white rounded-full shadow-md hover:bg-slate-50 active:scale-90 transition-all border border-slate-100"
              aria-label="Rotate Left"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
            </button>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setRotation(r => ({ ...r, x: r.x + 45 }))}
                className="p-2.5 md:p-3 bg-white rounded-full shadow-md hover:bg-slate-50 active:scale-90 transition-all border border-slate-100"
                aria-label="Rotate Up"
              >
                <ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
              </button>
              <button 
                onClick={() => setRotation(r => ({ ...r, x: r.x - 45 }))}
                className="p-2.5 md:p-3 bg-white rounded-full shadow-md hover:bg-slate-50 active:scale-90 transition-all border border-slate-100"
                aria-label="Rotate Down"
              >
                <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
              </button>
            </div>
            <button 
              onClick={() => setRotation(r => ({ ...r, y: r.y + 45 }))}
              className="p-2.5 md:p-3 bg-white rounded-full shadow-md hover:bg-slate-50 active:scale-90 transition-all border border-slate-100"
              aria-label="Rotate Right"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Move Controls */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-[320px] px-2">
          <h3 className="col-span-2 text-center text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Putar Sisi</h3>
          
          <ControlButton 
            label="Depan (F)" 
            color="bg-white" 
            textColor="text-slate-700"
            onClick={() => performMove('front')} 
          />
          <ControlButton 
            label="Atas (U)" 
            color="bg-blue-500" 
            textColor="text-white"
            onClick={() => performMove('top')} 
          />
          <ControlButton 
            label="Kanan (R)" 
            color="bg-red-500" 
            textColor="text-white"
            onClick={() => performMove('right')} 
          />
          <ControlButton 
            label="Kiri (L)" 
            color="bg-orange-500" 
            textColor="text-white"
            onClick={() => performMove('left', false)} 
          />
          <ControlButton 
            label="Bawah (D)" 
            color="bg-green-500" 
            textColor="text-white"
            onClick={() => performMove('bottom')} 
          />
          <ControlButton 
            label="Belakang (B)" 
            color="bg-yellow-400" 
            textColor="text-slate-800"
            onClick={() => performMove('back')} 
          />
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="w-full max-w-4xl flex items-center justify-center gap-3 md:gap-4 pb-4 px-2">
        <button 
          onClick={scramble}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all text-sm md:text-base"
        >
          <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
          Acak!
        </button>
        
        <button 
          onClick={reset}
          className="p-3.5 md:p-4 bg-white text-slate-600 rounded-xl md:rounded-2xl font-bold shadow-md border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all shrink-0"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <button 
          onClick={() => setShowTutorial(true)}
          className="p-3.5 md:p-4 bg-white text-slate-600 rounded-xl md:rounded-2xl font-bold shadow-md border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all shrink-0"
          title="Bantuan"
        >
          <Info className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </footer>

      {/* Solved Modal */}
      <AnimatePresence>
        {isSolved && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Hebat!</h2>
              <p className="text-slate-500 mb-8">Kamu berhasil menyelesaikan tantangan ini dalam <span className="font-bold text-indigo-600">{moves} langkah</span>!</p>
              <button 
                onClick={reset}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                Main Lagi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Info className="text-indigo-600" /> Cara Bermain
              </h2>
              <ul className="space-y-4 text-slate-600 mb-8">
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <p>Klik tombol <b>Acak Kubus</b> untuk memulai petualanganmu!</p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <p>Gunakan tombol panah di bawah kubus untuk melihat sisi lainnya.</p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <p>Klik tombol warna-warni di kanan untuk memutar setiap sisi kubus.</p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                  <p>Samakan semua warna di setiap sisi untuk menang!</p>
                </li>
                <li className="hidden md:flex gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">⌨️</span>
                  <p><b>Tips Laptop:</b> Gunakan tombol <b>F, U, R, L, D, B</b> untuk memutar sisi, dan <b>Tombol Panah</b> untuk memutar kamera!</p>
                </li>
              </ul>
              <button 
                onClick={() => setShowTutorial(false)}
                className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Mengerti!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControlButton({ label, onClick, color, textColor }: { label: string, onClick: () => void, color: string, textColor: string }) {
  return (
    <button 
      onClick={onClick}
      className={`${color} ${textColor} py-3 px-4 min-h-[44px] rounded-2xl font-bold shadow-sm border border-slate-200/50 hover:brightness-95 active:scale-95 transition-all text-xs md:text-sm flex items-center justify-center`}
    >
      {label}
    </button>
  );
}
