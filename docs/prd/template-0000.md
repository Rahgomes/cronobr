# PRD – [Título da Funcionalidade]
ID: feature-[nome]-[contador]  
Data: [AAAA-MM-DD]  
Versão: [vX.Y]  
Autor: [Seu Nome]  

---

## 1. Resumo
[Explique em 2–3 frases o que esta funcionalidade faz e qual é o objetivo principal.]

---

## 2. Contexto / Motivação
[Qual problema isso resolve?  
Por que essa funcionalidade existe?  
Qual impacto negativo existe hoje sem ela?]

---

## 3. Escopo (IN)
Liste tudo o que **deve** ser entregue nesta funcionalidade:

- [Exemplo] Permitir remoção individual de itens do histórico  
- [Exemplo] Ajustar posição da pré-visualização na Home  
- [Exemplo] Atualizar título da seção "Som e Narração"

---

## 4. Fora de Escopo (OUT)
Liste explicitamente o que **não** será feito nesta versão:

- [Exemplo] Edição manual de itens do histórico  
- [Exemplo] Customização de frases TTS  
- [Exemplo] Integração com backend (não existe)

---

## 5. Requisitos Funcionais (RF)
Requisitos que impactam diretamente o comportamento do sistema:

RF01 — [Descrição clara]  
RF02 — [Exemplo] Ao clicar no botão de remover item, exibir modal de confirmação  
RF03 — [Exemplo] A pré-visualização deve aparecer somente na Home  

---

## 6. Requisitos Não-Funcionais (RNF)
Performance, acessibilidade, organização, arquitetura, UX:

RNF01 — Interface deve ser consistente com o tema claro/escuro  
RNF02 — Todos os textos devem ser internacionalizáveis  
RNF03 — A remoção deve ser instantânea, sem travar UI  

---

## 7. User Flow (Fluxo do Usuário)
Descreva o fluxo em bullets:

- Usuário acessa tela X  
- Vê botão Y  
- Toca no botão  
- Modal aparece  
- Usuário confirma  
- Item é removido  

---

## 8. Critérios de Aceite (do QA / testes)
Para a funcionalidade ser considerada pronta:

- [ ] A remoção individual funciona sem erros  
- [ ] O modal exibe textos traduzidos  
- [ ] A pré-visualização aparece apenas na Home  
- [ ] Nada quebra nas versões EN/ES/FR  
- [ ] Animações estão funcionando  

---

## 9. Benchmarks / Referências (opcional)
- Prints / GIFs de referência  
- Links de produtos que fazem parecido  

---

## 10. Riscos / Observações (opcional)
- Possível colisão com animações existentes  
- Atenção ao i18n  