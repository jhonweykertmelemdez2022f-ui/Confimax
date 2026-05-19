import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView} from 'react-native';
import {inventoryAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

function NewProductScreen({navigation}) {
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

  const categories = ['despensa', 'frescos', 'lácteos', 'limpieza'];

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
      await inventoryAPI.createProduct({
        name,
        sku,
        price: priceFloat,
        stock_quantity: stockInt,
        category_id: category === 'despensa' ? 'de0a6464-94e8-468b-90f7-5db18863fce9' : '3b9bbcbd-fb12-ae26-d332-b951dc649bd6', // Relación a UUID por defecto
        description: description.trim(),
        image_url: image.trim() || undefined,
        expiration_date: expirationDate.trim() ? expirationDate.trim() : null,
      });
      Alert.alert('Éxito', 'Producto registrado correctamente en el inventario cloud.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log('Error creating product:', error);
      Alert.alert('Error', 'No se pudo crear el producto. Valida que el código SKU no esté duplicado.');
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = createStyles(colors);

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.contentContainer}>
      <View style={dynamicStyles.form}>
        <Text style={dynamicStyles.title}>REGISTRO DE PRODUCTO</Text>
        
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
          {categories.map((cat) => (
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
              <Text style={dynamicStyles.saveButtonText}>REGISTRAR NUEVO PRODUCTO</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 4,
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
    height: 50,
    backgroundColor: colors.surfaceDim,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: colors.primary,
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
    borderColor: colors.dataBlue,
    backgroundColor: `${colors.dataBlue}15`,
  },
  categoryText: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  activeCategoryText: {
    color: colors.dataBlue,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.dataBlue,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: colors.dataBlue,
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
