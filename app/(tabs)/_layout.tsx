import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/lib/supabase';
import { COLORS } from '../../src/constants/theme';

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 18, lineHeight: 22 }}>{icon}</Text>
  );
}

export default function TabLayout() {
  const { userId, signedIn } = useAuth();

  useEffect(() => {
    if (!signedIn || !userId) return;

    async function checkDisclaimer() {
      const { data } = await supabase
        .from('user_profiles')
        .select('disclaimer_accepted_at, onboarding_complete')
        .eq('id', userId)
        .single();

      if (!data?.disclaimer_accepted_at) {
        router.replace('/disclaimer');
      }
    }

    checkDisclaimer();
  }, [signedIn, userId]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.emerald,
        tabBarInactiveTintColor: COLORS.silver,
        tabBarLabelStyle: {
          fontSize: 7.5,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          fontFamily: 'System',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dil',
          tabBarIcon: ({ color }) => <TabIcon icon="♡" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabIcon icon="◎" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <TabIcon icon="⊙" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <TabIcon icon="✦" color={color} />,
        }}
      />
      <Tabs.Screen
        name="labs"
        options={{
          title: 'Labs',
          tabBarIcon: ({ color }) => <TabIcon icon="∿" color={color} />,
        }}
      />
    </Tabs>
  );
}
