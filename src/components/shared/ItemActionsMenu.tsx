import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { IconButton, Menu, useTheme } from 'react-native-paper';

export interface ItemActionsMenuProps {
  onEditPress: () => void;
  onDeletePress: () => void;
  iconSize?: number;
  iconStyle?: StyleProp<ViewStyle>;
}

// The dots-vertical → Edit/Delete menu repeated on folder cards, journal
// notes and folder notes. Delete always renders in the theme's error colour.
export function ItemActionsMenu({
  onEditPress,
  onDeletePress,
  iconSize,
  iconStyle,
}: ItemActionsMenuProps) {
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Menu
      visible={isMenuOpen}
      onDismiss={() => setIsMenuOpen(false)}
      anchor={
        <IconButton
          icon="dots-vertical"
          size={iconSize}
          style={iconStyle}
          accessibilityLabel="Item actions"
          onPress={() => setIsMenuOpen(true)}
        />
      }
    >
      <Menu.Item
        leadingIcon="pencil"
        title="Edit"
        onPress={() => {
          setIsMenuOpen(false);
          onEditPress();
        }}
      />
      <Menu.Item
        leadingIcon="delete"
        title="Delete"
        theme={{
          colors: {
            onSurface: theme.colors.error,
            onSurfaceVariant: theme.colors.error,
          },
        }}
        onPress={() => {
          setIsMenuOpen(false);
          onDeletePress();
        }}
      />
    </Menu>
  );
}
