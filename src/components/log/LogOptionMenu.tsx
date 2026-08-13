import { useState } from 'react';
import { Appbar, Menu } from 'react-native-paper';

interface LogOptionMenuProps<T extends string> {
  icon: string;
  options: readonly T[];
  selected: T;
  labelFor: (option: T) => string;
  onSelect: (option: T) => void;
}

// An appbar menu listing every option, with a check on the current one. The
// open state stays here: the screen only needs to know what was picked.
export function LogOptionMenu<T extends string>({
  icon,
  options,
  selected,
  labelFor,
  onSelect,
}: LogOptionMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const select = (option: T) => {
    setIsOpen(false);
    onSelect(option);
  };

  return (
    <Menu
      visible={isOpen}
      onDismiss={() => setIsOpen(false)}
      anchor={<Appbar.Action icon={icon} onPress={() => setIsOpen(true)} />}
    >
      {options.map(option => (
        <Menu.Item
          key={option}
          title={labelFor(option)}
          leadingIcon={option === selected ? 'check' : undefined}
          onPress={() => select(option)}
        />
      ))}
    </Menu>
  );
}
