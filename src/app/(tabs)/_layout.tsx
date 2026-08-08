import { Tabs } from 'expo-router';
import { BottomNavigation } from 'react-native-paper';

import { useTranslation } from '@/hooks/useTranslation';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (event.defaultPrevented) {
              preventDefault();
            } else {
              navigation.navigate(route.name, route.params);
            }
          }}
          renderIcon={({ route, focused, color }) =>
            descriptors[route.key].options.tabBarIcon?.({
              focused,
              color,
              size: 24,
            }) ?? null
          }
          getLabelText={({ route }) => descriptors[route.key].options.title}
        />
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: t('tabs.log'),
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'layers' : 'layers-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="folders"
        options={{
          title: t('tabs.shelf'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="bookshelf"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'cog' : 'cog-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
