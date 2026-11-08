import { redirectIncoming } from '@/features/transfer/incoming';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return redirectIncoming(path);
}
