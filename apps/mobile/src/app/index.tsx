import { SafeAreaView } from 'react-native-safe-area-context';
import { checkConnection } from '../connection/check';
import { ConnectScreen } from '../connection/ConnectScreen';
import { secureConnectionStore } from '../connection/store';

// http is allowed only in development builds, for an API running on the PC (docs/SECURITY.md).
const allowHttp = __DEV__;

export default function Home() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ConnectScreen
        store={secureConnectionStore}
        check={(url, token) => checkConnection(url, token)}
        allowHttp={allowHttp}
      />
    </SafeAreaView>
  );
}
