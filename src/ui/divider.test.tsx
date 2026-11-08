import { render, screen } from '@testing-library/react-native';

import { Divider } from './divider';

it('sem rótulo é só a linha; com rótulo mostra o texto no meio', async () => {
  const { rerender } = await render(<Divider />);
  expect(screen.queryByText('ou')).toBeNull();
  await rerender(<Divider label="ou" />);
  expect(screen.getByText('ou')).toBeOnTheScreen();
});
