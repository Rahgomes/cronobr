// Línguas do aparelho, da preferida para a menos. Isolado para os testes trocarem.
import { getLocales } from 'expo-localization';

export function deviceLanguageTags(): string[] {
  try {
    return getLocales().map((l) => l.languageTag);
  } catch {
    return [];
  }
}
