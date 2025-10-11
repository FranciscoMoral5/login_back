// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import routes from './routes/index.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'API Burger' });
});

// montás el router índice, que adentro cuelga /api/pedidos, /api/productos, etc.
app.use(routes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// errores centralizados al final
app.use(errorHandler);

export default app;
