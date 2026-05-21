const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.errors,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      message: 'Duplicate entry',
    });
  }

  if (err.code === '23503') {
    // Analizar el mensaje de error para identificar la relación
    let detailMessage = 'Foreign key violation';
    
    if (err.detail) {
      if (err.detail.includes('category_id')) {
        detailMessage = 'La categoría especificada no existe';
      } else if (err.detail.includes('product_id')) {
        detailMessage = 'El producto especificado no existe';
      } else if (err.detail.includes('customer_id')) {
        detailMessage = 'El cliente especificado no existe';
      } else if (err.detail.includes('user_id')) {
        detailMessage = 'El usuario especificado no existe';
      } else if (err.detail.includes('order_id')) {
        detailMessage = 'El pedido especificado no existe';
      } else if (err.detail.includes('still referenced')) {
        detailMessage = 'No se puede eliminar porque tiene registros asociados';
      }
    }
    
    return res.status(400).json({
      message: detailMessage,
      detail: err.detail,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  errorHandler,
};
