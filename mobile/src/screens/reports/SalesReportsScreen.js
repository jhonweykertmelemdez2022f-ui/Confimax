import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, ScrollView, TextInput, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../theme';
import { salesAPI } from '../../services/api'; // Assuming a salesAPI exists
import { Picker } from '@react-native-picker/picker'; // Añadir import para Picker

function SalesReportsScreen() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('salesDetail'); // Nuevo estado para el tipo de reporte
  const [customerId, setCustomerId] = useState(''); // Nuevo estado para filtrar por cliente
  const [userId, setUserId] = useState('');       // Nuevo estado para filtrar por usuario
  const [startDate, setStartDate] = useState('');   // Nuevo estado para fecha de inicio
  const [endDate, setEndDate] = useState('');     // Nuevo estado para fecha de fin
  const { colors } = useTheme();

  const generateSalesHtml = (salesData, type) => {
    let title = 'Reporte de Ventas';
    let tableHeaders = '';
    let tableRows = '';
    let summaryHtml = '';

    switch (type) {
      case 'salesDetail':
        title = 'Reporte Detallado de Ventas';
        tableHeaders = `
          <th>ID Venta</th>
          <th>Cliente</th>
          <th>Subtotal</th>
          <th>Descuento</th>
          <th>IVA</th>
          <th>Total</th>
        `;
        tableRows = salesData.map(sale => `
          <tr>
            <td>${sale.id}</td>
            <td>${sale.customerName || 'N/A'}</td>
            <td>$${Number(sale.subtotal || 0).toFixed(2)}</td>
            <td>$${Number(sale.discountAmount || 0).toFixed(2)}</td>
            <td>$${Number(sale.iva || 0).toFixed(2)}</td>
            <td>$${Number(sale.total || 0).toFixed(2)}</td>
          </tr>
        `).join('');
        summaryHtml = `
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Total Recaudado:</span>
              <span>$${Number(salesData.reduce((sum, sale) => sum + (sale.total || 0), 0)).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total IVA:</span>
              <span>$${Number(salesData.reduce((sum, sale) => sum + (sale.iva || 0), 0)).toFixed(2)}</span>
            </div>
          </div>
        `;
        break;
      case 'salesByCustomer':
        title = 'Reporte de Ventas por Cliente';
        tableHeaders = `
          <th>ID Venta</th>
          <th>Cliente</th>
          <th>Total Venta</th>
          <th>Fecha</th>
        `;
        tableRows = salesData.map(sale => `
          <tr>
            <td>${sale.id}</td>
            <td>${sale.customerName || 'N/A'}</td>
            <td>$${Number(sale.total || 0).toFixed(2)}</td>
            <td>${new Date(sale.saleDate).toLocaleDateString()}</td>
          </tr>
        `).join('');
        // Add specific customer summary if needed
        summaryHtml = `
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Total Ventas para Cliente:</span>
              <span>$${Number(salesData.reduce((sum, sale) => sum + (sale.total || 0), 0)).toFixed(2)}</span>
            </div>
          </div>
        `;
        break;
      case 'salesByProduct':
        title = 'Reporte de Ventas por Producto';
        tableHeaders = `
          <th>Producto</th>
          <th>Cantidad Vendida</th>
          <th>Total Recaudado</th>
        `;
        // Esto asume que la API devolverá datos agregados por producto.
        // Si no, necesitaremos procesar los salesData para agregar por producto.
        tableRows = `<tr><td colspan="3">Funcionalidad en desarrollo.</td></tr>`; // Placeholder
        summaryHtml = `<p>Resumen por producto en desarrollo.</p>`;
        break;
      case 'salesByUser':
        title = 'Reporte de Ventas por Usuario';
        tableHeaders = `
          <th>ID Venta</th>
          <th>Usuario</th>
          <th>Total Venta</th>
          <th>Fecha</th>
        `;
        tableRows = salesData.map(sale => `
          <tr>
            <td>${sale.id}</td>
            <td>${sale.userName || 'N/A'}</td>
            <td>$${Number(sale.total || 0).toFixed(2)}</td>
            <td>${new Date(sale.saleDate).toLocaleDateString()}</td>
          </tr>
        `).join('');
        // Add specific user summary if needed
        summaryHtml = `
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Total Ventas para Usuario:</span>
              <span>$${Number(salesData.reduce((sum, sale) => sum + (sale.total || 0), 0)).toFixed(2)}</span>
            </div>
          </div>
        `;
        break;
    }

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
          <style>
            body { font-family: 'Helvetica Neue'; }
            h1 { text-align: center; margin-bottom: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .summary-label { font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 2px solid #333; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                ${tableHeaders}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          ${summaryHtml}
        </body>
      </html>
    `;
  };

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      let params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      switch (reportType) {
        case 'salesDetail':
          // No se necesitan parámetros adicionales, solo rango de fechas
          break;
        case 'salesByCustomer':
          if (customerId) params.customer_id = customerId;
          else {
            Alert.alert('Filtro Requerido', 'Por favor, introduce un ID de Cliente para este reporte.');
            setLoading(false);
            return [];
          }
          break;
        case 'salesByProduct':
          // Necesitamos un endpoint o lógica para filtrar por producto.
          // Por ahora, solo se obtendrán todas las ventas si no hay filtro de producto específico.
          // Esto requeriría una extensión del backend para filtrar ventas por product_id.
          Alert.alert('Funcionalidad Pendiente', 'La segmentación por producto aún no está implementada completamente en el backend.');
          setLoading(false);
          return [];
        case 'salesByUser':
          if (userId) params.user_id = userId;
          else {
            Alert.alert('Filtro Requerido', 'Por favor, introduce un ID de Usuario para este reporte.');
            setLoading(false);
            return [];
          }
          break;
      }
      
      const response = await salesAPI.getSales(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales data:', error);
      Alert.alert('Error', 'No se pudieron obtener los datos de ventas.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createPdf = async () => {
    setLoading(true);
    try {
      const salesData = await fetchSalesData(); // Fetch real data here
      const htmlContent = generateSalesHtml(salesData);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 612,
        height: 792,
        base64: false,
      });

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
      } else {
        Alert.alert('PDF Generado', `El PDF se ha guardado en: ${uri}`);
      }
    } catch (error) {
      console.error('Error generating or sharing PDF:', error);
      Alert.alert('Error', 'No se pudo generar o compartir el PDF.');
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = createStyles(colors);

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <Text style={dynamicStyles.title}>Generación de Reportes</Text>
        <Text style={dynamicStyles.description}>Selecciona el tipo de reporte que deseas generar.</Text>

        <Text style={dynamicStyles.label}>Tipo de Reporte</Text>
        <View style={dynamicStyles.pickerContainer}>
          <Picker
            selectedValue={reportType}
            onValueChange={(itemValue) => setReportType(itemValue)}
            style={dynamicStyles.picker}
            itemStyle={dynamicStyles.pickerItem}
          >
            <Picker.Item label="Detalle de Ventas" value="salesDetail" />
            <Picker.Item label="Ventas por Cliente" value="salesByCustomer" />
            <Picker.Item label="Ventas por Producto" value="salesByProduct" />
            <Picker.Item label="Ventas por Usuario" value="salesByUser" />
          </Picker>
        </View>

        {reportType === 'salesByCustomer' && (
          <View>
            <Text style={dynamicStyles.label}>ID de Cliente</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="UUID del Cliente"
              placeholderTextColor={colors.secondary}
              value={customerId}
              onChangeText={setCustomerId}
            />
          </View>
        )}

        {reportType === 'salesByUser' && (
          <View>
            <Text style={dynamicStyles.label}>ID de Usuario</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="UUID del Usuario"
              placeholderTextColor={colors.secondary}
              value={userId}
              onChangeText={setUserId}
            />
          </View>
        )}

        {(reportType === 'salesDetail' || reportType === 'salesByCustomer' || reportType === 'salesByUser' || reportType === 'salesByProduct') && (
          <View>
            <Text style={dynamicStyles.label}>Fecha de Inicio (YYYY-MM-DD)</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Ej: 2023-01-01"
              placeholderTextColor={colors.secondary}
              value={startDate}
              onChangeText={setStartDate}
            />
            <Text style={dynamicStyles.label}>Fecha de Fin (YYYY-MM-DD)</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Ej: 2023-12-31"
              placeholderTextColor={colors.secondary}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        )}
        
        <Button 
          title={loading ? "Generando PDF..." : "Generar Reporte (PDF)"}
          onPress={createPdf}
          disabled={loading}
          color={colors.primary}
        />
        {loading && <ActivityIndicator size="large" color={colors.primary} style={dynamicStyles.activityIndicator} />}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
  },
  pickerContainer: {
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: colors.primary,
  },
  pickerItem: {
    color: colors.primary,
  },
  activityIndicator: {
    marginTop: 20,
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
});

export default SalesReportsScreen;
