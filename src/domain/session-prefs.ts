// Como a pessoa prefere ver e travar a sessão (P1, P2). Lido campo a campo: valor estranho
// gravado volta ao padrão sem derrubar a tela.
export const SESSION_VIEWS = ['foco', 'anel', 'lista'] as const;
export type SessionViewMode = (typeof SESSION_VIEWS)[number];

export interface SessionPrefs {
  view: SessionViewMode;
  /** Trava de toques liga sozinha ao começar. */
  lockOnStart: boolean;
}

export const DEFAULT_SESSION_PREFS: SessionPrefs = { view: 'anel', lockOnStart: true };

export const VIEW_LABEL: Record<SessionViewMode, string> = {
  foco: 'Foco',
  anel: 'Anel',
  lista: 'Lista',
};

const isView = (value: unknown): value is SessionViewMode =>
  (SESSION_VIEWS as readonly unknown[]).includes(value);

export function parseSessionPrefs(raw: unknown): SessionPrefs {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SESSION_PREFS;
  const { view, lockOnStart } = raw as Record<string, unknown>;
  return {
    view: isView(view) ? view : DEFAULT_SESSION_PREFS.view,
    lockOnStart: typeof lockOnStart === 'boolean' ? lockOnStart : DEFAULT_SESSION_PREFS.lockOnStart,
  };
}
