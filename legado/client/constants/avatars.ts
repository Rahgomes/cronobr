import { Feather } from "@expo/vector-icons";

export interface Avatar {
  id: number;
  icon: keyof typeof Feather.glyphMap;
  labelKey: string;
  gender: "male" | "female";
}

export const avatars: Avatar[] = [
  { id: 0, icon: "activity", labelKey: "avatar.runner", gender: "male" },
  { id: 1, icon: "target", labelKey: "avatar.target", gender: "male" },
  { id: 2, icon: "zap", labelKey: "avatar.power", gender: "male" },
  { id: 3, icon: "award", labelKey: "avatar.champion", gender: "male" },
  { id: 4, icon: "shield", labelKey: "avatar.warrior", gender: "male" },
  { id: 5, icon: "star", labelKey: "avatar.star", gender: "male" },
  { id: 6, icon: "heart", labelKey: "avatar.heart", gender: "female" },
  { id: 7, icon: "sun", labelKey: "avatar.sun", gender: "female" },
  { id: 8, icon: "moon", labelKey: "avatar.moon", gender: "female" },
  { id: 9, icon: "feather", labelKey: "avatar.feather", gender: "female" },
  { id: 10, icon: "droplet", labelKey: "avatar.water", gender: "female" },
  { id: 11, icon: "cloud", labelKey: "avatar.cloud", gender: "female" },
];

export const avatarLabels: Record<string, Record<string, string>> = {
  "pt-BR": {
    "avatar.runner": "Corredor",
    "avatar.target": "Focado",
    "avatar.power": "Forca",
    "avatar.champion": "Campeao",
    "avatar.warrior": "Guerreiro",
    "avatar.star": "Estrela",
    "avatar.heart": "Coracao",
    "avatar.sun": "Sol",
    "avatar.moon": "Lua",
    "avatar.feather": "Leve",
    "avatar.water": "Agua",
    "avatar.cloud": "Nuvem",
  },
  en: {
    "avatar.runner": "Runner",
    "avatar.target": "Focused",
    "avatar.power": "Power",
    "avatar.champion": "Champion",
    "avatar.warrior": "Warrior",
    "avatar.star": "Star",
    "avatar.heart": "Heart",
    "avatar.sun": "Sun",
    "avatar.moon": "Moon",
    "avatar.feather": "Feather",
    "avatar.water": "Water",
    "avatar.cloud": "Cloud",
  },
  es: {
    "avatar.runner": "Corredor",
    "avatar.target": "Enfocado",
    "avatar.power": "Fuerza",
    "avatar.champion": "Campeon",
    "avatar.warrior": "Guerrero",
    "avatar.star": "Estrella",
    "avatar.heart": "Corazon",
    "avatar.sun": "Sol",
    "avatar.moon": "Luna",
    "avatar.feather": "Pluma",
    "avatar.water": "Agua",
    "avatar.cloud": "Nube",
  },
  fr: {
    "avatar.runner": "Coureur",
    "avatar.target": "Concentre",
    "avatar.power": "Force",
    "avatar.champion": "Champion",
    "avatar.warrior": "Guerrier",
    "avatar.star": "Etoile",
    "avatar.heart": "Coeur",
    "avatar.sun": "Soleil",
    "avatar.moon": "Lune",
    "avatar.feather": "Plume",
    "avatar.water": "Eau",
    "avatar.cloud": "Nuage",
  },
};

export function getAvatarLabel(labelKey: string, language: string): string {
  return avatarLabels[language]?.[labelKey] || avatarLabels["pt-BR"][labelKey] || labelKey;
}
