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
  Alert,
} from 'react-native';
import {authAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { generateReportPDF } from '../../utils/pdfGenerator';

// Animated Component for cards
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

// Empty State Component
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

function UsersScreen({navigation}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const {colors} = useTheme();
  const { user, isLoading: authLoading } = useAuthStore();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadUsers();
    }
  }, [isFocused]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      // Redirect to home screen if not an admin or not authenticated
      navigation.replace('Main'); // Use replace to prevent going back to UsersScreen
    }
  }, [user, authLoading, navigation]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (id, name) => {
    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que deseas desactivar a ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.deleteUser(id);
              Alert.alert('Éxito', 'Usuario desactivado correctamente.');
              loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'No se pudo desactivar el usuario.');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedUsers = filteredUsers.slice(0, page * 10);

  const handleLoadMore = () => {
    if (page * 10 < filteredUsers.length) {
      setPage(prev => prev + 1);
    }
  };

  const renderFooter = () => {
    if (page * 10 >= filteredUsers.length) return null;
    return (
      <View style={{ paddingVertical: 15, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.dataBlue} />
      </View>
    );
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrador',
      vendor: 'Vendedor',
      customer: 'Cliente (Customer)',
      manager: 'Gestor (Manager)',
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      admin: '#EF4444',
      vendor: '#F59E0B',
      customer: '#10B981',
      manager: '#3B82F6',
    };
    return roleColors[role] || colors.secondary;
  };

  const renderUser = ({item, index}) => (
    <FadeInUpCard delay={index * 60} duration={350}>
      <View style={dynamicStyles.userCard}>
        <View style={dynamicStyles.cardHeader}>
          <View>
            <Text style={dynamicStyles.userName}>{item.name}</Text>
            <Text style={dynamicStyles.userEmail}>{item.email}</Text>
          </View>
          <View style={[dynamicStyles.roleBadge, {backgroundColor: getRoleColor(item.role) + '20', borderColor: getRoleColor(item.role)}]}>
            <Text style={[dynamicStyles.roleText, {color: getRoleColor(item.role)}]}>
              {getRoleLabel(item.role)}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.cardActions}>
          <TouchableOpacity 
            style={dynamicStyles.editButton}
            onPress={() => navigation.navigate('QrCodeDisplay', { type: 'user', id: item.id, title: `QR de ${item.username}` })}
          >
            <MaterialIcons name="qr-code" size={18} color="#3B82F6" />
            <Text style={dynamicStyles.editButtonText}>Ver QR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={dynamicStyles.editButton}
            onPress={() => navigation.navigate('NewUser', { user: item })}
          >
            <MaterialIcons name="edit" size={18} color="#3B82F6" />
            <Text style={dynamicStyles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={dynamicStyles.deleteButton}
            onPress={() => handleDeleteUser(item.id, item.name)}
          >
            <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
            <Text style={dynamicStyles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FadeInUpCard>
  );

  const exportPDF = async () => {
    const columns = [
      { label: 'Nombre', key: 'name' },
      { label: 'Usuario', key: 'username' },
      { label: 'Email', key: 'email' },
      { label: 'Rol', key: 'role' }
    ];
    await generateReportPDF('Reporte de Usuarios', columns, filteredUsers);
  };

  const dynamicStyles = createStyles(colors);

  if (loading && users.length === 0) {
    return (
      <View style={dynamicStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <FadeInUpCard delay={0} duration={300}>
        <View style={dynamicStyles.searchBarContainer}>
          <MaterialIcons name="search" size={20} color={colors.secondary} style={dynamicStyles.searchIcon} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Buscar usuarios por nombre, correo o rol..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setPage(1);
            }}
          />
          <TouchableOpacity onPress={exportPDF} style={{ padding: 5 }}>
            <MaterialIcons name="picture-as-pdf" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </FadeInUpCard>

      {users.length === 0 ? (
        <AnimatedEmptyState
          icon="people-outline"
          title="Sin usuarios en el sistema"
          subtitle="No se encontraron cuentas activas en Confimax. Crea una cuenta presionando el botón '+'."
          colors={colors}
        />
      ) : filteredUsers.length === 0 ? (
        <AnimatedEmptyState
          icon="search-off"
          title="Sin resultados"
          subtitle={`No se encontraron coincidencias para "${searchQuery}".`}
          colors={colors}
        />
      ) : (
        <FlatList
          data={displayedUsers}
          renderItem={renderUser}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={dynamicStyles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={renderFooter}
        />
      )}

      <TouchableOpacity
        style={dynamicStyles.fab}
        onPress={() => navigation.navigate('NewUser')}
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
  userCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    paddingBottom: 12,
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 3,
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  editButtonText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 13,
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

export default UsersScreen;
