import express from 'express';
import { guaritas, getGuaritas } from '../services/store';
import path from 'path';

const app = express();
const PORT = 9001;

// Configura o caminho absoluto para a pasta frontend
const frontendPath = path.join(__dirname);
app.use(express.static(frontendPath));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Rota API
app.get('/api/guaritas', (req, res) => {
  res.json(getGuaritas());
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Serving static files from: ${frontendPath}`); // Para debug
});