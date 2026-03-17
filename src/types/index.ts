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
  hostCode: string;
  hostConnected: boolean;
  screenId: string;
  players: Record<string, Player>;
  teams: string[];
  
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
  createRoom: (data: { slides: SlideData[], teams: string[] }, callback: (res: { roomCode: string, hostCode: string }) => void) => void;
  joinPlayer: (data: { roomCode: string; name: string }, callback: (res: { success: boolean, error?: string }) => void) => void;
  joinHost: (data: { hostCode: string }, callback: (res: { success: boolean, roomCode?: string, error?: string }) => void) => void;
  
  answer: (data: { roomCode: string; answer: number; timeRemaining: number }) => void;
  changeSlide: (data: { roomCode: string; slideIndex: number }) => void;
  toggleJoker: (data: { roomCode: string; enabled: boolean }) => void;
  playSound: (data: { roomCode: string; sound: string }) => void;
  syncState: (data: { roomCode: string; state: GameState }) => void; // Optional if host wants to override entirely
  startQuestion: (data: { roomCode: string; baseTimeAllowed: number }) => void;
  stopQuestion: (data: { roomCode: string }) => void;
}

export interface ServerToClientEvents {
  playerJoined: (player: Player) => void;
  hostJoined: () => void;
  playerAnswered: (data: { playerId: string; answer: number; timeRemaining: number }) => void;
  slideChanged: (slideIndex: number) => void;
  jokerModeToggled: (enabled: boolean) => void;
  playSound: (sound: string) => void;
  gameStateSynced: (state: GameState) => void; 
  questionStarted: (baseTimeAllowed: number) => void;
  questionStopped: () => void;
  error: (msg: string) => void;
}
