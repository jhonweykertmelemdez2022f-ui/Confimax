/**
 * Confimax Mobile App
 * React Native application for Confimax vendors
 */

import React, { useEffect } from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { useThemeStore } from './src/stores/themeStore';
import { useTheme } from './src/theme';

function App() {
  const loadPersistedTheme = useThemeStore((state) => state.loadPersistedTheme);
  const { isDark, colors } = useTheme();

  useEffect(() => {
    loadPersistedTheme();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar 
            barStyle={isDark ? "light-content" : "dark-content"} 
            backgroundColor={isDark ? "#0A0A0A" : "#ffffff"} 
          />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
