import { useCallback, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Button, Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { DuesRecord, MyDuesResult } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function DuesScreen() {
  const { token, tenantSlug, tenant } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [data, setData] = useState<MyDuesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      setData(await api.getMyDues({ token, tenantSlug }));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handlePay = async () => {
    if (!token || !tenantSlug || !data) return;
    setPaying(true);
    setError(null);
    try {
      const result = await api.initiateDuesPayment({ token, tenantSlug });
      await Linking.openURL(result.checkout_url);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPaying(false);
    }
  };

  const currency = data?.payment_options.currency ?? tenant?.currency ?? 'GHS';
  const outstanding = data?.summary.total_outstanding ?? 0;

  return (
    <Screen style={styles.container}>
      <Title>My dues</Title>
      <Subtitle>Outstanding balance and payment history</Subtitle>
      {error ? <ErrorBanner message={error} /> : null}

      {data ? (
        <Card>
          <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Total outstanding</Text>
          <Text style={[styles.balanceValue, { color: colors.text }]}>
            {currency} {outstanding.toFixed(2)}
          </Text>
          {outstanding > 0 ? (
            <Button label="Pay now" onPress={handlePay} loading={paying} />
          ) : (
            <Text style={{ color: colors.success, marginTop: 8 }}>You are up to date.</Text>
          )}
        </Card>
      ) : null}

      <FlatList
        data={data?.dues ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="No dues records" message="Dues will appear here when assigned." /> : null
        }
        renderItem={({ item }) => <DuesRow item={item} currency={currency} colors={colors} />}
      />
    </Screen>
  );
}

function DuesRow({
  item,
  currency,
  colors,
}: {
  item: DuesRecord;
  currency: string;
  colors: (typeof Colors)['light'];
}) {
  return (
    <Card>
      <Text style={[styles.rowTitle, { color: colors.text }]}>{item.dues_month_display}</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        Due {currency} {item.amount_due.toFixed(2)} · Paid {currency} {item.amount_paid.toFixed(2)}
      </Text>
      <Text style={[styles.meta, { color: item.is_overdue ? colors.danger : colors.textMuted }]}>
        Balance {currency} {item.balance.toFixed(2)} · {item.payment_status}
        {item.is_overdue ? ' · Overdue' : ''}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 0 },
  balanceLabel: { fontSize: 13 },
  balanceValue: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  rowTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 14, marginTop: 2 },
});
