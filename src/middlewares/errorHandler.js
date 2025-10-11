// src/middlewares/errorHandler.js
export function errorHandler(err, req, res, next) {
console.error('💥 Unhandled error:', err);
res.status(500).json({ status: 'ERROR', message: 'Error interno del servidor', error: err.message });
}