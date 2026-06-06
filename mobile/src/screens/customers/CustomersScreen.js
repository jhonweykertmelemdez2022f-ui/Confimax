import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import {customersAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateReportPDF } from '../../utils/pdfGenerator';
import { PdfButton } from '../../components/PdfButton';

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

function CustomersScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const {colors} = useTheme();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers from database:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const displayedCustomers = filteredCustomers.slice(0, page * 10);

  const handleLoadMore = () => {
    if (page * 10 < filteredCustomers.length) {
      setPage(prev => prev + 1);
    }
  };

  const renderFooter = () => {
    if (page * 10 >= filteredCustomers.length) return null;
    return (
      <View style={{ paddingVertical: 15, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.dataBlue} />
      </View>
    );
  };

  const exportPDF = async () => {
    const columns = [
      { label: 'Nombre', key: 'name' },
      { label: 'Email', key: 'email' },
      { label: 'Teléfono', key: 'phone' },
      { label: 'Dirección', key: 'address' }
    ];
    await generateReportPDF('Reporte de Clientes', columns, filteredCustomers);
  };

  const dynamicStyles = createStyles(colors);

  const renderCustomer = ({item, index}) => (
    <FadeInUpCard delay={index * 60} duration={350}>
      <TouchableOpacity
        style={dynamicStyles.customerCard}
        onPress={() => navigation.navigate('CustomerDetail', {id: item.id})}>
        <Text style={dynamicStyles.customerName}>{item.name}</Text>
        <Text style={dynamicStyles.customerEmail}>{item.email}</Text>
        <Text style={dynamicStyles.customerPhone}>{item.phone}</Text>
      </TouchableOpacity>
    </FadeInUpCard>
  );

  if (loading) {
    return (
      <View style={dynamicStyles.center}>
        <ActivityIndicator size="large" color={colors.dataBlue} />
      </View>
    );
  }

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      <FadeInUpCard delay={0} duration={300}>
        <View style={dynamicStyles.searchBarContainer}>
          <MaterialIcons name="search" size={20} color={colors.secondary} style={dynamicStyles.searchIcon} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Buscar clientes por nombre o correo..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setPage(1); // Reset page on new search
            }}
          />
          <PdfButton onPress={exportPDF} />
        </View>
      </FadeInUpCard>

      {customers.length === 0 ? (
        <AnimatedEmptyState
          icon="people-outline"
          title="Sin clientes registrados"
          subtitle="No tienes clientes asociados en el sistema. Registra un nuevo cliente presionando el botón '+' flotante de aquí abajo."
          colors={colors}
        />
      ) : filteredCustomers.length === 0 ? (
        <AnimatedEmptyState
          icon="search-off"
          title="Sin resultados"
          subtitle={`No se encontraron coincidencias para "${searchQuery}". Revisa la ortografía o intenta con otro término.`}
          colors={colors}
        />
      ) : (
        <FlatList
          data={displayedCustomers}
          renderItem={({item, index}) => renderCustomer({item, index})}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={dynamicStyles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={renderFooter}
        />
      )}

      <TouchableOpacity
        style={dynamicStyles.fab}
        onPress={() => navigation.navigate('NewCustomer')}
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
  customerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  customerEmail: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 5,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 5,
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

export default CustomersScreen;
