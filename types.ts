export enum Role {
  GODFATHER = 'رئیس مافیا',
  SIMPLE_MAFIA = 'مافیای ساده',
  DOCTOR = 'دکتر',
  DETECTIVE = 'کارآگاه',
  CITIZEN = 'شهروند ساده',
}

export const MafiaRoles = [Role.GODFATHER, Role.SIMPLE_MAFIA];
export const CitizenRoles = [Role.DOCTOR, Role.DETECTIVE, Role.CITIZEN];

export interface Player {
  id: number;
  name: string;
  role: Role;
  isAlive: boolean;
  // برای پیگیری استعلام‌های کارآگاه از رئیس مافیا
  inquiredByDetectiveCount: number;
}

export enum GamePhase {
  SETUP = 'SETUP',
  ROLE_REVEAL = 'ROLE_REVEAL',
  NIGHT = 'NIGHT',
  DAY_DISCUSSION = 'DAY_DISCUSSION',
  DAY_VOTE_NOMINATION = 'DAY_VOTE_NOMINATION',
  DAY_VOTE_TIEBREAKER = 'DAY_VOTE_TIEBREAKER',
  DAY_TRIAL = 'DAY_TRIAL',
  DAY_VOTE_FINAL = 'DAY_VOTE_FINAL',
  END = 'END',
}

export interface NightActions {
  mafiaShot: string | null;
  doctorSave: string | null;
  detectiveInquiry: string | null;
}

export interface NightResult {
  eliminated: { player: Player; reason: string }[];
  log: string[];
  detectiveResult?: {
    target: string;
    isMafia: boolean;
  };
  isEmergency: boolean;
}