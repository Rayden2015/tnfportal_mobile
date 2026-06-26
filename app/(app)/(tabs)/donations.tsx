import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Donation, Expense } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function DonationsScreen() {
  const { token, tenantSlug, hasAnyRole, tenant } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin', 'finance_manager');

  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<{ total_amount: number; donation_count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noDonorProfile, setNoDonorProfile] = useState(false);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    const auth = { token, tenantSlug };
    setError(null);
    setNoDonorProfile(false);

    try {
      if (isStaff) {
        const [donationResult, expenseResult] = await Promise.all([
          api.listDonations(auth),
          api.listExpenses(auth).catch(() => ({ items: [] as Expense[] })),
        ]);
        setDonations(donationResult.items);
        setExpenses(expenseResult.items);
        setSummary(null);
      } else {
        try {
          const data = await api.getMyDonations(auth);
          setDonations(data.donations);
          setSummary(data.summary);
          setExpenses([]);
        } catch (err) {
          const message = formatApiError(err);
          if (message.toLowerCase().includes('donor')) {
            setNoDonorProfile(true);
            setDonations([]);
            setSummary(null);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, isStaff]);

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

  const currency = tenant?.currency ?? 'GHS';

  return (
    <Screen style={styles.container}>
      <Title>{isStaff ? 'Finance' : 'My donations'}</Title>
      <Subtitle>
        {isStaff ? 'Recent donations and expenses' : 'Your giving history with this organization'}
      </Subtitle>
      {error ? <ErrorBanner message={error} /> : null}

      {summary ? (
        <Card>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Lifetime giving</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {currency} {summary.total_amount.toFixed(2)} · {summary.donation_count} gift
            {summary.donation_count === 1 ? '' : 's'}
          </Text>
        </Card>
      ) : null}

      <FlatList
        data={isStaff ? [...donations.map((d) => ({ kind: 'donation' as const, item: d })), ...expenses.map((e) => ({ kind: 'expense' as const, item: e }))] : donations.map((d) => ({ kind: 'donation' as const, item: d }))}
        keyExtractor={(row) => `${row.kind}-${row.item.id}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={noDonorProfile ? 'No donor profile' : 'No records yet'}
              message={
                noDonorProfile
                  ? 'Link a donor profile to your account to see donations here.'
                  : 'Donations will appear here once recorded.'
              }
            />
          ) : null
        }
        renderItem={({ item: row }) =>
          row.kind === 'donation' ? (
            <DonationRow donation={row.item} currency={currency} colors={colors} staff={isStaff} />
          ) : (
            <ExpenseRow expense={row.item} currency={currency} colors={colors} />
          )
        }
      />
    </Screen>
  );
}

function DonationRow({
  donation,
  currency,
  colors,
  staff,
}: {
  donation: Donation;
  currency: string;
  colors: (typeof Colors)['light'];
  staff: boolean;
}) {
  return (
    <Card>
      <Text style={[styles.rowTitle, { color: colors.text }]}>
        {currency} {donation.amount.toFixed(2)}
      </Text>
      {staff && donation.donor?.name ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>{donation.donor.name}</Text>
      ) : null}
      {donation.project?.title ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>{donation.project.title}</Text>
      ) : null}
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        {donation.payment_date ?? '—'} · {donation.status ?? 'completed'}
      </Text>
    </Card>
  );
}

function ExpenseRow({
  expense,
  currency,
  colors,
}: {
  expense: Expense;
  currency: string;
  colors: (typeof Colors)['light'];
}) {
  return (
    <Card>
      <Text style={[styles.rowTitle, { color: colors.text }]}>
        Expense · {currency} {expense.amount.toFixed(2)}
      </Text>
      {expense.description ? <Text style={[styles.meta, { color: colors.textMuted }]}>{expense.description}</Text> : null}
      {expense.project?.title ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>{expense.project.title}</Text>
      ) : null}
      <Text style={[styles.meta, { color: colors.textMuted }]}>{expense.date ?? '—'}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 0 },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  rowTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 14, marginTop: 2 },
});
