#!/bin/bash
# uso: gerar.sh <nome> "<assunto>"
nome=$1; assunto=$2
prompt="Use your image generation tool to create exactly ONE image, 1024x1536 portrait. Do not write code or files. Reply only with the generated file path.

A moody, cinematic fitness PHOTOGRAPH for a workout app card background. Subject: ${assunto}. Dark gym or urban setting, low-key lighting, desaturated colors with a subtle warm orange rim light, shallow depth of field, realistic photo (not illustration, not 3D render). The subject sits in the UPPER two thirds; the BOTTOM third is darker and calm (floor or shadow) so white text can be overlaid later. Absolutely NO text, letters, numbers, logos, watermarks or brand marks anywhere, including on clothes and equipment. Adult athlete, natural body, Brazilian look, respectful and non-sexualized."
codex exec --skip-git-repo-check "$prompt" < /dev/null > "$nome.log" 2>&1
grep -o '/root/.codex/generated_images/[^ ]*\.png' "$nome.log" | tail -1 > "$nome.path"
