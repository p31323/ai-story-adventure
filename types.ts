export type ResponseLength = 'short' | 'medium' | 'long' | 'extra-long';
export type SetupFieldType = 'player' | 'partner' | 'world';
export type ModelQuality = 'fast' | 'high';

export interface SecondaryCharacter {
  id: string;
  name: string;
  description: string;
}

export interface InnerThoughts {
  monologue: string;
  relationship: string;
}

export interface Scenario {
  playerName: string;
  playerGender: string;
  playerDescription: string;
  openingPlot: string;
  worldView: string;
  partnerName: string;
  partnerGender: string;
  partnerDescription: string;
  backgroundImage: string; // Base64 encoded image data URL
  secondaryCharacters: SecondaryCharacter[];
  modelQuality: ModelQuality;
  mockMode: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'system' | 'ai';
  characterName?: string; // The name of the AI character speaking. If undefined, it's narration.
  text: string;
}

export interface PlotChoice {
    title: string;
    description: string;
}

export interface SaveData {
  scenario: Scenario;
  chatHistory: ChatMessage[];
  savedAt: string; // ISO string
}
