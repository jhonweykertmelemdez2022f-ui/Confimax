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
  ScrollView,
} from 'react-native';
import {auditAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';

// Animated Component for cards
function FadeInUpCard({ children, delay = 0, duration = 400 }) {
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isFocused) {
      fadeAnim.setValue(0);
      translateYAnim.setValue(20);
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
          friction: 8,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      translateYAnim.setValue(20);
    }
  }, [isFocused]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
      {children}
    </Animated.View>
  );
}

function AuditLogsScreen({navigation}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('ALL');
  const {colors, typography, spacing} = useTheme();
  const isFocused = useIsFocused();
  const { user, isLoading: authLoading } = useAuthStore();

  const operations = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'];

  useEffect(() => {
    if (isFocused) {
      loadLogs();
    }
  }, [isFocused, selectedOperation]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      // Redirect to home screen if not an admin or not authenticated
      navigation.replace('Main'); // Use replace to prevent going back to AuditLogsScreen
    }
  }, [user, authLoading, navigation]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (selectedOperation !== 'ALL') {
        params.operation = selectedOperation;
      }
      const response = await auditAPI.getAuditLogs(params);
      const data = response.data || response;
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[AUDIT] Failed loading logs:', err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLogs = () => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase().trim();
    return logs.filter(
      (log) =>
        (log.username && log.username.toLowerCase().includes(q)) ||
        (log.entity && log.entity.toLowerCase().includes(q))
    );
  };

  const getOperationBadgeStyle = (op) => {
    switch (op) {
      case 'CREATE':
        return { bg: '#00FF6620', text: '#00FF66', border: '#00FF6640' };
      case 'UPDATE':
        return { bg: colors.dataBlue + '20', text: colors.dataBlue, border: colors.dataBlue + '40' };
      case 'DELETE':
        return { bg: '#FF3B3020', text: '#FF3B30', border: '#FF3B3040' };
      case 'LOGIN':
        return { bg: '#5856D620', text: '#5856D6', border: '#5856D640' };
      default:
        return { bg: colors.surfaceDim, text: colors.secondary, border: colors.border };
    }
  };

  const filteredLogs = getFilteredLogs();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Search Header */}
      <View style={[styles.searchHeader, {backgroundColor: colors.surface, borderBottomColor: colors.border}]}>
        <View style={[styles.searchBar, {backgroundColor: colors.surfaceDim, borderColor: colors.border}]}>
          <MaterialIcons name="search" size={20} color={colors.secondary} style={{marginRight: 8}} />
          <TextInput
            placeholder="Buscar por usuario o entidad..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, {color: colors.primary}]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={colors.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Horizontal Operation Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {operations.map((op) => {
            const isSelected = selectedOperation === op;
            return (
              <TouchableOpacity
                key={op}
                onPress={() => setSelectedOperation(op)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceDim,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? colors.background : colors.secondary,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {op === 'ALL' ? 'Todos' : op}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sync Status Info */}
      <View style={[styles.syncBar, { borderBottomColor: colors.border }]}>
        <View style={styles.syncLeft}>
          <MaterialIcons name="cloud-queue" size={16} color={colors.dataBlue} style={{ marginRight: 6 }} />
          <Text style={[styles.syncText, { color: colors.secondary }]}>MongoDB Atlas Cloud logs</Text>
        </View>
        <TouchableOpacity onPress={loadLogs} style={styles.syncRight}>
          <MaterialIcons name="sync" size={16} color={colors.dataBlue} style={{ marginRight: 4 }} />
          <Text style={{ color: colors.dataBlue, fontWeight: 'bold', fontSize: 12 }}>Sincronizar</Text>
        </TouchableOpacity>
      </View>

      {/* Audit List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.dataBlue} />
          <Text style={{color: colors.secondary, marginTop: 12, fontSize: 13}}>Cargando auditoría...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={styles.listContainer}
          renderItem={({item, index}) => {
            const badge = getOperationBadgeStyle(item.operation);
            return (
              <FadeInUpCard delay={index * 50} duration={350}>
                <View style={[styles.logCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                  {/* Header Row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.badge, {backgroundColor: badge.bg, borderColor: badge.border}]}>
                        <Text style={[styles.badgeText, {color: badge.text}]}>{item.operation}</Text>
                      </View>
                      <Text style={[styles.entityText, {color: colors.primary}]}>
                        {item.entity ? item.entity.toUpperCase() : 'SYSTEM'}
                      </Text>
                    </View>
                    <Text style={[styles.statusText, {color: item.status === 'success' ? '#00FF66' : '#FF3B30'}]}>
                      {item.status === 'success' ? 'ÉXITO' : 'FALLO'}
                    </Text>
                  </View>

                  {/* Body Content */}
                  <View style={styles.cardBody}>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="person-outline" size={14} color={colors.secondary} style={{marginRight: 6}} />
                      <Text style={[styles.detailLabel, {color: colors.secondary}]}>Usuario: </Text>
                      <Text style={[styles.detailValue, {color: colors.primary, fontWeight: 'bold'}]}>
                        {item.username || 'Sistema'}
                      </Text>
                    </View>

                    {item.recordId ? (
                      <View style={styles.detailRow}>
                        <MaterialIcons name="fingerprint" size={14} color={colors.secondary} style={{marginRight: 6}} />
                        <Text style={[styles.detailLabel, {color: colors.secondary}]}>ID Registro: </Text>
                        <Text style={[styles.detailValue, {color: colors.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'}]}>
                          {item.recordId}
                        </Text>
                      </View>
                    ) : null}

                    {item.ipAddress || item.endpoint ? (
                      <View style={styles.detailRow}>
                        <MaterialIcons name="dns" size={14} color={colors.secondary} style={{marginRight: 6}} />
                        <Text style={[styles.detailValue, {color: colors.secondary, fontSize: 11}]}>
                          {item.ipAddress || '127.0.0.1'} {' • '} {item.endpoint || '/'}
                        </Text>
                      </View>
                    ) : null}

                    {item.errorMessage ? (
                      <View style={[styles.errorBox, {backgroundColor: '#FF3B3015', borderColor: '#FF3B3030'}]}>
                        <MaterialIcons name="error-outline" size={14} color="#FF3B30" style={{marginRight: 6}} />
                        <Text style={{color: '#FF3B30', fontSize: 11, flex: 1}} numberOfLines={2}>
                          {item.errorMessage}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Footer Row */}
                  <View style={[styles.cardFooter, {borderTopColor: colors.border}]}>
                    <MaterialIcons name="access-time" size={14} color={colors.secondary} style={{marginRight: 4}} />
                    <Text style={[styles.timeText, {color: colors.secondary}]}>
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              </FadeInUpCard>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history-toggle-off" size={60} color={colors.secondary} style={{marginBottom: 10}} />
              <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 16}}>Sin Registros</Text>
              <Text style={{color: colors.secondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 40}}>
                No se encontraron logs de auditoría en MongoDB Atlas que coincidan con los filtros.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    paddingVertical: 0,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
  },
  syncBar: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  entityText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
  },
  emptyContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuditLogsScreen;
