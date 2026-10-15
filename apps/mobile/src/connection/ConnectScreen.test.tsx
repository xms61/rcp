import { render, screen, userEvent } from '@testing-library/react-native';
import type { ConnectionCheck } from './check';
import { ConnectScreen } from './ConnectScreen';
import type { ConnectionStore, SavedConnection } from './store';

const token = 'test-token-0123456789abcdef0123456789abcdef';

function memoryStore(saved: SavedConnection | null = null) {
  let current = saved;
  const store: ConnectionStore = {
    load: () => Promise.resolve(current),
    save: (connection) => {
      current = connection;
      return Promise.resolve();
    },
    clear: () => {
      current = null;
      return Promise.resolve();
    },
  };
  return { store, saved: () => current };
}

async function renderScreen(result: ConnectionCheck, saved: SavedConnection | null = null) {
  const memory = memoryStore(saved);
  const check = jest.fn<Promise<ConnectionCheck>, [string, string]>(() => Promise.resolve(result));
  await render(<ConnectScreen store={memory.store} check={check} allowHttp={false} />);
  return { ...memory, check };
}

async function fillAndSave(url: string, apiToken: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('API address'), url);
  await user.type(screen.getByLabelText('API token'), apiToken);
  await user.press(screen.getByRole('button', { name: 'Save and test' }));
}

describe('ConnectScreen', () => {
  test('saves the address and token, and says it reached the API', async () => {
    const { saved, check } = await renderScreen({ kind: 'connected' });
    await fillAndSave('https://rcp.example.org/', token);
    expect(await screen.findByText('Connected to the API.')).toBeOnTheScreen();
    expect(check).toHaveBeenCalledWith('https://rcp.example.org', token);
    expect(saved()).toEqual({ url: 'https://rcp.example.org', token });
  });

  test('hides the token as it is typed', async () => {
    await renderScreen({ kind: 'connected' });
    expect(screen.getByLabelText('API token')).toHaveProp('secureTextEntry', true);
  });

  test('says when the API rejects the token, and saves nothing', async () => {
    const { saved } = await renderScreen({ kind: 'rejected' });
    await fillAndSave('https://rcp.example.org', token);
    expect(
      await screen.findByText('The API rejected this token. Check it against RCP_API_TOKEN on the server.'),
    ).toBeOnTheScreen();
    expect(saved()).toBeNull();
  });

  test('refuses an http address before sending anything', async () => {
    const { check, saved } = await renderScreen({ kind: 'connected' });
    await fillAndSave('http://rcp.example.org', token);
    expect(await screen.findByText('Use an https:// address.')).toBeOnTheScreen();
    expect(check).not.toHaveBeenCalled();
    expect(saved()).toBeNull();
  });

  test('tests the saved token again when the token field is left empty', async () => {
    const { check } = await renderScreen({ kind: 'connected' }, { url: 'https://rcp.example.org', token });
    await screen.findByDisplayValue('https://rcp.example.org');
    await userEvent.setup().press(screen.getByRole('button', { name: 'Save and test' }));
    expect(await screen.findByText('Connected to the API.')).toBeOnTheScreen();
    expect(check).toHaveBeenCalledWith('https://rcp.example.org', token);
  });

  test('never sends the saved token to a different address', async () => {
    const { check } = await renderScreen({ kind: 'connected' }, { url: 'https://rcp.example.org', token });
    const address = await screen.findByDisplayValue('https://rcp.example.org');
    const user = userEvent.setup();
    await user.clear(address);
    await user.type(address, 'https://attacker.example');
    await user.press(screen.getByRole('button', { name: 'Save and test' }));
    expect(await screen.findByText('Enter the API token.')).toBeOnTheScreen();
    expect(check).not.toHaveBeenCalled();
  });

  test('asks for a token when none is entered or saved, and sends nothing', async () => {
    const { check } = await renderScreen({ kind: 'connected' });
    await fillAndSave('https://rcp.example.org', '   ');
    expect(await screen.findByText('Enter the API token.')).toBeOnTheScreen();
    expect(check).not.toHaveBeenCalled();
  });

  test('says when the token could not be saved, and lets the owner try again', async () => {
    const memory = memoryStore();
    const store = { ...memory.store, save: () => Promise.reject(new Error('keystore unavailable')) };
    await render(
      <ConnectScreen store={store} check={() => Promise.resolve({ kind: 'connected' })} allowHttp={false} />,
    );
    await fillAndSave('https://rcp.example.org', token);
    expect(await screen.findByText('Connected, but the phone could not save the token. Try again.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save and test' })).toBeEnabled();
  });

  test('shows the saved address, but never the saved token', async () => {
    await renderScreen({ kind: 'connected' }, { url: 'https://rcp.example.org', token });
    expect(await screen.findByDisplayValue('https://rcp.example.org')).toBeOnTheScreen();
    expect(screen.queryByDisplayValue(token)).not.toBeOnTheScreen();
    expect(screen.getByText('A token is saved. Enter a new one to replace it.')).toBeOnTheScreen();
  });
});
