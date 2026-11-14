import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { fonts, useTheme } from '../../theme';
import { iconPaths } from './Icon';

type CalendarMonthIconProps = {
  /** 1 to 12. */
  month: number;
  size?: number;
  /** Defaults to the theme's primary text color. */
  color?: string;
};

/** The calendar outline with the month number inside, as in the agenda header of the prototype. */
export function CalendarMonthIcon({ month, size = 24, color }: CalendarMonthIconProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.text.primary;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={iconPaths.calendario}
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SvgText
        x={12}
        y={19}
        fill={stroke}
        fontSize={8.5}
        fontFamily={fonts.bold}
        textAnchor="middle"
        testID="calendar-month-number"
      >
        {month}
      </SvgText>
    </Svg>
  );
}
