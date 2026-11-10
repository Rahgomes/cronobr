# Privacidade do CronôBR (versão candidata)

Rascunho para validação, não publicado. Escrito a partir do que o app faz hoje (E08), conferido
no código: banco SQLite local, nenhuma conta, nenhum servidor próprio, e o SDK de anúncios do
Google (`react-native-google-mobile-ads` 17.4) só no aparelho. Antes de publicar falta: endereço
de contato, URL onde a política vai morar e a conta AdMob (pendências no fim).

## Política de privacidade (pt-BR)

**O que fica no seu aparelho.** Suas rotinas, favoritas, preferências e histórico de treinos são
gravados só no seu aparelho. O CronôBR não tem cadastro, não tem servidor e não envia esses dados
para ninguém.

**Backup.** Quando você exporta um backup ou compartilha uma rotina, o app cria um arquivo
`.cronobr` e entrega para o compartilhar do sistema. Para onde ele vai (e-mail, nuvem, mensagem)
é escolha sua; o CronôBR não guarda cópia em lugar nenhum.

**Notificações.** Se você permitir, o app agenda notificações no próprio aparelho para avisar as
trocas de fase com a tela bloqueada. Nada sai do aparelho por isso.

**Anúncios.** O app mostra anúncios do Google AdMob na tela inicial e no histórico, nunca durante
o treino. Para escolher e medir anúncios, o SDK do Google coleta e compartilha com o Google:
endereço IP (pode indicar a região aproximada), identificadores do aparelho (no Android, o ID de
publicidade e o ID do conjunto de apps), interações com o app e com o anúncio, e dados de
diagnóstico e desempenho. Os dados são criptografados no envio. Onde a lei exige (União Europeia,
Reino Unido e Suíça), o app pergunta seu consentimento pela plataforma do Google antes de pedir
anúncio, e você pode mudar a escolha em Ajustes > Privacidade dos anúncios. No iPhone o app não
pede permissão de rastreamento e não acessa o identificador de publicidade da Apple. No Android,
você pode apagar ou trocar o ID de publicidade nas configurações do sistema. Como o Google trata
esses dados: https://policies.google.com/technologies/partner-sites

**Crianças.** O app não é direcionado a menores de 13 anos. Os anúncios pedidos são de
classificação livre.

**Apagar seus dados.** Desinstalar o app apaga tudo o que ele guardou no aparelho. Os dados
coletados pelo Google para anúncios seguem a política do Google.

**Contato.** (a definir antes de publicar)

## Privacy policy (en)

**What stays on your device.** Your routines, favorites, settings and workout history are stored
only on your device. CronôBR has no account, no server and does not send this data to anyone.

**Backup.** When you export a backup or share a routine, the app creates a `.cronobr` file and
hands it to the system share sheet. Where it goes (email, cloud, a message) is up to you; CronôBR
keeps no copy anywhere.

**Notifications.** If you allow them, the app schedules notifications on the device itself to
announce phase changes while the screen is locked. Nothing leaves the device for this.

**Ads.** The app shows Google AdMob ads on the home screen and in the history, never during a
workout. To choose and measure ads, Google's SDK collects and shares with Google: IP address
(which may indicate approximate location), device identifiers (on Android, the advertising ID and
the app set ID), interactions with the app and the ad, and diagnostic and performance data. Data
is encrypted in transit. Where the law requires it (European Union, United Kingdom and
Switzerland), the app asks for your consent through Google's platform before requesting ads, and
you can change your choice in Settings > Ad privacy. On iPhone the app does not ask for tracking
permission and does not access Apple's advertising identifier. On Android you can delete or reset
the advertising ID in the system settings. How Google uses this data:
https://policies.google.com/technologies/partner-sites

**Children.** The app is not directed at children under 13. Ads requested are rated for general
audiences.

**Deleting your data.** Uninstalling the app deletes everything it stored on the device. Data
collected by Google for ads follows Google's policy.

**Contact.** (to be defined before publishing)

## Google Play: Segurança dos dados

Respostas para o formulário, de acordo com a divulgação oficial do SDK (Play data disclosure do
Google Mobile Ads, conferida em 09/11/2026) e o que o app faz.

| Pergunta | Resposta |
| --- | --- |
| O app coleta ou compartilha dados do usuário? | Sim (pelo SDK de anúncios) |
| Dados criptografados em trânsito? | Sim |
| Forma de pedir exclusão dos dados? | Não há conta nem dado em servidor próprio; dados do app saem ao desinstalar |
| ID de publicidade (Play Console > Conteúdo do app) | Sim, usado para publicidade |

| Tipo de dado | Coletado | Compartilhado | Finalidade | Obrigatório |
| --- | --- | --- | --- | --- |
| Local aproximado (pelo IP) | Sim | Sim | Publicidade, análise, prevenção de fraude | Sim |
| Interações com o app | Sim | Sim | Publicidade, análise, prevenção de fraude | Sim |
| Diagnóstico (desempenho, travamentos) | Sim | Sim | Publicidade, análise, prevenção de fraude | Sim |
| Identificadores do aparelho (ID de publicidade, ID do conjunto de apps) | Sim | Sim | Publicidade, análise, prevenção de fraude | Sim |
| Rotinas, histórico, preferências | Não (ficam no aparelho) | Não | | |

## App Store: Privacidade do app

Pela divulgação do SDK para iOS (conferida em 09/11/2026). Como o app não pede permissão de
rastreamento (D132), nenhum dado é marcado como "usado para rastrear você" (D138).

| Tipo de dado (App Store) | Vinculado à pessoa | Usado para rastrear | Finalidade |
| --- | --- | --- | --- |
| Identificadores > ID do dispositivo | Não | Não | Publicidade de terceiros, análise |
| Dados de uso > Interação com o produto | Não | Não | Publicidade de terceiros, análise |
| Dados de uso > Dados de publicidade | Não | Não | Publicidade de terceiros, análise |
| Diagnóstico > Dados de falhas | Não | Não | Funcionalidade do app, análise |
| Diagnóstico > Dados de desempenho | Não | Não | Publicidade de terceiros, análise |
| Localização > Local aproximado | Não | Não | Publicidade de terceiros |

## Pendências (dependem de conta ou de decisão de lançamento)

- Endereço de contato e URL pública da política (exigidos pelas duas lojas com anúncio).
- Revisar as duas tabelas no console com a conta AdMob ativa: a divulgação do SDK muda com a
  versão, e recursos opcionais acrescentam dados.
- Questionário de classificação etária (IARC na Play, faixa etária na App Store): sem violência,
  sem compra, com anúncios.
- Público-alvo na Play: 13 anos ou mais (D137).
