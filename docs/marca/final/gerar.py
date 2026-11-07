"""Gera o kit da marca CronôBR (logo 2, "C de tempo"): SVG vetoriais + PNG.

Uso: python3 -I docs/marca/final/gerar.py
Requer: fontTools e Playwright (Chromium) para rasterizar. Não editar os PNG à mão: mude aqui e rode de novo.
"""
import asyncio, base64, math, os, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

AQUI = pathlib.Path(__file__).resolve().parent
LARANJA, BRANCO, PRETO = "#FF6B35", "#FFFFFF", "#121212"
CHROME = os.environ.get("CHROME", "/root/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome")

# ---------- símbolo (grade 1024) ----------
def simbolo(cor, escala=1.0, cx=512, cy=512):
    """C feito de arco de progresso + play dentro. escala reduz para caber na zona segura."""
    r, w = 290 * escala, 150 * escala
    a = math.radians(42)  # meia abertura do C, à direita
    x1, y1 = cx + r * math.cos(-a), cy + r * math.sin(-a)
    x2, y2 = cx + r * math.cos(a), cy + r * math.sin(a)
    arco = (f'<path d="M{x1:.1f},{y1:.1f} A{r:.1f},{r:.1f} 0 1 0 {x2:.1f},{y2:.1f}" '
            f'fill="none" stroke="{cor}" stroke-width="{w:.1f}" stroke-linecap="butt"/>')
    s = 138 * escala  # play: triângulo equilátero com cantos arredondados
    px = cx + 12 * escala
    pts = [(px - s * 0.55, cy - s), (px - s * 0.55, cy + s), (px + s * 1.05, cy)]
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"
    play = (f'<path d="{d}" fill="{cor}" stroke="{cor}" stroke-width="{36*escala:.1f}" '
            f'stroke-linejoin="round"/>')
    return arco + play

def svg(conteudo, w, h):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f"{conteudo}</svg>\n")

def icone(fundo=LARANJA, marca=BRANCO, raio=230):
    bg = f'<rect width="1024" height="1024" rx="{raio}" fill="{fundo}"/>' if fundo else ""
    return svg(bg + simbolo(marca), 1024, 1024)

# ---------- wordmark em curvas (não depende da fonte instalada) ----------
FONTE = TTFont(AQUI / "fonte" / "Poppins-Bold.ttf")
GS, CMAP, UPM = FONTE.getGlyphSet(), FONTE.getBestCmap(), FONTE["head"].unitsPerEm
ASC = FONTE["OS/2"].sCapHeight or 700

def texto(partes, x0, base, tam, track=-0.01):
    """partes: [(texto, cor)]. Retorna (svg, largura)."""
    k, x, out = tam / UPM, x0, []
    for txt, cor in partes:
        for ch in txt:
            g = CMAP[ord(ch)]
            pen = SVGPathPen(GS)
            GS[g].draw(TransformPen(pen, (k, 0, 0, -k, x, base)))
            out.append(f'<path d="{pen.getCommands()}" fill="{cor}"/>')
            x += GS[g].width * k + track * tam
    return "".join(out), x - x0

def lockup(cor_texto, fundo=None):
    h, tam = 300, 190
    ic = f'<g transform="translate(30,30) scale({240/1024})">' \
         f'<rect width="1024" height="1024" rx="230" fill="{LARANJA}"/>{simbolo(BRANCO)}</g>'
    base = 150 + ASC * tam / UPM / 2
    t, larg = texto([("Cronô", cor_texto), ("BR", LARANJA)], 310, base, tam)
    w = int(310 + larg + 40)
    bg = f'<rect width="{w}" height="{h}" fill="{fundo}"/>' if fundo else ""
    return svg(bg + ic + t, w, h)

def wordmark(cor_texto):
    tam = 200
    t, larg = texto([("Cronô", cor_texto), ("BR", LARANJA)], 20, 230, tam)
    return svg(t, int(larg + 40), 300)

def og():
    w, h = 1200, 630
    ic = f'<g transform="translate(110,175) scale({280/1024})">' \
         f'<rect width="1024" height="1024" rx="230" fill="{LARANJA}"/>{simbolo(BRANCO)}</g>'
    t, _ = texto([("Cronô", BRANCO), ("BR", LARANJA)], 440, 330, 150)
    sub, _ = texto([("Tabata e HIIT", "#B0B0B0")], 446, 430, 60, 0)
    return svg(f'<rect width="{w}" height="{h}" fill="{PRETO}"/>' + ic + t + sub, w, h)

SVGS = {
    "icone.svg": icone(),
    "icone-escuro.svg": icone(PRETO, LARANJA),
    "simbolo-laranja.svg": svg(simbolo(LARANJA), 1024, 1024),
    "simbolo-branco.svg": svg(simbolo(BRANCO), 1024, 1024),
    "simbolo-preto.svg": svg(simbolo(PRETO), 1024, 1024),
    "lockup-fundo-escuro.svg": lockup(BRANCO),
    "lockup-fundo-claro.svg": lockup(PRETO),
    "wordmark-fundo-escuro.svg": wordmark(BRANCO),
    "wordmark-fundo-claro.svg": wordmark(PRETO),
    "og-1200x630.svg": og(),
}
# Android adaptativo: 108dp com 72dp visíveis -> marca a ~60% dentro da zona segura
APP = {
    "icon.png": (icone(raio=0), 1024),
    "android-icon-foreground.png": (svg(simbolo(BRANCO, 0.6), 1024, 1024), 512),
    "android-icon-background.png": (svg(f'<rect width="1024" height="1024" fill="{LARANJA}"/>', 1024, 1024), 512),
    "android-icon-monochrome.png": (svg(simbolo(BRANCO, 0.6), 1024, 1024), 432),
    "splash-icon.png": (svg(simbolo(BRANCO, 0.9), 1024, 1024), 1024),
    "favicon.png": (icone(), 196),
}
PNGS = [("icone.svg", s) for s in (1024, 512, 192, 48)] + [
    ("lockup-fundo-escuro.svg", 2), ("lockup-fundo-claro.svg", 2), ("simbolo-laranja.svg", 512),
    ("og-1200x630.svg", 1)]

async def rasterizar(trabalhos):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        pg = await b.new_page()
        for conteudo, destino, px in trabalhos:
            w0, h0 = [int(v) for v in conteudo.split('width="')[1].split('"')[0:1] +
                      conteudo.split('height="')[1].split('"')[0:1]]
            w, h = (w0 * px, h0 * px) if px < 10 else (px, round(h0 * px / w0))
            await pg.set_viewport_size({"width": w, "height": h})
            html = (f'<html><body style="margin:0;background:transparent">'
                    f'<img src="data:image/svg+xml;base64,{base64.b64encode(conteudo.encode()).decode()}" '
                    f'style="width:{w}px;height:{h}px;display:block"></body></html>')
            await pg.set_content(html)
            await pg.screenshot(path=str(destino), omit_background=True)
        await b.close()

def main():
    for d in ("svg", "png", "app"):
        (AQUI / d).mkdir(exist_ok=True)
    for nome, conteudo in SVGS.items():
        (AQUI / "svg" / nome).write_text(conteudo, encoding="utf-8")
    jobs = []
    for nome, px in PNGS:
        sufixo = f"-{px}" if px >= 10 else (f"@{px}x" if px > 1 else "")
        jobs.append((SVGS[nome], AQUI / "png" / nome.replace(".svg", f"{sufixo}.png"), px))
    for nome, (conteudo, px) in APP.items():
        jobs.append((conteudo, AQUI / "app" / nome, px))
    asyncio.run(rasterizar(jobs))
    print(f"{len(SVGS)} SVG, {len(jobs)} PNG em {AQUI}")

if __name__ == "__main__":
    main()
