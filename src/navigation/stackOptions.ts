import Colors from '@/constants/Colors';

/** Shown as the iOS back target when returning from stack screens to the tab navigator. */
export const tabsGroupTitle = 'Home';

export const detailHeaderOptions = {
  headerShown: true,
  headerBackTitleVisible: false,
  headerBackTitle: '',
  headerTintColor: Colors.primary,
} as const;

export function detailScreenOptions(title: string) {
  return {
    ...detailHeaderOptions,
    title,
  };
}

export function detailScreenOptionsDynamic(
  title: string | undefined | null,
  fallback: string,
) {
  return detailScreenOptions(title?.trim() || fallback);
}
