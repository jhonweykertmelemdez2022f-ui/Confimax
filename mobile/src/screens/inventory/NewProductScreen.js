import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView} from 'react-native';
import {inventoryAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

function NewProductScreen({navigation, route}) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('despensa');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await inventoryAPI.getCategories();
        setAvailableCategories(response.data.map(cat => cat.name));
        if (response.data.length > 0 && !category) {
          setCategory(response.data[0].name);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        Alert.alert('Error', 'No se pudieron cargar las categorías.');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (route.params?.product) {
      const product = route.params.product;
      setEditingProduct(product);
      setName(product.name);
      setSku(product.sku);
      setPrice(product.unitPrice?.toString() || product.unit_price?.toString() || product.price?.toString() || '');
      setStock(product.stock_quantity?.toString() || '0');
      setCategory(product.category_id || (availableCategories.length > 0 ? availableCategories[0] : ''));
      setDescription(product.description || '');
      setImage(product.image_url || '');
      setExpirationDate(product.expiration_date ? product.expiration_date.split('T')[0] : '');
    }
  }, [route.params?.product, availableCategories]);

  const handleSave = async () => {
    if (!name || !sku || !price || !stock) {
      Alert.alert('Faltan Datos', 'Por favor, rellena todos los campos requeridos (*).');
      return;
    }

    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat) || priceFloat < 0) {
      Alert.alert('Valor Inválido', 'El precio debe ser un número mayor o igual a cero.');
      return;
    }

    const stockInt = parseInt(stock, 10);
    if (isNaN(stockInt) || stockInt < 0) {
      Alert.alert('Valor Inválido', 'El stock inicial debe ser un número entero mayor o igual a cero.');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name,
        sku,
        price: priceFloat,
        stock_quantity: stockInt,
        description: description.trim(),
        image_url: image.trim() || undefined,
        expiration_date: expirationDate.trim() ? expirationDate.trim() : null,
      };

      if (editingProduct) {
        await inventoryAPI.updateProduct(editingProduct.id, productData);
        Alert.alert('Éxito', 'Producto actualizado correctamente en el inventario cloud.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await inventoryAPI.createProduct(productData);
        Alert.alert('Éxito', 'Producto registrado correctamente en el inventario cloud.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.log(editingProduct ? 'Error updating product:' : 'Error creating product:', error);
      Alert.alert('Error', error.response?.data?.message || 'Ocurrió un error. Valida que el código SKU no esté duplicado.');
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={dynamicStyles.container}
    >
      <ScrollView contentContainerStyle={dynamicStyles.contentContainer} keyboardShouldPersistTaps="handled">
        <View style={dynamicStyles.form}>
          <Text style={dynamicStyles.title}>{editingProduct ? 'EDITAR PRODUCTO' : 'REGISTRO DE PRODUCTO'}</Text>
        
        <Text style={dynamicStyles.label}>NOMBRE DEL PRODUCTO *</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: Manteca Industrial 24kg"
          placeholderTextColor={colors.secondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={dynamicStyles.label}>CÓDIGO DE BARRAS / SKU *</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: SKP-098-765"
          placeholderTextColor={colors.secondary}
          value={sku}
          onChangeText={setSku}
          autoCapitalize="characters"
        />

        <View style={dynamicStyles.row}>
          <View style={dynamicStyles.col}>
            <Text style={dynamicStyles.label}>PRECIO VENTA ($) *</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Ej: 45.50"
              placeholderTextColor={colors.secondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={dynamicStyles.col}>
            <Text style={dynamicStyles.label}>STOCK INICIAL *</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Ej: 100"
              placeholderTextColor={colors.secondary}
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={dynamicStyles.label}>CATEGORÍA</Text>
        <View style={dynamicStyles.categoryRow}>
          {availableCategories.map((cat) => (
            <TouchableOpacity 
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                dynamicStyles.categoryChip,
                category === cat && dynamicStyles.activeCategoryChip
              ]}
            >
              <Text style={[
                dynamicStyles.categoryText,
                category === cat && dynamicStyles.activeCategoryText
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={dynamicStyles.label}>FECHA DE VENCIMIENTO (Opcional - YYYY-MM-DD)</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: 2026-12-31"
          placeholderTextColor={colors.secondary}
          value={expirationDate}
          onChangeText={setExpirationDate}
        />

        <Text style={dynamicStyles.label}>URL DE LA IMAGEN</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: https://example.com/imagen.png"
          placeholderTextColor={colors.secondary}
          value={image}
          onChangeText={setImage}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={dynamicStyles.label}>DESCRIPCIÓN</Text>
        <TextInput
          style={[dynamicStyles.input, dynamicStyles.textArea]}
          placeholder="Escribe una breve descripción del artículo..."
          placeholderTextColor={colors.secondary}
          value={description}
          onChangeText={setDescription}
          multiline={true}
          numberOfLines={3}
        />

        <TouchableOpacity 
          style={[dynamicStyles.saveButton, loading && dynamicStyles.disabledButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="add-shopping-cart" size={20} color="#ffffff" style={{marginRight: 8}} />
              <Text style={dynamicStyles.saveButtonText}>{editingProduct ? 'GUARDAR CAMBIOS' : 'REGISTRAR NUEVO PRODUCTO'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 40,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.primary,
    marginBottom: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceDim,
  },
  activeCategoryChip: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  categoryText: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  activeCategoryText: {
    color: colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: colors.borderMuted,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default NewProductScreen;
