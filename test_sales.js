const axios = require('axios');

async function runTest() {
  const gatewayUrl = 'http://localhost:8080/api';
  
  try {
    // 1. Crear un usuario de prueba (cliente)
    const testUser = {
      name: 'Test Customer',
      username: `test_customer_${Date.now()}`,
      email: `test_${Date.now()}@test.com`,
      password: 'password123',
      role: 'customer'
    };
    
    console.log(`[TEST] 1. Registrando usuario cliente: ${testUser.username}...`);
    const registerRes = await axios.post(`${gatewayUrl}/auth/register`, testUser);
    const token = registerRes.data.accessToken || registerRes.data.token;
    
    if (!token) {
      console.log('Fallo al obtener el token en el registro.');
      return;
    }
    console.log('[TEST] Usuario registrado y token obtenido correctamente.');

    // 2. Hacer una venta simulada
    console.log('\n[TEST] 2. Ejecutando POST /sales/customer...');
    const saleData = {
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174000', // Un UUID cualquiera para pasar validacion UUID
          sku: 'TEST-SKU',
          product_name: 'Test Product',
          quantity: 1,
          unit_price: 100
        }
      ],
      notes: 'Test sale'
    };

    const saleRes = await axios.post(`${gatewayUrl}/sales/customer`, saleData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`[TEST] EXITOSO! Status code: ${saleRes.status}`);
    console.log('[TEST] Respuesta:', saleRes.data);
    
  } catch (error) {
    console.log(`\n[TEST] OCURRIÓ UN ERROR HTTP: ${error.response ? error.response.status : error.message}`);
    if (error.response) {
      console.log('[TEST] Detalles del error:', error.response.data);
    }
  }
}

runTest();
