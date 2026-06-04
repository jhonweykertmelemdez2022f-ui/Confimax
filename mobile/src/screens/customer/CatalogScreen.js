import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {inventoryAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

function CatalogScreen({navigation}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const {colors} = useTheme();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadProducts();
    }
  }, [isFocused]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductItem = ({item}) => (
    <TouchableOpacity 
      style={dynamicStyles.productCard}
      onPress={() => navigation.navigate('CustomerProductDetailScreen', { product: item, id: item.id })}
    >
      <View style={dynamicStyles.productInfo}>
        <Text style={dynamicStyles.productName}>{item.name}</Text>
        <Text style={dynamicStyles.productSku}>{item.sku}</Text>
        <Text style={dynamicStyles.productPrice}>${(Number(item.price || item.unitPrice) || 0).toFixed(2)}</Text>
      </View>
      <MaterialIcons name="arrow-forward-ios" size={20} color={colors.onSurface} />
    </TouchableOpacity>
  );

  const dynamicStyles = createStyles(colors);

  return (
    <View style={dynamicStyles.container}>
      <TextInput
        style={dynamicStyles.searchInput}
        placeholder="Buscar productos por nombre o SKU..."
        placeholderTextColor={colors.secondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {loading ? (
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={dynamicStyles.list}
        />
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    paddingHorizontal: 15,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.onSurface,
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  productSku: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
  },
});

export default CatalogScreen;