import * as SecureStore from 'expo-secure-store';
import { secureConnectionStore } from './store';

jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>();
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(values.get(key) ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      values.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      values.delete(key);
      return Promise.resolve();
    }),
  };
});

const token = 'test-token-0123456789abcdef0123456789abcdef';

describe('secureConnectionStore', () => {
  test('keeps the address and token in secure storage and reads them back', async () => {
    await secureConnectionStore.save({ url: 'https://rcp.example.org', token });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('rcp.apiToken', token);
    expect(await secureConnectionStore.load()).toEqual({ url: 'https://rcp.example.org', token });
  });

  test('loads nothing once cleared', async () => {
    await secureConnectionStore.save({ url: 'https://rcp.example.org', token });
    await secureConnectionStore.clear();
    expect(await secureConnectionStore.load()).toBeNull();
  });
});
