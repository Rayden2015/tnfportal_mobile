import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { lookupTenants } from '@/src/api';
import type { TenantLookupItem } from '@/src/api/types';
import { formatApiError } from '@/src/context/AuthContext';

export type TenantSelection = {
  slug: string;
  name: string;
};

type TenantLookupFieldProps = {
  value: TenantSelection | null;
  onChange: (selection: TenantSelection) => void;
  initialSlug?: string;
};

export function TenantLookupField({ value, onChange, initialSlug }: TenantLookupFieldProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [query, setQuery] = useState(value?.name ?? value?.slug ?? initialSlug ?? '');
  const [results, setResults] = useState<TenantLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await lookupTenants(trimmed);
      setResults(items);
      setOpen(true);

      const exact = items.find(
        (item) => item.slug.toLowerCase() === trimmed.toLowerCase(),
      );
      if (exact) {
        onChange({ slug: exact.slug, name: exact.name });
        setQuery(exact.name);
      }
    } catch (err) {
      setError(formatApiError(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    if (value) {
      setQuery(value.name || value.slug);
      return;
    }
    if (initialSlug) {
      setQuery(initialSlug);
      void runSearch(initialSlug);
    }
  }, [value?.slug, value?.name, initialSlug, runSearch]);

  const onQueryChange = (text: string) => {
    setQuery(text);
    if (value && text !== value.name) {
      onChange({ slug: '', name: text });
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(text);
    }, 300);
  };

  const selectTenant = (tenant: TenantLookupItem) => {
    onChange({ slug: tenant.slug, name: tenant.name });
    setQuery(tenant.name);
    setOpen(false);
    setResults([]);
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <LookupInput
          value={query}
          onChangeText={onQueryChange}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
            if (query.trim().length >= 2 && results.length === 0) void runSearch(query);
          }}
          placeholder="Search organization name or slug"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ color: colors.text, flex: 1 }}
        />
        {loading ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
      </View>

      {value?.slug ? (
        <Text style={[styles.selectedSlug, { color: colors.textMuted }]}>
          Slug: {value.slug}
        </Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {open && results.length > 0 ? (
        <View style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={results}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            nestedScrollEnabled
            renderItem={({ item }) => (
              <Pressable
                onPress={() => selectTenant(item)}
                style={({ pressed }) => [
                  styles.resultRow,
                  { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}>
                <Text style={[styles.resultName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.resultSlug, { color: colors.textMuted }]}>{item.slug}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {open && !loading && query.trim().length >= 2 && results.length === 0 && !error ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>No organizations found.</Text>
      ) : null}
    </View>
  );
}

function LookupInput(props: TextInputProps) {
  return <TextInput {...props} />;
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    zIndex: 10,
  },
  inputRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedSlug: {
    fontSize: 12,
    marginTop: 6,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    marginTop: 6,
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 220,
    overflow: 'hidden',
  },
  list: {
    flexGrow: 0,
  },
  resultRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultSlug: {
    fontSize: 13,
    marginTop: 2,
  },
  empty: {
    fontSize: 13,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
