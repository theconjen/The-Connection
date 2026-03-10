/**
 * Android Widget Task Handler
 * This is called by the Android system to render/update widgets.
 * It reads data from AsyncStorage and passes it to widget components.
 */

import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyVerseWidget, DailyVerseWidgetName } from './DailyVerseWidget';
import { BibleProgressWidget, BibleProgressWidgetName } from './BibleProgressWidget';

const WIDGET_VERSE_KEY = 'widget_verse_data';
const WIDGET_PROGRESS_KEY = 'widget_progress_data';

async function getVerseData() {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_VERSE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function getProgressData() {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetName, widgetAction } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      if (widgetName === DailyVerseWidgetName) {
        const data = await getVerseData();
        return <DailyVerseWidget {...(data || {})} />;
      }
      if (widgetName === BibleProgressWidgetName) {
        const data = await getProgressData();
        return <BibleProgressWidget {...(data || {})} />;
      }
      break;
    }

    case 'WIDGET_CLICK': {
      // Widget clicks open the app via clickAction="OPEN_APP"
      break;
    }

    case 'WIDGET_DELETED':
    default:
      break;
  }

  return <DailyVerseWidget />;
}
