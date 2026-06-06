import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator} from 'react-native';
import {useAuthStore} from '../../stores/authStore';
import { Package, Users, ShoppingCart, RefreshCw, Settings, UserPlus, Info, ShoppingBag, AlertTriangle, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { inventoryAPI, salesAPI, customersAPI } from '../../services/api';
import { useIsFocused } from '@react-navigation/native';

function FadeInUpCard({ children, delay = 0, duration = 400 }) {
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (isFocused) {
      fadeAnim.setValue(0);
      translateYAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      translateYAnim.setValue(30);
    }
  }, [isFocused, fadeAnim, translateYAnim, delay, duration]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
      {children}
    </Animated.View>
  );
}

function StatCard({ icon: Icon, value, label, color1, color2, delay = 0 }) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  
  const localStyles = StyleSheet.create({
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 12,
      elevation: 4,
    },
    iconContainer: {
      width: 52,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.md,
    },
  });
  
  return (
    <FadeInUpCard delay={delay} duration={400}>
      <View style={localStyles.statCard}>
        <LinearGradient
          colors={[color1, color2]}
          style={localStyles.iconContainer}
        >
          <Icon size={24} color="#ffffff" />
        </LinearGradient>
        <Text style={[typography.dataValue, { color: colors.onSurface, marginVertical: spacing.sm }]}>
          {value}
        </Text>
        <Text style={[typography.label, { color: colors.muted }]}>
          {label}
        </Text>
      </View>
    </FadeInUpCard>
  );
}

function Avatar({ name }) {
  const { colors, borderRadius } = useTheme();
  const initials = name ? name.charAt(0).toUpperCase() : 'U';
  
  const localStyles = StyleSheet.create({
    avatar: {
      width: 56,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.full,
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 24,
      fontWeight: '700',
    },
  });
  
  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6']}
      style={localStyles.avatar}
    >
      <Text style={localStyles.avatarText}>{initials}</Text>
    </LinearGradient>
  );
}

function HomeScreen({ navigation }) {
  const {user} = useAuthStore();
  const {colors, typography, spacing, borderRadius, isDark} = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, sales: 0, customers: 0 });
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], expiring: [] });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const promises = [
        inventoryAPI.getProducts().catch(() => ({ data: [] })),
        salesAPI.getSales().catch(() => ({ data: [] })),
        customersAPI.getCustomers().catch(() => ({ data: [] })),
        inventoryAPI.getLowStock(30).catch((err) => { console.log('Error getLowStock:', err); return { data: [] }; }),
        inventoryAPI.getExpiring(7).catch((err) => { console.log('Error getExpiring:', err); return { data: [] }; }),
      ];

      const results = await Promise.all(promises);
      
      const prods = results[0].data || [];
      const sales = results[1].data || [];
      const custs = results[2].data || [];

      setStats({
        products: prods.length,
        sales: sales.length,
        customers: custs.length,
      });

      setAlerts({
        lowStock: results[3]?.data || [],
        expiring: results[4]?.data || []
      });

      console.log('Alerts loaded:', {
        lowStock: results[3]?.data?.length,
        expiring: results[4]?.data?.length
      });

      const activeList = [];
      
      if (sales.length > 0) {
        sales.slice(0, 2).forEach(s => {
          activeList.push({
            id: `sale-${s.id}`,
            text: `Venta registrada #${s.id}`,
            time: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Hoy',
            rightText: `$${s.total}`,
            icon: ShoppingCart,
          });
        });
      }

      if (custs.length > 0) {
        custs.slice(0, 1).forEach(c => {
          activeList.push({
            id: `cust-${c.id}`,
            text: `Nuevo cliente: ${c.name}`,
            time: 'Reciente',
            icon: UserPlus,
          });
        });
      }

      if (activeList.length === 0) {
        activeList.push({
          id: 'empty',
          text: 'No hay transacciones registradas aún',
          time: 'Muro limpio',
          icon: Info,
        });
      }

      setActivities(activeList);
    } catch (error) {
      console.log('Error loading dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surfaceDim,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceDim,
    },
    contentContainer: {
      paddingBottom: spacing.xxl,
    },
    header: {
      padding: spacing.page,
      paddingTop: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    welcomeSection: {
      flex: 1,
    },
    welcomeText: {
      ...typography.headlineLg,
      color: colors.onSurface,
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    statsContainer: {
      padding: spacing.page,
      gap: spacing.md,
    },
    section: {
      padding: spacing.page,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
    },
    activityCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    activityItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    activityItemLast: {
      borderBottomWidth: 0,
    },
    activityLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    activityIconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    activityText: {
      ...typography.bodyMd,
      color: colors.onSurface,
    },
    activityTime: {
      ...typography.bodySm,
      color: colors.muted,
      marginTop: 2,
    },
    activityAmount: {
      ...typography.label,
      color: colors.primary,
      fontWeight: '600',
    },
    adminCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.page,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    adminHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    adminTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
      marginLeft: spacing.sm,
    },
    adminSubtitle: {
      ...typography.bodyMd,
      color: colors.muted,
      marginBottom: spacing.lg,
    },
    adminButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    adminButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    adminButtonPrimary: {
      backgroundColor: colors.primary,
    },
    adminButtonSecondary: {
      borderWidth: 1,
      borderColor: colors.primary,
    },
    adminButtonText: {
      ...typography.label,
      color: '#ffffff',
      fontWeight: '600',
    },
    adminButtonTextSecondary: {
      color: colors.primary,
    },
    customerCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.page,
      marginTop: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    customerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    customerTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
      marginLeft: spacing.sm,
    },
    customerDescription: {
      ...typography.bodyMd,
      color: colors.muted,
      lineHeight: 22,
    },
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <FadeInUpCard delay={0} duration={350}>
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Hola, {user?.name || user?.username || 'Usuario'} 👋
            </Text>
            <Text style={styles.subtitle}>
              Bienvenido de nuevo
            </Text>
          </View>
          <Avatar name={user?.name || user?.username} />
        </View>
      </FadeInUpCard>

      <View style={styles.statsContainer}>
        <StatCard
          icon={Package}
          value={stats.products}
          label="Productos"
          color1="#6366f1"
          color2="#8b5cf6"
          delay={100}
        />
        {user?.role !== 'customer' && (
          <StatCard
            icon={ShoppingCart}
            value={stats.sales}
            label="Ventas"
            color1="#ec4899"
            color2="#f43f5e"
            delay={200}
          />
        )}
        {user?.role !== 'customer' && (
          <StatCard
            icon={Users}
            value={stats.customers}
            label="Clientes"
            color1="#10b981"
            color2="#059669"
            delay={300}
          />
        )}
      </View>

      {user?.role === 'admin' && (
        <FadeInUpCard delay={350} duration={400}>
          <View style={styles.adminCard}>
            <View style={styles.adminHeader}>
              <Settings size={24} color={colors.primary} />
              <Text style={styles.adminTitle}>Panel de Administración</Text>
            </View>
            <Text style={styles.adminSubtitle}>
              Gestiona usuarios y accede a los logs de auditoría.
            </Text>
            <View style={styles.adminButtons}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Users')}
                style={[styles.adminButton, styles.adminButtonPrimary]}
              >
                <Text style={styles.adminButtonText}>Usuarios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('AuditLogs')}
                style={[styles.adminButton, styles.adminButtonSecondary]}
              >
                <Text style={[styles.adminButtonText, styles.adminButtonTextSecondary]}>
                  Auditoría
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeInUpCard>
      )}

      {(alerts.lowStock.length > 0 || alerts.expiring.length > 0) && (
        <FadeInUpCard delay={380} duration={400}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alertas de Inventario</Text>
            </View>

            {alerts.lowStock.length > 0 && (
              <View style={[styles.activityCard, { borderColor: '#fef08a', borderWidth: 1, marginBottom: spacing.md }]}>
                <View style={styles.adminHeader}>
                  <AlertTriangle size={20} color="#ca8a04" />
                  <Text style={[styles.adminTitle, { color: '#ca8a04', fontSize: 16 }]}>Stock Bajo (≤ 30)</Text>
                </View>
                {alerts.lowStock.slice(0, 5).map((item, i) => (
                  <View key={`low-${item.id}`} style={[styles.activityItem, i === Math.min(alerts.lowStock.length, 5) - 1 && styles.activityItemLast]}>
                    <Text style={styles.activityText} numberOfLines={1}>{item.product_name || item.sku}</Text>
                    <Text style={[styles.activityAmount, { color: '#ca8a04' }]}>{item.quantity} unds</Text>
                  </View>
                ))}
              </View>
            )}

            {alerts.expiring.length > 0 && (
              <View style={[styles.activityCard, { borderColor: '#fecaca', borderWidth: 1 }]}>
                <View style={styles.adminHeader}>
                  <Clock size={20} color="#dc2626" />
                  <Text style={[styles.adminTitle, { color: '#dc2626', fontSize: 16 }]}>Próximos a Expirar (≤ 7 días)</Text>
                </View>
                {alerts.expiring.slice(0, 5).map((item, i) => (
                  <View key={`exp-${item.id}`} style={[styles.activityItem, i === Math.min(alerts.expiring.length, 5) - 1 && styles.activityItemLast]}>
                    <Text style={styles.activityText} numberOfLines={1}>{item.name || item.sku}</Text>
                    <Text style={[styles.activityAmount, { color: '#dc2626' }]}>
                      {new Date(item.expiration_date).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </FadeInUpCard>
      )}

      {user?.role !== 'customer' ? (
        <FadeInUpCard delay={400} duration={350}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Actividad Reciente</Text>
              <TouchableOpacity onPress={loadHomeData}>
                <RefreshCw size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.activityCard}>
              {activities.map((act, index) => {
                const Icon = act.icon;
                return (
                  <View
                    key={act.id}
                    style={[
                      styles.activityItem,
                      index === activities.length - 1 && styles.activityItemLast
                    ]}
                  >
                    <View style={styles.activityLeft}>
                      <View style={styles.activityIconContainer}>
                        <Icon size={20} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.activityText}>{act.text}</Text>
                        <Text style={styles.activityTime}>{act.time}</Text>
                      </View>
                    </View>
                    {act.rightText && (
                      <Text style={styles.activityAmount}>{act.rightText}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </FadeInUpCard>
      ) : (
        <FadeInUpCard delay={200} duration={350}>
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <ShoppingBag size={24} color={colors.secondary} />
              <Text style={styles.customerTitle}>Explora Nuestro Catálogo</Text>
            </View>
            <Text style={styles.customerDescription}>
              Consulta precios actualizados, fichas técnicas y disponibilidad en tiempo real de harina, aceites, mantecas y condimentos industriales de la más alta calidad.
            </Text>
          </View>
        </FadeInUpCard>
      )}
    </ScrollView>
  );
}

export default HomeScreen;
