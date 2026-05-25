import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import {salesAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
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

// Componente animado para Estados Vacíos
function AnimatedEmptyState({ icon, title, subtitle, colors }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <MaterialIcons name={icon} size={75} color={colors.secondary} style={styles.emptyIcon} />
      <Text style={[styles.emptyTitle, { color: colors.primary }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>{subtitle}</Text>
    </Animated.View>
  );
}

function SalesScreen({navigation}) {
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const {colors} = useTheme();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadSales();
    }
  }, [isFocused]);

  const loadSales = async () => {
    try {
      const response = await salesAPI.getSales();
      setSales(response.data || []);
    } catch (error) {
      console.error('Error loading sales from database:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    const searchLower = searchQuery.toLowerCase();
    const customerMatch = sale.customer_name?.toLowerCase().includes(searchLower) ?? false;
    const idMatch = sale.id?.toString().includes(searchLower) || sale.order_number?.toLowerCase().includes(searchLower);
    return customerMatch || idMatch;
  });

  const displayedSales = filteredSales.slice(0, page * 10);

  const handleLoadMore = () => {
    if (page * 10 < filteredSales.length) {
      setPage(prev => prev + 1);
    }
  };

  const renderFooter = () => {
    if (page * 10 >= filteredSales.length) return null;
    return (
      <View style={{ paddingVertical: 15, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.dataBlue} />
      </View>
    );
  };

  const dynamicStyles = createStyles(colors);

  const renderSale = ({item, index}) => {
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'entregado': return '#00FF66';
        case 'pendiente': return '#FFB800';
        case 'cancelado': return colors.error;
        default: return colors.secondary;
      }
    };

    return (
      <FadeInUpCard delay={index * 60} duration={350}>
        <TouchableOpacity
          style={dynamicStyles.saleCard}
          onPress={() => navigation.navigate('SaleDetail', {id: item.id})}>
          <View style={dynamicStyles.saleHeader}>
            <View>
              <Text style={dynamicStyles.saleId}>#{(item.order_number || item.id.toString()).substring(0, 10).toUpperCase()}</Text>
              <Text style={dynamicStyles.saleDate}>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={[dynamicStyles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20', borderColor: getStatusColor(item.status) }]}>
              <Text style={[dynamicStyles.statusText, { color: getStatusColor(item.status) }]}>{item.status?.toUpperCase() || 'PND'}</Text>
            </View>
          </View>
          <View style={dynamicStyles.saleBody}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.saleCustomer}>{item.customer_name || 'Cliente general'}</Text>
            </View>
            <Text style={dynamicStyles.saleTotal}>${Number(item.total).toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      </FadeInUpCard>
    );
  };

  if (loading) {
    return (
      <View style={dynamicStyles.center}>
        <ActivityIndicator size="large" color={colors.dataBlue} />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.searchBarContainer}>
        <MaterialIcons name="search" size={20} color={colors.secondary} style={dynamicStyles.searchIcon} />
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Buscar por cliente o número de transacción..."
          placeholderTextColor={colors.secondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setPage(1); // Reset page on new search
          }}
        />
      </View>
      
      {filteredSales.length === 0 ? (
        <AnimatedEmptyState
          icon="receipt-long"
          title="Sin comprobantes de venta"
          subtitle="No se han registrado transacciones el día de hoy. Comienza a facturar presionando el botón '+' de abajo."
          colors={colors}
        />
      ) : (
        <FlatList
          data={displayedSales}
          renderItem={({item, index}) => renderSale({item, index})}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={dynamicStyles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={renderFooter}
        />
      )}

      <TouchableOpacity
        style={dynamicStyles.fab}
        onPress={() => navigation.navigate('NewSale')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
});

const createStyles = (colors) => StyleSheet.create({
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.isDark ? 0.2 : 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.primary,
    fontSize: 16,
  },
  list: {
    padding: 15,
  },
  saleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  saleId: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  saleDate: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  saleBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  saleTotal: {
    fontSize: 22,
    color: colors.onSurface,
    fontWeight: '900',
  },
  saleCustomer: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 999,
  },
});

export default SalesScreen;
