import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return <View style={[styles.screen, { backgroundColor: colors.background }, style]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme() ?? 'light';
  return <Text style={[styles.title, { color: Colors[scheme].text }]}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme() ?? 'light';
  return <Text style={[styles.subtitle, { color: Colors[scheme].textMuted }]}>{children}</Text>;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme() ?? 'light';
  return <Text style={[styles.label, { color: Colors[scheme].text }]}>{children}</Text>;
}

export function Input(props: TextInputProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[
        styles.input,
        { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
        props.style,
      ]}
    />
  );
}

export function Button({
  label,
  onPress,
  loading,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: Colors.primary },
        variant === 'secondary' && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
        isDanger && { backgroundColor: colors.danger },
        (disabled || loading || pressed) && { opacity: 0.7 },
      ]}>
      {loading ? (
        <ActivityIndicator color={isPrimary || isDanger ? '#fff' : colors.text} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            { color: isPrimary || isDanger ? '#fff' : colors.text },
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>{message}</Text> : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
});
