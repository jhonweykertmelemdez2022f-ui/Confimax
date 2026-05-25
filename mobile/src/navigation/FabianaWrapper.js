import React from 'react';
import { useNavigationState } from '@react-navigation/native';
import FabianaBubble from '../components/FabianaBubble';

export default function FabianaWrapper({ children }) {
  const isMainScreen = useNavigationState(state => {
    if (!state || !state.routes || state.routes.length === 0) {
      return false;
    }
    
    const currentRoute = state.routes[state.index];
    
    if (currentRoute.name === 'Main') {
      return true;
    }
    
    return false;
  });

  return (
    <>
      {children}
      {isMainScreen && <FabianaBubble />}
    </>
  );
}
