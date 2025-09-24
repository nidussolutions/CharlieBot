import express from 'express';
import route from './routes.js';
import { PORT, IsProduction } from './config.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use('/', route);

app.listen(PORT, () => {
  console.log(`[Environment] ${IsProduction ? 'Produção' : 'Desenvolvimento'}`);
  console.log(`Server rodando em http://localhost:${PORT}`);
});
