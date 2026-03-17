export type SlideType = 'SETTINGS' | 'TOPIC' | 'QUESTION' | 'MEDIA' | 'LEADERBOARD' | 'POLL' | 'PODIUM';

export interface Player {
  id: string;
  name: string;
  team: string; // "הנמרים", "הכרישים", "האריות" (Tigers, Sharks, Lions)
  joinedAt: number;
  score: number;
}

export interface SlideData {
  type: SlideType;
  content: string; // The topic, question text, or media title
  options?: string[]; // Array of 4 options (for questions/polls)
  correctOption?: number; // Index 0-3
  modifier?: number; // BasePoints multiplier (1 for J1, 2 for J2, 3 for J3)
  mediaUrl?: string; // YouTube or Image Link
}

export interface GameState {
  roomCode: string;
  hostId: string | null;
  players: Record<string, Player>;
  teams: string[]; // List of available teams from SETTINGS row
  
  slides: SlideData[];
  currentSlideIndex: number;
  jokerModeEnabled: boolean;
  
  // Active Question State
  isQuestionActive: boolean;
  questionStartTime: number | null;
  baseTimeAllowed: number; // e.g., 30 seconds
  answers: Record<string, number>; // playerId -> optionIndex
  answerTimes: Record<string, number>; // playerId -> timeRemaining when answered
}

export interface ClientToServerEvents {
  join: (data: { room: string; role: 'host' | 'player' | 'screen'; name?: string; team?: string }) => void;
  answer: (data: { room: string; answer: number; timeRemaining: number }) => void;
  changeSlide: (data: { room: string; slideIndex: number }) => void;
  toggleJoker: (data: { room: string; enabled: boolean }) => void;
  playSound: (data: { room: string; sound: string }) => void;
  syncState: (data: { room: string; state: GameState }) => void; // Host forcibly sets/syncs the entire state
  startQuestion: (data: { room: string; baseTimeAllowed: number }) => void;
  stopQuestion: (data: { room: string }) => void;
}

export interface ServerToClientEvents {
  playerJoined: (player: Player) => void;
  playerAnswered: (data: { playerId: string; answer: number; timeRemaining: number }) => void;
  slideChanged: (slideIndex: number) => void;
  jokerModeToggled: (enabled: boolean) => void;
  playSound: (sound: string) => void;
  gameStateSynced: (state: GameState) => void; // When state is broadcast
  questionStarted: (baseTimeAllowed: number) => void;
  questionStopped: () => void;
  error: (msg: string) => void;
}
