import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator} from 'react-native';
import {useAuthStore} from '../../stores/authStore';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { inventoryAPI, salesAPI, customersAPI } from '../../services/api';
import { useIsFocused } from '@react-navigation/native';

// Componente animado elástico nativo para las tarjetas en cascada
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
  }, [isFocused]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
      {children}
    </Animated.View>
  );
}

function HomeScreen({ navigation }) {
  const {user} = useAuthStore();
  const {colors, typography, spacing} = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, sales: 0, customers: 0 });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [prodRes, salesRes, custRes] = await Promise.all([
        inventoryAPI.getProducts().catch(() => ({ data: [] })),
        salesAPI.getSales().catch(() => ({ data: [] })),
        customersAPI.getCustomers().catch(() => ({ data: [] })),
      ]);

      const prods = prodRes.data || [];
      const sales = salesRes.data || [];
      const custs = custRes.data || [];

      setStats({
        products: prods.length,
        sales: sales.length,
        customers: custs.length,
      });

      // Construir muro de actividades dinámico a partir de la DB real
      const activeList = [];
      
      if (sales.length > 0) {
        sales.slice(0, 2).forEach(s => {
          activeList.push({
            id: `sale-${s.id}`,
            text: `Venta registrada #${s.id}`,
            time: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Hoy',
            rightText: `$${s.total}`,
            icon: 'point-of-sale',
          });
        });
      }

      if (custs.length > 0) {
        custs.slice(0, 1).forEach(c => {
          activeList.push({
            id: `cust-${c.id}`,
            text: `Nuevo cliente: ${c.name}`,
            time: 'Reciente',
            icon: 'person-add',
          });
        });
      }

      if (activeList.length === 0) {
        activeList.push({
          id: 'empty',
          text: 'No hay transacciones registradas aún',
          time: 'Muro limpio',
          icon: 'info',
        });
      }

      setActivities(activeList);
    } catch (error) {
      console.log('Error loading dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = createStyles(colors, typography, spacing);

  if (loading) {
    return (
      <View style={dynamicStyles.center}>
        <ActivityIndicator size="large" color={colors.dataBlue} />
      </View>
    );
  }

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.contentContainer}>
      <FadeInUpCard delay={0} duration={350}>
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.badgeContainer}>
            <Text style={dynamicStyles.badgeText}>SUPERMERCADO // PRECIOS QUE RINDEN</Text>
          </View>
          <Text style={dynamicStyles.welcome}>MERCADO Y{'\n'}DESPENSA</Text>
          <Text style={dynamicStyles.subtitle}>
            Bienvenido, {user?.name || user?.username || 'Usuario'}
          </Text>
        </View>
      </FadeInUpCard>

      <View style={dynamicStyles.statsContainer}>
        {/* Tarjeta 1 - Productos Reales (Visible para todos) */}
        <FadeInUpCard delay={100} duration={400}>
          <View style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statHeader}>
              <MaterialIcons name="inventory" size={24} color={colors.onSurface} />
              <Text style={dynamicStyles.statId}>01 // PRD</Text>
            </View>
            <Text style={dynamicStyles.statNumber}>{stats.products}</Text>
            <Text style={dynamicStyles.statLabel}>PRODUCTOS EN INVENTARIO</Text>
          </View>
        </FadeInUpCard>
        
        {/* Tarjeta 2 - Ventas Reales (Solo para Admin y Vendor/Manager) */}
        {user?.role !== 'customer' && (
          <FadeInUpCard delay={200} duration={400}>
            <View style={dynamicStyles.statCard}>
              <View style={dynamicStyles.statHeader}>
                <MaterialIcons name="point-of-sale" size={24} color={colors.onSurface} />
                <Text style={dynamicStyles.statId}>02 // VNT</Text>
              </View>
              <Text style={dynamicStyles.statNumber}>{stats.sales}</Text>
              <Text style={dynamicStyles.statLabel}>COMPROBANTES EMITIDOS</Text>
            </View>
          </FadeInUpCard>
        )}
        
        {/* Tarjeta 3 - Clientes Reales (Solo para Admin y Vendor/Manager) */}
        {user?.role !== 'customer' && (
          <FadeInUpCard delay={300} duration={400}>
            <View style={dynamicStyles.statCard}>
              <View style={dynamicStyles.statHeader}>
                <MaterialIcons name="people" size={24} color={colors.onSurface} />
                <Text style={dynamicStyles.statId}>03 // CLI</Text>
              </View>
              <Text style={dynamicStyles.statNumber}>{stats.customers}</Text>
              <Text style={dynamicStyles.statLabel}>CLIENTES ASOCIADOS</Text>
            </View>
          </FadeInUpCard>
        )}
      </View>

      {/* Panel de Control de Administrador (Solo Admin) */}
      {user?.role === 'admin' && (
        <FadeInUpCard delay={350} duration={400}>
          <TouchableOpacity 
            style={[dynamicStyles.statCard, { borderColor: colors.dataBlue, borderWidth: 1.5, marginBottom: 16, marginHorizontal: 20 }]}
            onPress={() => navigation.navigate('Users')}
          >
            <View style={dynamicStyles.statHeader}>
              <MaterialIcons name="admin-panel-settings" size={26} color={colors.dataBlue} />
              <Text style={[dynamicStyles.statId, { color: colors.dataBlue }]}>ADMINISTRACIÓN // PANEL DE CONTROL</Text>
            </View>
            <Text style={[dynamicStyles.welcome, { fontSize: 18, textAlign: 'left', color: colors.primary, marginBottom: 4 }]}>
              Gestionar Usuarios (CRUD)
            </Text>
            <Text style={{ color: colors.secondary, fontSize: 13, lineHeight: 18, marginBottom: 12 }}>
              Accede a la consola de usuarios del sistema para dar de alta, editar o desactivar cuentas.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: colors.dataBlue, fontWeight: 'bold', fontSize: 13 }}>ABRIR CONSOLA</Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.dataBlue} style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        </FadeInUpCard>
      )}

      {/* Sección Dinámica según Rol */}
      {user?.role !== 'customer' ? (
        <FadeInUpCard delay={400} duration={350}>
          <View style={dynamicStyles.section}>
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>ACTIVIDAD RECIENTE</Text>
              <TouchableOpacity onPress={loadHomeData}>
                <MaterialIcons name="refresh" size={20} color={colors.dataBlue} />
              </TouchableOpacity>
            </View>
            
            {activities.map((act) => (
              <View key={act.id} style={dynamicStyles.activityItem}>
                <View style={dynamicStyles.activityLeft}>
                  <MaterialIcons name={act.icon} size={20} color={colors.secondary} style={{marginRight: 10}} />
                  <View>
                    <Text style={dynamicStyles.activityText}>{act.text}</Text>
                    <Text style={dynamicStyles.activityTime}>{act.time}</Text>
                  </View>
                </View>
                {act.rightText && <Text style={dynamicStyles.activityAmount}>{act.rightText}</Text>}
              </View>
            ))}
          </View>
        </FadeInUpCard>
      ) : (
        /* Tarjeta Informativa / Catálogo para clientes */
        <FadeInUpCard delay={200} duration={350}>
          <View style={[dynamicStyles.statCard, { marginHorizontal: 20, marginTop: 10, borderColor: colors.accentPink }]}>
            <View style={dynamicStyles.statHeader}>
              <MaterialIcons name="shopping-bag" size={26} color={colors.accentPink} />
              <Text style={[dynamicStyles.statId, { color: colors.accentPink }]}>CONFIMAX // CATÁLOGO</Text>
            </View>
            <Text style={[dynamicStyles.welcome, { fontSize: 20, textAlign: 'left', color: colors.primary, marginBottom: 8 }]}>
              Explora Nuestro Catálogo
            </Text>
            <Text style={{ color: colors.secondary, fontSize: 14, lineHeight: 20, marginBottom: 15 }}>
              Consulta precios actualizados, fichas técnicas y disponibilidad en tiempo real de harina, aceites, mantecas y condimentos industriales de la más alta calidad.
            </Text>
          </View>
        </FadeInUpCard>
      )}
    </ScrollView>
  );
}

const createStyles = (colors, typography, spacing) => StyleSheet.create({
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
    paddingBottom: 40,
  },
  header: {
    padding: spacing.page,
    paddingTop: 60,
    backgroundColor: colors.surfaceDim,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    alignItems: 'center',
  },
  badgeContainer: {
    borderWidth: 1,
    borderColor: colors.accentPink,
    backgroundColor: 'rgba(204, 5, 151, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 20,
  },
  badgeText: {
    ...typography.dataLabel,
    color: colors.accentPink,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  welcome: {
    ...typography.headlineLg,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurface,
    textAlign: 'center',
    borderLeftWidth: 3,
    borderLeftColor: colors.dataBlue,
    paddingLeft: 12,
    fontSize: 15,
  },
  statsContainer: {
    padding: spacing.page,
    gap: 16,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 12,
    padding: 22,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statId: {
    ...typography.dataLabel,
    color: colors.secondary,
    fontSize: 11,
  },
  statNumber: {
    ...typography.headlineLg,
    color: colors.primary,
    fontSize: 36,
    fontWeight: '900',
  },
  statLabel: {
    ...typography.dataLabel,
    color: colors.secondary,
    marginTop: 6,
    fontSize: 11,
    letterSpacing: 1,
  },
  section: {
    padding: spacing.page,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    backgroundColor: colors.surfaceDim,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    ...typography.dataLabel,
    color: colors.primary,
    fontSize: 13,
    letterSpacing: 1.2,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityText: {
    ...typography.bodyMd,
    color: colors.primary,
    fontSize: 15,
  },
  activityTime: {
    ...typography.dataLabel,
    color: colors.secondary,
    marginTop: 4,
    fontSize: 11,
  },
  activityAmount: {
    ...typography.dataValue,
    color: colors.dataBlue,
    fontSize: 16,
  },
});

export default HomeScreen;
