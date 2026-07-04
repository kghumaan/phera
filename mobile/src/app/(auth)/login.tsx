import { Redirect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import bgClouds from '@/assets/images/backgrounds/blue-clouds.webp';

import {
  PheraButton,
  PheraInput,
  PheraText,
  WarningAlert,
} from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <Path
        d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
        fill="#34A853"
      />
      <Path
        d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <Path
        d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { user, isPreviewMode, signInWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user) return <Redirect href="/" />;

  const handleLogin = async () => {
    setError(null);
    if (!email) {
      setError('Enter your email to continue');
      return;
    }
    const result = await signInWithPassword(email, password);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <Image
        source={bgClouds}
        alt=""
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <PheraText variant="h2" align="center">
                Welcome to Phera
              </PheraText>
              <PheraText variant="body2" align="center">
                Sign in or create an account to get started
              </PheraText>
            </View>

            {error ? <WarningAlert onClose={() => setError(null)}>{error}</WarningAlert> : null}

            <PheraButton
              variant="secondary"
              fullWidth
              size="lg"
              borderRadius={RADII.pill}
              icon={<GoogleIcon />}
              onPress={() => {
                // TODO(Phase 1): native Google OAuth via expo-web-browser +
                // supabase.auth.signInWithOAuth deep-link flow.
                setError(
                  isPreviewMode
                    ? 'Google sign-in is not available in preview mode'
                    : 'Google sign-in is coming to the mobile app soon',
                );
              }}
            >
              Continue with Google
            </PheraButton>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <PheraText variant="body2" color="#858585">
                or
              </PheraText>
              <View style={styles.dividerLine} />
            </View>

            <View style={{ gap: 16 }}>
              <PheraInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                testID="login-email"
              />
              <PheraInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                testID="login-password"
              />
              <PheraButton fullWidth size="lg" onPress={handleLogin} testID="login-submit">
                Sign In / Sign Up
              </PheraButton>
            </View>

            {isPreviewMode ? (
              <PheraText variant="body2" align="center" color={COLORS.text.subtle}>
                Preview mode — any email works, data is mocked
              </PheraText>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.paper },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADII.dialog,
    padding: 24,
    gap: 20,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    ...SHADOWS.dialog,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
});
