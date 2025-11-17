import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../shared/colors';

export type SwitchProps = {
  value?: boolean;
  onValueChange?: (next: boolean) => void;
  disabled?: boolean;
  style?: any;
};

export const Switch = React.forwardRef<View, SwitchProps>(
  ({ value = false, onValueChange, disabled, style }, ref) => {
    const trackStyle = useMemo(
      () => [styles.track, value ? styles.trackOn : styles.trackOff, disabled && styles.disabled, style],
      [value, disabled, style]
    );
    const thumbStyle = useMemo(
      () => [styles.thumb, value ? styles.thumbOn : styles.thumbOff],
      [value]
    );

    return (
      <Pressable
        ref={ref as any}
        accessibilityRole="switch"
        aria-checked={value}
        onPress={() => !disabled && onValueChange?.(!value)}
        style={trackStyle}
        disabled={disabled}
      >
        <View style={thumbStyle} />
      </Pressable>
    );
  }
);

Switch.displayName = 'Switch';

const THUMB_SIZE = 20;
const WIDTH = 44;
const HEIGHT = 26;

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: Colors.primary },
  trackOff: { backgroundColor: '#e5e7eb' },
  disabled: { opacity: 0.5 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  thumbOn: { alignSelf: 'flex-end' },
  thumbOff: { alignSelf: 'flex-start' },
});

export default Switch;
