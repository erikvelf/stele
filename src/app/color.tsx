import { ScrollView, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { StonePicker } from '@/components/settings/StonePicker';
import { SPACING } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ColorScreen() {
  const { stoneId, setStoneId } = useAppTheme();

  return (
    <Surface elevation={0} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <StonePicker value={stoneId} onChange={setStoneId} />
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    padding: SPACING.md,
  },
});
