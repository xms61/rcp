import * as SecureStore from 'expo-secure-store';

export interface SavedConnection {
  url: string;
  token: string;
}

export interface ConnectionStore {
  load(): Promise<SavedConnection | null>;
  save(connection: SavedConnection): Promise<void>;
  clear(): Promise<void>;
}

const URL_KEY = 'rcp.apiUrl';
const TOKEN_KEY = 'rcp.apiToken';

/**
 * The API address and token, in the phone's secure storage only (docs/SECURITY.md). Android drops them when the
 * app is uninstalled, and app.json turns backups off, so they never leave the device.
 */
export const secureConnectionStore: ConnectionStore = {
  async load() {
    const [url, token] = await Promise.all([SecureStore.getItemAsync(URL_KEY), SecureStore.getItemAsync(TOKEN_KEY)]);
    return url && token ? { url, token } : null;
  },
  async save({ url, token }) {
    await SecureStore.setItemAsync(URL_KEY, url);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(URL_KEY);
  },
};
