/**
 * Android Bible Progress Widget
 * Shows bible reading challenge progress on the home screen.
 */

import React from 'react';
import {
  FlexWidget,
  TextWidget,
} from 'react-native-android-widget';

interface BibleProgressWidgetProps {
  planTitle?: string;
  completedCount?: number;
  totalCount?: number;
  percentComplete?: number;
  nextReading?: string;
}

const CREAM_BG = '#F8F5F0';
const NAVY = '#1a2a4a';
const GOLD = '#C4A265';
const TEXT_SECONDARY = '#6B6356';
const TRACK_BG = '#E0D8CC';

export function BibleProgressWidget({
  planTitle,
  completedCount = 0,
  totalCount = 0,
  percentComplete = 0,
  nextReading,
}: BibleProgressWidgetProps) {
  const hasData = planTitle && totalCount > 0;

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
      clickActionData={{ screen: 'bible-challenge' }}
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
          text="📖"
          style={{
            fontSize: 12,
            marginRight: 6,
          }}
        />
        <TextWidget
          text="BIBLE CHALLENGE"
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
          {/* Plan Title */}
          <TextWidget
            text={planTitle}
            style={{
              fontSize: 16,
              color: NAVY,
              fontWeight: '700',
              marginBottom: 6,
            }}
          />

          {/* Next Reading */}
          {nextReading && (
            <TextWidget
              text={`Next: ${nextReading}`}
              style={{
                fontSize: 13,
                color: TEXT_SECONDARY,
                marginBottom: 10,
              }}
              maxLines={1}
              truncate="END"
            />
          )}

          {/* Progress Bar */}
          <FlexWidget
            style={{
              width: 'match_parent',
              height: 8,
              backgroundColor: TRACK_BG,
              borderRadius: 4,
              marginBottom: 6,
            }}
          >
            <FlexWidget
              style={{
                width: `${Math.max(percentComplete, 2)}%` as any,
                height: 8,
                backgroundColor: GOLD,
                borderRadius: 4,
              }}
            />
          </FlexWidget>

          {/* Stats Row */}
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space_between',
              width: 'match_parent',
            }}
          >
            <TextWidget
              text={`Day ${completedCount} of ${totalCount}`}
              style={{
                fontSize: 11,
                color: TEXT_SECONDARY,
              }}
            />
            <TextWidget
              text={`${percentComplete}%`}
              style={{
                fontSize: 11,
                color: GOLD,
                fontWeight: '700',
              }}
            />
          </FlexWidget>
        </>
      ) : (
        <TextWidget
          text="Tap to start your Bible challenge"
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

export const BibleProgressWidgetName = 'BibleProgressWidget';
