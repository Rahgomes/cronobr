# SPEC – [Título da Funcionalidade]
ID: feature-[nome]-[contador]  
Versão: [vX.Y]  
Baseado no PRD: /docs/prd/feature-[nome]-[contador].md  

---

# 1. Arquitetura e Estratégia
Descreva o impacto técnico e como a funcionalidade será implementada no projeto atual.

[Exemplo]:  
A remoção individual do histórico será implementada via função no HistoryProvider e um botão em cada HistoryListItem.

---

# 2. Arquivos Envolvidos

## 2.1 Criar
- [exemplo] `client/components/HistoryItemDeleteButton.tsx`  
- [exemplo] `client/components/MenuCloseButton.tsx`

## 2.2 Modificar
- `client/screens/HistoryScreen.tsx`  
- `client/screens/HomeScreen.tsx`  
- `client/screens/SoundSettingsScreen.tsx`  
- `client/navigation/RootStackNavigator.tsx`  
- `client/lib/i18n.ts`  
- `client/contexts/HistoryProvider.tsx`

---

# 3. Tipos / Interfaces TypeScript
Liste todas as interfaces ou tipos a serem criados ou expandidos.

<div class="widget code-container remove-before-copy"><div class="code-header non-draggable"><span class="iaf s13 w700 code-language-placeholder">ts</span><div class="code-copy-button"><span class="iaf s13 w500 code-copy-placeholder">Copiar</span><img class="code-copy-icon" src="data:image/svg+xml;utf8,%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%3E%0A%20%20%3Cpath%20d%3D%22M10.8%208.63V11.57C10.8%2014.02%209.82%2015%207.37%2015H4.43C1.98%2015%201%2014.02%201%2011.57V8.63C1%206.18%201.98%205.2%204.43%205.2H7.37C9.82%205.2%2010.8%206.18%2010.8%208.63Z%22%20stroke%3D%22%23717C92%22%20stroke-width%3D%221.05%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M15%204.42999V7.36999C15%209.81999%2014.02%2010.8%2011.57%2010.8H10.8V8.62999C10.8%206.17999%209.81995%205.19999%207.36995%205.19999H5.19995V4.42999C5.19995%201.97999%206.17995%200.999992%208.62995%200.999992H11.57C14.02%200.999992%2015%201.97999%2015%204.42999Z%22%20stroke%3D%22%23717C92%22%20stroke-width%3D%221.05%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3C%2Fsvg%3E%0A" /></div></div><pre id="code-pj44d1isj" style="color:#111b27;background:#e3eaf2;font-family:Consolas, Monaco, &quot;Andale Mono&quot;, &quot;Ubuntu Mono&quot;, monospace;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none;padding:8px;margin:8px;overflow:auto;width:calc(100% - 8px);border-radius:8px;box-shadow:0px 8px 18px 0px rgba(120, 120, 143, 0.10), 2px 2px 10px 0px rgba(255, 255, 255, 0.30) inset"><code class="language-ts" style="white-space:pre;color:#111b27;background:none;font-family:Consolas, Monaco, &quot;Andale Mono&quot;, &quot;Ubuntu Mono&quot;, monospace;text-align:left;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none"><span class="token" style="color:#a04900">export</span><span> </span><span class="token" style="color:#a04900">interface</span><span> </span><span class="token" style="color:#005a8e">WorkoutHistoryEntry</span><span> </span><span class="token" style="color:#111b27">{</span><span>
</span><span>  id</span><span class="token" style="color:#a04900">:</span><span> </span><span class="token" style="color:#af00af">string</span><span class="token" style="color:#111b27">;</span><span>
</span><span>  date</span><span class="token" style="color:#a04900">:</span><span> </span><span class="token" style="color:#af00af">string</span><span class="token" style="color:#111b27">;</span><span>
</span><span>  duration</span><span class="token" style="color:#a04900">:</span><span> </span><span class="token" style="color:#af00af">number</span><span class="token" style="color:#111b27">;</span><span>
</span><span>  type</span><span class="token" style="color:#a04900">:</span><span> </span><span class="token" style="color:#116b00">&#x27;preset&#x27;</span><span> </span><span class="token" style="color:#a04900">|</span><span> </span><span class="token" style="color:#116b00">&#x27;manual&#x27;</span><span class="token" style="color:#111b27">;</span><span>
</span><span>  presetName</span><span class="token" style="color:#a04900">?</span><span class="token" style="color:#a04900">:</span><span> </span><span class="token" style="color:#af00af">string</span><span class="token" style="color:#111b27">;</span><span>
</span><span>  category</span><span class="token" style="color:#a04900">?</span><span class="token" style="color:#a04900">:</span><span> </span><span class="token" style="color:#af00af">string</span><span class="token" style="color:#111b27">;</span><span>
</span><span>  config</span><span class="token" style="color:#a04900">:</span><span> WorkoutConfig</span><span class="token" style="color:#111b27">;</span><span>
</span><span>  completedRounds</span><span class="token" style="color:#a04900">:</span><span> </span><span class="token" style="color:#af00af">number</span><span class="token" style="color:#111b27">;</span><span>
</span><span>  wasInterrupted</span><span class="token" style="color:#a04900">:</span><span> </span><span class="token" style="color:#af00af">boolean</span><span class="token" style="color:#111b27">;</span><span>
</span><span></span><span class="token" style="color:#111b27">}</span><span>
</span></code></pre></div>

---

# 4. Detalhamento da Implementação

## 4.1 Lógica de Remoção Individual
Adicionar função no HistoryProvider:

<div class="widget code-container remove-before-copy"><div class="code-header non-draggable"><span class="iaf s13 w700 code-language-placeholder">ts</span><div class="code-copy-button"><span class="iaf s13 w500 code-copy-placeholder">Copiar</span><img class="code-copy-icon" src="data:image/svg+xml;utf8,%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%3E%0A%20%20%3Cpath%20d%3D%22M10.8%208.63V11.57C10.8%2014.02%209.82%2015%207.37%2015H4.43C1.98%2015%201%2014.02%201%2011.57V8.63C1%206.18%201.98%205.2%204.43%205.2H7.37C9.82%205.2%2010.8%206.18%2010.8%208.63Z%22%20stroke%3D%22%23717C92%22%20stroke-width%3D%221.05%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M15%204.42999V7.36999C15%209.81999%2014.02%2010.8%2011.57%2010.8H10.8V8.62999C10.8%206.17999%209.81995%205.19999%207.36995%205.19999H5.19995V4.42999C5.19995%201.97999%206.17995%200.999992%208.62995%200.999992H11.57C14.02%200.999992%2015%201.97999%2015%204.42999Z%22%20stroke%3D%22%23717C92%22%20stroke-width%3D%221.05%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3C%2Fsvg%3E%0A" /></div></div><pre id="code-95c9xex84" style="color:#111b27;background:#e3eaf2;font-family:Consolas, Monaco, &quot;Andale Mono&quot;, &quot;Ubuntu Mono&quot;, monospace;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none;padding:8px;margin:8px;overflow:auto;width:calc(100% - 8px);border-radius:8px;box-shadow:0px 8px 18px 0px rgba(120, 120, 143, 0.10), 2px 2px 10px 0px rgba(255, 255, 255, 0.30) inset"><code class="language-ts" style="white-space:pre;color:#111b27;background:none;font-family:Consolas, Monaco, &quot;Andale Mono&quot;, &quot;Ubuntu Mono&quot;, monospace;text-align:left;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none"><span class="token" style="color:#a04900">function</span><span> </span><span class="token" style="color:#7c00aa">removeWorkoutFromHistory</span><span class="token" style="color:#111b27">(</span><span>id</span><span class="token" style="color:#a04900">:</span><span> </span><span class="token" style="color:#af00af">string</span><span class="token" style="color:#111b27">)</span><span> </span><span class="token" style="color:#111b27">{</span><span>
</span><span>  </span><span class="token" style="color:#7c00aa">setHistory</span><span class="token" style="color:#111b27">(</span><span>prev </span><span class="token" style="color:#a04900">=&gt;</span><span> prev</span><span class="token" style="color:#111b27">.</span><span class="token" style="color:#7c00aa">filter</span><span class="token" style="color:#111b27">(</span><span>item </span><span class="token" style="color:#a04900">=&gt;</span><span> item</span><span class="token" style="color:#111b27">.</span><span>id </span><span class="token" style="color:#a04900">!==</span><span> id</span><span class="token" style="color:#111b27">)</span><span class="token" style="color:#111b27">)</span><span class="token" style="color:#111b27">;</span><span>
</span><span>  </span><span class="token" style="color:#a04900">await</span><span> </span><span class="token" style="color:#7c00aa">saveHistoryToStorage</span><span class="token" style="color:#111b27">(</span><span class="token" style="color:#111b27">)</span><span class="token" style="color:#111b27">;</span><span>
</span><span></span><span class="token" style="color:#111b27">}</span><span>
</span></code></pre></div>

## 4.2 UI — Botão de Remoção em Cada Item
No HistoryListItem:

- adicionar ícone de lixeira  
- ao clicar → abrir ConfirmationModal  
- ao confirmar → chamar removeWorkoutFromHistory  

## 4.3 Ajustar Pré-visualização na Home
Na HomeScreen:

- adicionar `PreviewCard`  
- remover item do drawer  

## 4.4 Título da Seção “Som e Narração”
Atualizar:

- `SoundSettingsScreen.tsx`  
- i18n keys  
- design consistente  

---

# 5. Pseudocódigo (Essência do Comportamento)

onDeleteItem(id): openModal() if userConfirms: historyProvider.remove(id) animateRemoval()


HomeScreen: showCategoryCards() showPreviewButton()


SoundSettingsScreen: renameSection("Som e Narração")

---

# 6. Novas Strings no i18n

Adicionar:
"history.removeOne.confirm": "Deseja excluir este treino?", "speech.sectionTitle": "Som e Narração", "home.preview": "Pré-visualizar Treino"

Repetir para EN/ES/FR.

---

# 7. Testes Recomendados

## 7.1 Unit Tests
- removeWorkoutFromHistory remove item correto  
- modal retorna callbacks corretos  

## 7.2 Integration Tests
- HistoryScreen → remover item → lista atualiza  
- HomeScreen → preview funciona normalmente  

---

# 8. Checklist Técnico
- [ ] Código 100% tipado  
- [ ] Sem warnings no console  
- [ ] i18n completo  
- [ ] Persistência funcionando  
- [ ] Testado nos 3 temas  
- [ ] Testado nos 4 idiomas  

---

# 9. Observações Finais (opcional)
- Confirmar usabilidade com animação  