import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

// A native iOS header is 44pt tall, so Paper's default 40pt container plus its
// 6pt margin overflows it. This footprint fits both platforms.
const HEADER_ICON_SIZE = 22;

export type HeaderIconButtonProps = ComponentProps<typeof IconButton>;

export function HeaderIconButton({ style, ...props }: HeaderIconButtonProps) {
  return (
    <IconButton
      size={HEADER_ICON_SIZE}
      {...props}
      style={[styles.button, style]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 0,
  },
});
