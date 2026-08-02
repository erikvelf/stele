import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, FAB, Surface, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { ActivityGrid } from '@/components/notes/ActivityGrid';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { mockDateDayRanges } from '@/modules/notes';

// Stand-ins for the macigno roulette, tavole carousel and day list from the
// PRD, so the page has enough height to scroll before those are built.
const PLACEHOLDER_BLOCKS = 4;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const ranges = useMemo(() => mockDateDayRanges(), []);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  return (
    <Surface style={styles.screen} elevation={0}>
      <Appbar.Header>
        <Appbar.Content title="Stele" />
      </Appbar.Header>

      <Animated.ScrollView
        contentContainerStyle={styles.body}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <ActivityGrid
          ranges={ranges}
          scrollY={scrollY}
          onSelectRange={range => router.push(`/note/${range.id}`)}
        />

        {Array.from({ length: PLACEHOLDER_BLOCKS }, (_, index) => (
          <View
            key={index}
            style={[
              styles.placeholder,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          />
        ))}
      </Animated.ScrollView>

      <FAB
        icon="pencil"
        style={styles.fab}
        onPress={() => router.push('/note/today')}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    padding: SPACING.md,
    paddingBottom: FAB_CLEARANCE,
  },
  placeholder: {
    width: '100%',
    height: 120,
    borderRadius: SPACING.sm,
    marginTop: SPACING.md,
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
  },
});
