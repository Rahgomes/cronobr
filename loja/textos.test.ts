import { readFileSync, writeFileSync } from 'node:fs';

import { PRESETS } from '@/domain/presets';
import { MODALITIES } from '@/domain/routine';
import { TIMERS_MAX } from '@/domain/timers';
import { en } from '@/i18n/messages/en';
import { es } from '@/i18n/messages/es';
import { fr } from '@/i18n/messages/fr';
import { pt, type Messages } from '@/i18n/messages/pt';

import { LISTINGS, STORE_LIMITS, type Listing, type StoreLanguage } from './textos';

const MESSAGES: Record<StoreLanguage, Messages> = {
  'pt-BR': pt,
  'en-US': en,
  'es-ES': es,
  'fr-FR': fr,
};

/** Contagem como as lojas: por caractere (ponto de código), não por unidade UTF-16. */
const chars = (text: string) => Array.from(text).length;
const bytes = (text: string) => new TextEncoder().encode(text).length;
const all = (l: Listing) => [l.name, l.short, l.subtitle, l.promo, l.description, l.whatsNew];

describe.each(LISTINGS.map((l) => [l.language, l] as const))('loja %s', (_, listing) => {
  const m = MESSAGES[listing.language];

  it('cabe nos limites atuais de cada campo', () => {
    expect(chars(listing.name)).toBeLessThanOrEqual(STORE_LIMITS.name);
    expect(chars(listing.short)).toBeLessThanOrEqual(STORE_LIMITS.short);
    expect(chars(listing.subtitle)).toBeLessThanOrEqual(STORE_LIMITS.subtitle);
    expect(chars(listing.promo)).toBeLessThanOrEqual(STORE_LIMITS.promo);
    expect(chars(listing.description)).toBeLessThanOrEqual(STORE_LIMITS.description);
    expect(chars(listing.whatsNew)).toBeLessThanOrEqual(STORE_LIMITS.whatsNew);
    expect(bytes(listing.keywords)).toBeLessThanOrEqual(STORE_LIMITS.keywordsBytes);
  });

  it('palavras-chave: sem espaço, sem repetir o nome, cada uma com 3 letras ou mais', () => {
    const words = listing.keywords.split(',');
    expect(listing.keywords).not.toMatch(/\s/);
    expect(new Set(words).size).toBe(words.length);
    for (const word of words) {
      expect(chars(word)).toBeGreaterThanOrEqual(STORE_LIMITS.keywordMin);
      // O nome já conta na busca: repetir gasta bytes.
      expect(listing.name.toLowerCase()).not.toContain(word);
    }
  });

  it('marca com acento, sem travessão, sem prometer segundo plano ilimitado', () => {
    for (const text of all(listing)) {
      expect(text).not.toMatch(/CronoBR/);
      expect(text).not.toContain('—');
      expect(text).not.toMatch(/ilimitad|unlimited|illimit/i);
    }
    expect(listing.name).toMatch(/^CronôBR/);
  });

  it('números iguais aos do app', () => {
    expect(listing.description).toContain(`${String(PRESETS.length)} `);
    expect(listing.description).toContain(` ${String(MODALITIES.length)} `);
    expect(listing.description).toContain(` ${String(TIMERS_MAX)} `);
  });

  it('instruções de backup com os nomes de botão que o app mostra', () => {
    const path = `${m.settings.title} > ${m.settings.backup} >`;
    expect(listing.description).toContain(`${path} ${m.transfer.export}`);
    expect(listing.description).toContain(`${path} ${m.transfer.openFile}`);
    expect(listing.description).toContain(m.transfer.includeHistory);
    expect(listing.description).toContain(m.transfer.merge);
    expect(listing.description).toContain(m.transfer.replaceAll);
  });

  it('tela bloqueada só com a condição dita: permissão e o sistema podendo atrasar', () => {
    expect(listing.description).toMatch(/notifica/i);
    expect(listing.description).toMatch(/atrasar|delay|retrasar|retarder/);
  });

  it('anúncio declarado, e fora do treino', () => {
    expect(listing.description).toMatch(/anúncio|ads|anuncio|annonce/i);
  });
});

function render(): string {
  const out = [
    '# Textos das lojas (versão candidata)',
    '',
    'Gerado de `loja/textos.ts` por `UPDATE_LOJAS=1 npx jest loja`. Não editar à mão: o teste',
    'confere limites, números e nomes de botão, e falha se este arquivo ficar diferente da fonte.',
    '',
  ];
  for (const l of LISTINGS) {
    out.push(
      `## ${l.language}`,
      '',
      '| Campo | Texto | Tamanho |',
      '| --- | --- | --- |',
      `| Nome (Play e App Store) | ${l.name} | ${String(chars(l.name))}/${String(STORE_LIMITS.name)} |`,
      `| Descrição curta (Play) | ${l.short} | ${String(chars(l.short))}/${String(STORE_LIMITS.short)} |`,
      `| Subtítulo (App Store) | ${l.subtitle} | ${String(chars(l.subtitle))}/${String(STORE_LIMITS.subtitle)} |`,
      `| Texto promocional (App Store) | ${l.promo} | ${String(chars(l.promo))}/${String(STORE_LIMITS.promo)} |`,
      `| Palavras-chave (App Store) | ${l.keywords} | ${String(bytes(l.keywords))}/${String(STORE_LIMITS.keywordsBytes)} bytes |`,
      `| Novidades 2.0.0 | ${l.whatsNew} | ${String(chars(l.whatsNew))}/${String(STORE_LIMITS.whatsNew)} |`,
      '',
      `Descrição completa (${String(chars(l.description))}/${String(STORE_LIMITS.description)}):`,
      '',
      '```text',
      l.description,
      '```',
      '',
    );
  }
  return out.join('\n');
}

it('docs/lojas/textos.md igual à fonte', () => {
  const text = render();
  // Caminho a partir da raiz do repositório (onde o Jest roda).
  if (process.env.UPDATE_LOJAS === '1') writeFileSync('docs/lojas/textos.md', text);
  expect(readFileSync('docs/lojas/textos.md', 'utf8')).toBe(text);
});
