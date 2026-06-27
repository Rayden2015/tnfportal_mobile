import { Pressable, StyleSheet, Text, type TextStyle } from 'react-native';

import Colors from '@/constants/Colors';
import { openEmail, openPhone } from '@/src/utils/contact';

type Props = {
  type: 'email' | 'phone';
  value: string;
  style?: TextStyle;
};

export function ContactLink({ type, value, style }: Props) {
  const handlePress = () => {
    if (type === 'phone') {
      void openPhone(value);
      return;
    }
    void openEmail(value);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Text style={[styles.link, style]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    color: Colors.primary,
    fontSize: 14,
    marginTop: 2,
    textDecorationLine: 'underline',
  },
});
