/**
 * Android Daily Verse Widget
 * Shows today's verse of the day on the home screen.
 */

import React from 'react';
import {
  FlexWidget,
  TextWidget,
  ListWidget,
} from 'react-native-android-widget';

interface DailyVerseWidgetProps {
  reference?: string;
  text?: string;
  date?: string;
}

const CREAM_BG = '#F8F5F0';
const NAVY = '#1a2a4a';
const GOLD = '#C4A265';
const TEXT_SECONDARY = '#6B6356';

export function DailyVerseWidget({ reference, text, date }: DailyVerseWidgetProps) {
  const hasData = reference && text;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: CREAM_BG,
        borderRadius: 20,
      }}
      clickAction="OPEN_APP"
      clickActionData={{ screen: 'home' }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="✦"
          style={{
            fontSize: 12,
            color: GOLD,
            marginRight: 6,
          }}
        />
        <TextWidget
          text="VERSE OF THE DAY"
          style={{
            fontSize: 11,
            color: GOLD,
            fontWeight: '700',
            letterSpacing: 1,
          }}
        />
      </FlexWidget>

      {hasData ? (
        <>
          {/* Verse Text */}
          <TextWidget
            text={`"${text}"`}
            style={{
              fontSize: 14,
              color: NAVY,
              lineHeight: 20,
              fontStyle: 'italic',
              marginBottom: 8,
            }}
            maxLines={4}
            truncate="END"
          />

          {/* Reference */}
          <TextWidget
            text={`— ${reference}`}
            style={{
              fontSize: 12,
              color: GOLD,
              fontWeight: '600',
              textAlign: 'right',
            }}
          />
        </>
      ) : (
        <TextWidget
          text="Tap to open The Connection"
          style={{
            fontSize: 14,
            color: TEXT_SECONDARY,
          }}
        />
      )}

      {/* App branding */}
      <TextWidget
        text="The Connection"
        style={{
          fontSize: 10,
          color: TEXT_SECONDARY,
          marginTop: 8,
          textAlign: 'right',
        }}
      />
    </FlexWidget>
  );
}

export const DailyVerseWidgetName = 'DailyVerseWidget';
