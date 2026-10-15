import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ConnectionCheck } from './check';
import type { ConnectionStore } from './store';
import { parseApiUrl } from './url';

interface Props {
  store: ConnectionStore;
  check: (url: string, token: string) => Promise<ConnectionCheck>;
  allowHttp: boolean;
}

function describe(result: ConnectionCheck): string {
  switch (result.kind) {
    case 'connected':
      return 'Connected to the API.';
    case 'rejected':
      return 'The API rejected this token. Check it against RCP_API_TOKEN on the server.';
    case 'unreachable':
      return 'Could not reach the API. Check the address and your connection.';
    case 'failed':
      return `The API answered with an error (${String(result.status)}).`;
  }
}

/** Where the owner enters the API address and token once. Both are saved only after the API accepts them. */
export function ConnectScreen({ store, check, allowHttp }: Props) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void store.load().then((saved) => {
      if (!saved) return;
      setUrl(saved.url);
      setSavedToken(saved.token);
    });
  }, [store]);

  async function saveAndTest() {
    const parsed = parseApiUrl(url, { allowHttp });
    if (!parsed.ok) {
      setMessage(parsed.error);
      return;
    }
    const tokenToUse = token.trim() || savedToken;
    if (!tokenToUse) {
      setMessage('Enter the API token.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await check(parsed.url, tokenToUse);
    if (result.kind === 'connected') {
      await store.save({ url: parsed.url, token: tokenToUse });
      setSavedToken(tokenToUse);
      setToken('');
    }
    setMessage(describe(result));
    setBusy(false);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title} role="heading">
        Connect to your RCP server
      </Text>
      <Text style={styles.label}>API address</Text>
      <TextInput
        aria-label="API address"
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://rcp.example.org"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <Text style={styles.label}>API token</Text>
      <TextInput
        aria-label="API token"
        style={styles.input}
        value={token}
        onChangeText={setToken}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      {savedToken ? <Text style={styles.hint}>A token is saved. Enter a new one to replace it.</Text> : null}
      <Pressable role="button" style={styles.button} onPress={() => void saveAndTest()} disabled={busy}>
        <Text style={styles.buttonText}>Save and test</Text>
      </Pressable>
      {busy ? <ActivityIndicator /> : null}
      {message ? (
        <Text style={styles.message} role="alert">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 8, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 8, padding: 12, fontSize: 16 },
  hint: { fontSize: 13 },
  button: { marginTop: 16, padding: 14, borderRadius: 8, backgroundColor: '#1f5f3a', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  message: { marginTop: 12, fontSize: 15 },
});
