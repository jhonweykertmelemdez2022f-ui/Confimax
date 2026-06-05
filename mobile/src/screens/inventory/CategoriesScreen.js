import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {inventoryAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

function CategoriesScreen({navigation}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const {colors} = useTheme();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadCategories();
    }
  }, [isFocused]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getCategories();
      const catList = response.data.data || [];
      setCategories(catList);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Faltan Datos', 'El nombre de la categoría es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await inventoryAPI.updateCategory(editingCategory.id, formData);
        Alert.alert('Éxito', 'Categoría actualizada correctamente.');
      } else {
        await inventoryAPI.createCategory(formData);
        Alert.alert('Éxito', 'Categoría creada correctamente.');
      }
      setModalVisible(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'No se pudo guardar la categoría.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro que deseas eliminar la categoría "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await inventoryAPI.deleteCategory(category.id);
              Alert.alert('Éxito', 'Categoría eliminada.');
              loadCategories();
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'No se pudo eliminar la categoría.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const openNewModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setModalVisible(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setModalVisible(true);
  };

  const dynamicStyles = createStyles(colors);

  if (loading && categories.length === 0) {
    return (
      <View style={dynamicStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <FlatList
        data={categories}
        renderItem={({item}) => (
          <View style={dynamicStyles.categoryCard}>
            <View style={dynamicStyles.categoryInfo}>
              <View style={dynamicStyles.iconContainer}>
                <MaterialIcons name="folder" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.categoryName}>{item.name}</Text>
                {item.description ? (
                  <Text style={dynamicStyles.categoryDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
              </View>
            </View>
            
            <View style={dynamicStyles.actionsContainer}>
              <TouchableOpacity style={dynamicStyles.actionButton} onPress={() => openEditModal(item)}>
                <MaterialIcons name="edit" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]} onPress={() => handleDelete(item)}>
                <MaterialIcons name="delete" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={dynamicStyles.list}
        ListEmptyComponent={
          <View style={dynamicStyles.emptyContainer}>
            <MaterialIcons name="category" size={60} color={colors.borderMuted} />
            <Text style={dynamicStyles.emptyText}>No hay categorías registradas</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={dynamicStyles.fab}
        onPress={openNewModal}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>

      {/* Modal Brutalista para Crear/Editar */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={dynamicStyles.modalOverlay}
        >
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>
                {editingCategory ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.modalBody}>
              <Text style={dynamicStyles.label}>NOMBRE DE LA CATEGORÍA *</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="Ej: Abarrotes"
                placeholderTextColor={colors.secondary}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />

              <Text style={dynamicStyles.label}>DESCRIPCIÓN (Opcional)</Text>
              <TextInput
                style={[dynamicStyles.input, dynamicStyles.textArea]}
                placeholder="Descripción de los productos..."
                placeholderTextColor={colors.secondary}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={dynamicStyles.modalFooter}>
              <TouchableOpacity 
                style={[dynamicStyles.modalButton, dynamicStyles.cancelButton]} 
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={dynamicStyles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[dynamicStyles.modalButton, dynamicStyles.saveButton, saving && dynamicStyles.disabledButton]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={dynamicStyles.saveButtonText}>GUARDAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

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
  list: {
    padding: 15,
    paddingBottom: 80,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'column',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
    textTransform: 'uppercase',
  },
  categoryDesc: {
    fontSize: 13,
    color: colors.secondary,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    paddingTop: 12,
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceDim,
  },
  deleteButton: {
    borderColor: `${colors.error}40`,
    backgroundColor: `${colors.error}10`,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.onSurface,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    backgroundColor: colors.surfaceDim,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  modalBody: {
    padding: 16,
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
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: colors.surfaceDim,
    borderColor: colors.borderMuted,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: colors.onSurface,
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default CategoriesScreen;
