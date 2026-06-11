import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../theme';
import { providersAPI } from '../../services/api';

export default function ProvidersScreen({ navigation }) {
  const { colors, spacing, typography } = useTheme();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [expiring, setExpiring] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [providersRes, expiringRes] = await Promise.all([
        providersAPI.getProviders(),
        providersAPI.getExpiringInvoices(7),
      ]);
      setProviders(providersRes.data || []);
      setExpiring(expiringRes.data || []);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  const handleRefresh = () => load();

  const styles = StyleSheet.create({
    container: { flex: 1, padding: spacing.page, backgroundColor: colors.surfaceDim },
    item: { padding: spacing.lg, backgroundColor: colors.surface, marginBottom: spacing.sm, borderRadius: 10, borderWidth: 1, borderColor: colors.borderMuted },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    providerName: { fontSize: 18, fontWeight: '800', color: colors.onSurface },
    providerMeta: { fontSize: 14, color: colors.muted, marginTop: 6 },
    alertBox: { backgroundColor: '#FFF4E5', borderColor: '#F59E0B', borderWidth: 1, padding: 14, borderRadius: 12, marginBottom: spacing.md },
    alertTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 8 },
    alertText: { fontSize: 12, color: '#92400E' },
    newButton: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 10, marginBottom: spacing.md },
    newButtonText: { color: '#ffffff', fontWeight: '700' },
  });

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={typography.title}>Proveedores</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.newButton}>
          <Text style={styles.newButtonText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {expiring.length > 0 && (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>Facturas por vencer</Text>
          {expiring.slice(0, 3).map((invoice) => (
            <Text key={invoice.id} style={styles.alertText}>Proveedor {invoice.provider_name || invoice.supplier_name || invoice.supplier_id} vence {invoice.due_date}</Text>
          ))}
          {expiring.length > 3 && <Text style={styles.alertText}>Y {expiring.length - 3} más...</Text>}
        </View>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('NewProvider')} style={styles.newButton}>
        <Text style={styles.newButtonText}>+ Nuevo proveedor</Text>
      </TouchableOpacity>

      <FlatList
        data={providers}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('ProviderDetail', { id: item.id })}
          >
            <Text style={styles.providerName}>{item.company_name}</Text>
            <Text style={styles.providerMeta}>{item.description || 'Sin descripción'}</Text>
            <Text style={styles.providerMeta}>{item.sells ? `Vende: ${item.sells}` : 'Productos no especificados'}</Text>
            <Text style={styles.providerMeta}>{item.contact_name || 'Contacto no disponible'}{item.contact_id ? ` · C.I. ${item.contact_id}` : ''}{item.phone ? ` · ${item.phone}` : ''}</Text>
            <Text style={styles.providerMeta}>{item.rif ? `RIF: ${item.rif}` : 'RIF no registrado'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
