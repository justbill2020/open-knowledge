import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import type { ShareTargetInput } from '@/lib/share/run-share-action';

type WindowGlobals = { NodeFilter?: typeof NodeFilter };
type GlobalWithDomShims = typeof globalThis &
  WindowGlobals & { window?: WindowGlobals; ResizeObserver?: unknown };
const globalWithDomShims = globalThis as GlobalWithDomShims;
if (
  globalWithDomShims.NodeFilter === undefined &&
  globalWithDomShims.window?.NodeFilter !== undefined
) {
  globalWithDomShims.NodeFilter = globalWithDomShims.window.NodeFilter;
}
if (globalWithDomShims.ResizeObserver === undefined) {
  class NoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalWithDomShims.ResizeObserver = NoopResizeObserver;
}

mock.module('@/hooks/use-git-sync-status', () => ({
  useGitSyncStatusDetailed: () => ({
    status: { hasRemote: true },
    fetchError: null,
  }),
}));

const { ShareButton } = await import('./ShareButton');
const { TooltipProvider } = await import('@/components/ui/tooltip');

function renderShareButton(input: ShareTargetInput | null) {
  return render(
    <TooltipProvider>
      <ShareButton input={input} onClickWhenNoRemote={() => {}} />
    </TooltipProvider>,
  );
}

describe('ShareButton', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.location.hash = '';
  });
  afterEach(() => {
    cleanup();
  });

  test('renders an enabled button for a folder target', () => {
    renderShareButton({ kind: 'folder', folderRelativePath: 'guides' });

    const button = screen.getByTestId('share-button');
    expect(button).not.toBeNull();
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  test('renders an enabled button for a doc target', () => {
    renderShareButton({ kind: 'doc', docName: 'notes' });

    const button = screen.getByTestId('share-button');
    expect(button).not.toBeNull();
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  test('renders a DISABLED button (not absent) when input is null', () => {
    renderShareButton(null);

    const button = screen.queryByTestId('share-button');
    expect(button).not.toBeNull();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
