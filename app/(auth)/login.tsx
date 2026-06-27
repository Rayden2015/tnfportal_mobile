import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorBanner, FieldLabel, Input, Screen } from '@/components/ui';
import { TenantLookupField, type TenantSelection } from '@/components/TenantLookupField';
import { DEFAULT_TENANT_SLUG } from '@/src/config';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [tenant, setTenant] = useState<TenantSelection | null>({
    slug: DEFAULT_TENANT_SLUG,
    name: '',
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    const tenantSlug = tenant?.slug?.trim();
    if (!tenantSlug) {
      setError('Select an organization from the search results.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password, tenant_slug: tenantSlug });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>TNF Portal</Text>
            <Text style={styles.tagline}>Volunteer & program management on the go</Text>
          </View>

          {error ? <ErrorBanner message={error} /> : null}

          <FieldLabel>Organization</FieldLabel>
          <TenantLookupField
            value={tenant}
            onChange={setTenant}
            initialSlug={DEFAULT_TENANT_SLUG}
          />

          <FieldLabel>Email</FieldLabel>
          <Input
            testID="login-email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />

          <FieldLabel>Password</FieldLabel>
          <Input
            testID="login-password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            onSubmitEditing={onSubmit}
          />

          <Button testID="login-submit" label="Sign in" onPress={onSubmit} loading={loading} />

          <Text style={styles.hint}>
            Search for your organization by name or slug, then sign in with your account.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  brandBlock: {
    marginBottom: 28,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EA580C',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
