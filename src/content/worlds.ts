export type WorldTheme = "village" | "volcano";
export type SpriteKind = "oda" | "rin" | "traveler" | "villager" | "bell" | "well" | "hound" | "gate" | "cave" | "machine" | "warden";

export interface WorldTarget {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
  readonly speaker: string;
  readonly kind: SpriteKind;
  readonly x: number;
  readonly y: number;
}

export interface AmbientCharacter {
  readonly label: string;
  readonly kind: Extract<SpriteKind, "oda" | "rin" | "traveler" | "villager">;
  readonly x: number;
  readonly y: number;
}

export interface WorldPresentation {
  readonly theme: WorldTheme;
  readonly placeName: string;
  readonly spawn: { readonly x: number; readonly y: number };
  readonly target: WorldTarget;
  readonly ambient: readonly AmbientCharacter[];
}

const villageAmbient: readonly AmbientCharacter[] = [
  { label: "Mira", kind: "villager", x: 620, y: 410 },
  { label: "Tomas", kind: "villager", x: 748, y: 328 },
  { label: "Lio", kind: "villager", x: 332, y: 530 },
];

const volcanoAmbient: readonly AmbientCharacter[] = [
  { label: "De reiziger", kind: "traveler", x: 660, y: 302 },
];

const villageTargets: Readonly<Record<string, WorldTarget>> = {
  morning: { id: "oda", label: "Oda", prompt: "Praat met Oda", speaker: "Oda", kind: "oda", x: 514, y: 367 },
  bell: { id: "bell", label: "Klokkentoren", prompt: "Bekijk de bronzen bellen", speaker: "Oda", kind: "bell", x: 794, y: 218 },
  bakery: { id: "rin", label: "Rin", prompt: "Praat met Rin", speaker: "Rin", kind: "rin", x: 330, y: 305 },
  square: { id: "hound", label: "Asbeest", prompt: "Stel je op tegen het asbeest", speaker: "Oda", kind: "hound", x: 964, y: 386 },
  well: { id: "well", label: "Oude waterput", prompt: "Onderzoek de waterput", speaker: "Rin", kind: "well", x: 594, y: 515 },
  gate: { id: "traveler", label: "Gemaskerde reiziger", prompt: "Help de reiziger", speaker: "De reiziger", kind: "traveler", x: 1115, y: 274 },
  evacuation: { id: "oda-evacuation", label: "Oda", prompt: "Praat met Oda", speaker: "Oda", kind: "oda", x: 906, y: 572 },
  ending: { id: "hill-bell", label: "De bel van Veldhaven", prompt: "Sla de bel", speaker: "Oda", kind: "bell", x: 1058, y: 126 },
};

const volcanoTargets: Readonly<Record<string, WorldTarget>> = {
  trailhead: { id: "cave", label: "Oude mijningang", prompt: "Ga de grot in", speaker: "De reiziger", kind: "cave", x: 1010, y: 318 },
  "first-gate": { id: "echo-gate", label: "Echohal", prompt: "Onderzoek de drukplaten", speaker: "De reiziger", kind: "gate", x: 791, y: 244 },
  "ash-hounds": { id: "hound-pair", label: "Lavahonden", prompt: "Benader de lavahonden", speaker: "De reiziger", kind: "hound", x: 924, y: 418 },
  observatory: { id: "machine-map", label: "Basaltmodel", prompt: "Bekijk het basaltmodel", speaker: "De reiziger", kind: "machine", x: 623, y: 195 },
  "hollow-garden": { id: "waterwheels", label: "Warme waterwielen", prompt: "Onderzoek de waterwielen", speaker: "De reiziger", kind: "machine", x: 360, y: 535 },
  "garden-guard": { id: "garden-hounds", label: "Gloeiende wachters", prompt: "Trotseer de wachters", speaker: "Aven", kind: "hound", x: 548, y: 470 },
  faultline: { id: "pressure-gates", label: "Druksluizen", prompt: "Bestudeer de sluizen", speaker: "De reiziger", kind: "gate", x: 1045, y: 178 },
  "lava-warden": { id: "warden", label: "Lavawachter", prompt: "Daag de wachter uit", speaker: "De reiziger", kind: "warden", x: 1048, y: 452 },
  "heart-chamber": { id: "heart-machine", label: "Hartmachine", prompt: "Stabiliseer de machine", speaker: "Aven", kind: "machine", x: 735, y: 348 },
  descent: { id: "southern-path", label: "Zuidelijke uitgang", prompt: "Keer terug naar Veldhaven", speaker: "Aven", kind: "cave", x: 290, y: 610 },
};

export function worldForScene(storyId: string, sceneId: string): WorldPresentation {
  const village = storyId === "01-village-bells";
  const target = (village ? villageTargets : volcanoTargets)[sceneId];
  if (!target) throw new Error("No world target configured for scene " + sceneId);

  return {
    theme: village ? "village" : "volcano",
    placeName: village ? "Veldhaven" : "De holle Asberg",
    spawn: village ? { x: 452, y: 442 } : { x: 236, y: 490 },
    target,
    ambient: village ? villageAmbient : volcanoAmbient,
  };
}
