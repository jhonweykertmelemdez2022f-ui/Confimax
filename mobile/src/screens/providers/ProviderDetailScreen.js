import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../theme';
import { providersAPI } from '../../services/api';

export default function ProviderDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors, spacing, typography } = useTheme();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState(null);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [providerForm, setProviderForm] = useState({
    company_name: '',
    description: '',
    sells: '',
    contact_name: '',
    contact_id: '',
    phone: '',
    rif: '',
  });
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '' });
  const [purchaseForm, setPurchaseForm] = useState({ total: '', tax: '', due_date: '', items: '' });

  useEffect(() => {
    if (id) loadProvider();
  }, [id]);

  const loadProvider = async () => {
    setLoading(true);
    try {
      const [providerRes, productsRes, purchasesRes, expiringRes] = await Promise.all([
        providersAPI.getProvider(id).catch(() => ({ data: null })),
        providersAPI.getProviderProducts(id).catch(() => ({ data: [] })),
        providersAPI.getPurchases({ supplier_id: id }).catch(() => ({ data: [] })),
        providersAPI.getExpiringInvoices(7).catch(() => ({ data: [] })),
      ]);

      const providerData = providerRes.data || providerRes;
      setProvider(providerData);
      setProviderForm({
        company_name: providerData?.company_name || '',
        description: providerData?.description || '',
        sells: providerData?.sells || '',
        contact_name: providerData?.contact_name || '',
        contact_id: providerData?.contact_id || '',
        phone: providerData?.phone || '',
        rif: providerData?.rif || '',
      });
      setProducts(productsRes.data || []);
      setPurchases(purchasesRes.data ? purchasesRes.data.filter(p => p.supplier_id === id || p.supplier_id === providerData?.id) : (purchasesRes.data || purchasesRes).filter(p => p.supplier_id === id));
      setExpiring(expiringRes.data || []);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo cargar la información del proveedor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProvider = async () => {
    if (!providerForm.company_name.trim()) {
      return Alert.alert('Error', 'El nombre de la empresa es obligatorio.');
    }
    try {
      await providersAPI.updateProvider(id, providerForm);
      await loadProvider();
      Alert.alert('Éxito', 'Proveedor actualizado correctamente.');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo actualizar el proveedor.');
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim() || !productForm.price) {
      return Alert.alert('Error', 'Nombre y precio del producto son obligatorios.');
    }

    try {
      const payload = {
        name: productForm.name,
        sku: productForm.sku,
        price: parseFloat(productForm.price) || 0,
      };
      await providersAPI.addProviderProduct(id, payload);
      setProductForm({ name: '', sku: '', price: '' });
      await loadProvider();
      Alert.alert('Éxito', 'Producto agregado correctamente.');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo agregar el producto.');
    }
  };

  const handleRecordPurchase = async () => {
    if (!purchaseForm.total || !purchaseForm.due_date) {
      return Alert.alert('Error', 'Total y fecha de vencimiento son obligatorios.');
    }

    try {
      const items = purchaseForm.items
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((description) => ({ description }));

      await providersAPI.recordPurchase(id, {
        total: parseFloat(purchaseForm.total) || 0,
        tax: parseFloat(purchaseForm.tax) || 0,
        due_date: purchaseForm.due_date,
        items,
      });
      setPurchaseForm({ total: '', tax: '', due_date: '', items: '' });
      await loadProvider();
      Alert.alert('Éxito', 'Compra registrada con IVA y fecha de vencimiento.');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo registrar la compra.');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surfaceDim, padding: spacing.page },
    section: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.borderMuted },
    heading: { fontSize: 18, fontWeight: '800', color: colors.onSurface, marginBottom: 12 },
    label: { fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '700' },
    input: { backgroundColor: colors.surfaceDim, borderColor: colors.borderMuted, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, color: colors.onSurface },
    button: { backgroundColor: colors.primary, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
    buttonText: { color: '#ffffff', fontWeight: '700' },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    smallCard: { backgroundColor: colors.surfaceDim, borderRadius: 14, padding: 12, marginBottom: 12 },
    productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    productName: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
    productMeta: { fontSize: 12, color: colors.muted },
    purchaseMeta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.heading}>Proveedor</Text>
        <Text style={styles.label}>Empresa</Text>
        <TextInput value={providerForm.company_name} onChangeText={(value) => setProviderForm((prev) => ({ ...prev, company_name: value }))} style={styles.input} placeholder="Nombre de la empresa" />
        <Text style={styles.label}>Descripción</Text>
        <TextInput value={providerForm.description} onChangeText={(value) => setProviderForm((prev) => ({ ...prev, description: value }))} style={styles.input} placeholder="Descripción" multiline />
        <Text style={styles.label}>Qué vende</Text>
        <TextInput value={providerForm.sells} onChangeText={(value) => setProviderForm((prev) => ({ ...prev, sells: value }))} style={styles.input} placeholder="Qué ofrece" multiline />
        <Text style={styles.label}>Nombre del vendedor</Text>
        <TextInput value={providerForm.contact_name} onChangeText={(value) => setProviderForm((prev) => ({ ...prev, contact_name: value }))} style={styles.input} placeholder="Contacto" />
        <Text style={styles.label}>Cédula del vendedor</Text>
        <TextInput value={providerForm.contact_id} onChangeText={(value) => setProviderForm((prev) => ({ ...prev, contact_id: value }))} style={styles.input} placeholder="Cédula / ID" keyboardType="numeric" />
        <Text style={styles.label}>Teléfono</Text>
        <TextInput value={providerForm.phone} onChangeText={(value) => setProviderForm((prev) => ({ ...prev, phone: value }))} style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" />
        <Text style={styles.label}>RIF</Text>
        <TextInput value={providerForm.rif} onChangeText={(value) => setProviderForm((prev) => ({ ...prev, rif: value }))} style={styles.input} placeholder="RIF" />
        <TouchableOpacity onPress={handleSaveProvider} style={styles.button}>
          <Text style={styles.buttonText}>Actualizar proveedor</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Productos del proveedor</Text>
        <View style={styles.smallCard}>
          <TextInput value={productForm.name} onChangeText={(value) => setProductForm((prev) => ({ ...prev, name: value }))} style={styles.input} placeholder="Nombre del producto" />
          <TextInput value={productForm.sku} onChangeText={(value) => setProductForm((prev) => ({ ...prev, sku: value }))} style={styles.input} placeholder="SKU" />
          <TextInput value={productForm.price} onChangeText={(value) => setProductForm((prev) => ({ ...prev, price: value }))} style={styles.input} placeholder="Precio" keyboardType="numeric" />
          <TouchableOpacity onPress={handleAddProduct} style={styles.button}>
            <Text style={styles.buttonText}>Agregar producto</Text>
          </TouchableOpacity>
        </View>
        {products.length === 0 ? (
          <Text style={styles.purchaseMeta}>No hay productos registrados para este proveedor.</Text>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productMeta}>{product.sku || 'Sin SKU'}</Text>
              </View>
              <Text style={styles.productMeta}>{product.price?.toFixed(2) ?? '0.00'}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Registrar compra</Text>
        <TextInput value={purchaseForm.total} onChangeText={(value) => setPurchaseForm((prev) => ({ ...prev, total: value }))} style={styles.input} placeholder="Total" keyboardType="numeric" />
        <TextInput value={purchaseForm.tax} onChangeText={(value) => setPurchaseForm((prev) => ({ ...prev, tax: value }))} style={styles.input} placeholder="IVA" keyboardType="numeric" />
        <TextInput value={purchaseForm.due_date} onChangeText={(value) => setPurchaseForm((prev) => ({ ...prev, due_date: value }))} style={styles.input} placeholder="Fecha de vencimiento (YYYY-MM-DD)" />
        <TextInput value={purchaseForm.items} onChangeText={(value) => setPurchaseForm((prev) => ({ ...prev, items: value }))} style={styles.input} placeholder="Items separados por coma" multiline />
        <TouchableOpacity onPress={handleRecordPurchase} style={styles.button}>
          <Text style={styles.buttonText}>Registrar compra</Text>
        </TouchableOpacity>

        <Text style={[styles.heading, { marginTop: 16 }]}>Compras recientes</Text>
        {purchases.length === 0 ? (
          <Text style={styles.purchaseMeta}>No hay compras registradas.</Text>
        ) : purchases.map((purchase) => (
          <View key={purchase.id} style={styles.smallCard}>
            <Text style={styles.productName}>{purchase.provider_name || provider?.company_name}</Text>
            <Text style={styles.productMeta}>Total: {purchase.total?.toFixed(2) ?? '0.00'} · IVA: {purchase.tax?.toFixed(2) ?? '0.00'}</Text>
            <Text style={styles.productMeta}>Vence: {purchase.due_date || 'N/A'}</Text>
          </View>
        ))}
      </View>

      {expiring.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Facturas próximas a vencer</Text>
          {expiring.map((invoice) => (
            <View key={invoice.id} style={styles.smallCard}>
              <Text style={styles.productName}>{invoice.provider_name || invoice.supplier_id}</Text>
              <Text style={styles.productMeta}>Total: {invoice.total?.toFixed(2) ?? '0.00'}</Text>
              <Text style={styles.productMeta}>Vence: {invoice.due_date}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
