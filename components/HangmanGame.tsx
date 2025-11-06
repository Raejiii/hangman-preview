import { useEffect, useMemo, useRef, useState } from "react"
import { Pause, Play, RotateCcw, Music, VolumeX, SkipForward } from "lucide-react"

type GameStatus = "start" | "playing" | "won" | "lost"

const WORDS = [
  "JAVASCRIPT",
  "REACT",
  "HANGMAN",
  "DEVELOPER",
  "PROGRAM",
  "COMPUTER",
  "ALGORITHM",
  "FUNCTION",
  "VARIABLE",
  "COMPILER",
]

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
const MAX_WRONG = 6

export default function HangmanGame() {
  const [targetWord, setTargetWord] = useState<string>("")
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<number>(0)
  const [status, setStatus] = useState<GameStatus>("start")
  const [scale, setScale] = useState<number>(1)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [showSidebar, setShowSidebar] = useState<boolean>(false)
  const [levelIndex, setLevelIndex] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const BASE_WIDTH = 1100
  const BASE_HEIGHT = 750

  // Pick a word by index or randomly
  const pickWord = (idx?: number) => {
    if (typeof idx === "number") return WORDS[idx % WORDS.length]
    return WORDS[Math.floor(Math.random() * WORDS.length)]
  }

  useEffect(() => {
    // Initialize with a random word and set corresponding level index
    const initial = pickWord()
    setTargetWord(initial)
    const i = WORDS.indexOf(initial)
    setLevelIndex(i >= 0 ? i : 0)
    setGuessed(new Set())
    setWrong(0)
    setStatus("playing")
  }, [])

  // Compute scale so that the designed base size fits viewport
  useEffect(() => {
    const computeScale = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / BASE_WIDTH, vh / BASE_HEIGHT)
      // avoid upscaling beyond 1 to preserve crispness
      setScale(Math.min(1, s))
    }
    computeScale()
    window.addEventListener("resize", computeScale)
    return () => window.removeEventListener("resize", computeScale)
  }, [])

  const reset = () => {
    setGuessed(new Set())
    setWrong(0)
    setStatus("playing")
    setIsPaused(false)
    setShowSidebar(false)
  }

  const nextWord = () => {
    const nextIndex = (levelIndex + 1) % WORDS.length
    setLevelIndex(nextIndex)
    setTargetWord(pickWord(nextIndex))
    setGuessed(new Set())
    setWrong(0)
    setStatus("playing")
    setIsPaused(false)
    setShowSidebar(false)
  }

  const display = useMemo(() => {
    if (!targetWord) return ""
    return targetWord
      .split("")
      .map((ch) => (guessed.has(ch) ? ch : "_"))
      .join(" ")
  }, [targetWord, guessed])

  useEffect(() => {
    if (!targetWord || status !== "playing") return
    const hasWon = targetWord.split("").every((ch) => guessed.has(ch))
    if (hasWon) setStatus("won")
    else if (wrong >= MAX_WRONG) setStatus("lost")
  }, [guessed, wrong, targetWord, status])

  const onGuess = (letter: string) => {
    if (status !== "playing" || isPaused) return
    if (guessed.has(letter)) return
    const next = new Set(guessed)
    next.add(letter)
    setGuessed(next)
    if (!targetWord.includes(letter)) {
      setWrong((w) => w + 1)
    }
  }

  const togglePause = () => {
    setIsPaused((p) => {
      const next = !p
      setShowSidebar(next)
      return next
    })
  }

  const toggleMute = () => setIsMuted((m) => !m)

  // Simple SVG hangman: gallows + 6 body parts
  const HangmanSVG = ({ wrong }: { wrong: number }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Gallows */}
      <line x1="20" y1="180" x2="160" y2="180" stroke="#654321" strokeWidth="6" />
      <line x1="40" y1="180" x2="40" y2="20" stroke="#654321" strokeWidth="6" />
      <line x1="40" y1="20" x2="120" y2="20" stroke="#654321" strokeWidth="6" />
      <line x1="120" y1="20" x2="120" y2="40" stroke="#654321" strokeWidth="6" />

      {/* Body parts appear with wrong count */}
      {wrong > 0 && <circle cx="120" cy="55" r="15" stroke="#fff" strokeWidth="4" fill="none" />}
      {wrong > 1 && <line x1="120" y1="70" x2="120" y2="110" stroke="#fff" strokeWidth="4" />}
      {wrong > 2 && <line x1="120" y1="80" x2="100" y2="95" stroke="#fff" strokeWidth="4" />}
      {wrong > 3 && <line x1="120" y1="80" x2="140" y2="95" stroke="#fff" strokeWidth="4" />}
      {wrong > 4 && <line x1="120" y1="110" x2="105" y2="135" stroke="#fff" strokeWidth="4" />}
      {wrong > 5 && <line x1="120" y1="110" x2="135" y2="135" stroke="#fff" strokeWidth="4" />}
    </svg>
  )

  const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]

  return (
    <div className="h-screen w-screen relative text-white overflow-hidden flex items-center justify-center">
      {/* Full-viewport background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/10148867.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Pause Sidebar Controls (viewport-fixed, copied style from LabellingGame) */}
      <div
        className={`fixed top-2 left-2 z-[60] transition-all duration-300 ${
          showSidebar ? "w-14 sm:w-16 lg:w-20" : "w-10 sm:w-12 lg:w-16"
        }`}
      >
        <div className="flex flex-col items-center gap-2 sm:gap-4 lg:gap-6">
          <button
            onClick={togglePause}
            className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center transition-colors shadow-lg"
            aria-label={showSidebar ? "Resume game" : "Pause game"}
          >
            {showSidebar ? (
              <Play className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-white" />
            ) : (
              <Pause className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-white" />
            )}
          </button>
          {showSidebar && (
            <>
              <button
                onClick={toggleMute}
                className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full ${
                  isMuted ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                } flex items-center justify-center transition-colors shadow-lg`}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 lg:w-10 lg:h-10 text-white" />
                ) : (
                  <Music className="w-5 h-5 sm:w-6 sm:h-6 lg:w-10 lg:h-10 text-white" />
                )}
              </button>
              <button
                onClick={reset}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors shadow-lg"
                aria-label="Reset game"
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 lg:w-10 lg:h-10 text-white" />
              </button>
              <button
                onClick={nextWord}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors shadow-lg"
                aria-label="Next level"
              >
                <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 lg:w-10 lg:h-10 text-white" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scaled game canvas with fixed base size */}
      <div
        ref={containerRef}
        style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${scale})`, transformOrigin: "top center" }}
        className="relative z-10 will-change-transform"
      >
        
        {/* Header */}
        <div className="w-full pt-2 pb-2">
          <h1 className="text-center luckiest-guy-regular text-[42px] tracking-wide drop-shadow-lg">
            HANGMAN GAME
          </h1>
        </div>

        {/* Main layout: two columns filling remaining height */}
        <div style={{ height: BASE_HEIGHT - 86 }} className="px-4 grid grid-cols-2 gap-6">
          {/* Left: Word on wood board + keyboard */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0a1a2f] to-[#0b1220] p-5 border border-white/10 flex flex-col">
            {/* Wood board word area */}
            <div
              className="relative mx-auto w-full max-w-[520px] rounded-xl shadow-lg"
              style={{
                backgroundImage: "url('/wood_board 1.svg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "180px",
              }}
            >
              <div className="absolute inset-0 bg-black/10 rounded-xl" />
              <div className="relative z-10 flex items-center justify-center h-full px-6 py-8">
                <div className="text-center luckiest-guy-regular text-4xl tracking-wider">
                  {display}
                </div>
              </div>
            </div>

            {/* Status / CTA */}
            <div className="mt-3 text-center min-h-[28px]">
              {status === "won" && (
                <div className="text-green-400 font-semibold">Nice! You guessed it!</div>
              )}
              {status === "lost" && (
                <div className="text-rose-400 font-semibold">Oops! The word was {targetWord}</div>
              )}
            </div>

            {/* QWERTY Keyboard (left side) */}
            <div className="mt-2 flex flex-col items-center gap-2">
              {KEY_ROWS.map((row) => (
                <div key={row} className="flex gap-2">
                  {row.split("").map((l) => {
                    const used = guessed.has(l)
                    return (
                      <button
                        key={l}
                        onClick={() => onGuess(l)}
                        disabled={used || status !== "playing" || isPaused}
                        className={`btn-3d-red btn-compact w-10 ${
                          used ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
                        }`}
                      >
                        {l}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-center gap-3">
              {(status === "won" || status === "lost") && (
                <button onClick={reset} className="btn-3d-red">
                  Play Again
                </button>
              )}
              {status === "playing" && (
                <button onClick={reset} className="btn-3d-red" title="Reset current round">
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Right: Gallows & figure with counter */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0a1a2f] to-[#0b1220] p-5 border border-white/10 flex flex-col">
            <div className="flex-1">
              <div className="aspect-[1/1] w-full max-w-[420px] mx-auto">
                <HangmanSVG wrong={wrong} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm uppercase tracking-widest opacity-80">Wrong guesses</div>
              <div className="text-xl font-bold luckiest-guy-regular">{wrong} / {MAX_WRONG}</div>
            </div>
          </div>
        </div>

        

        {/* Pause Overlay */}
        {isPaused && status === "playing" && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
            <div className="bg-white/95 text-black rounded-xl p-6 shadow-xl text-center">
              <div className="text-2xl font-bold mb-4">Paused</div>
              <button onClick={togglePause} className="btn-3d-red">Resume</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
