const express = require('express');
const BorsaAPI = require('borsa-api');

const app = express();
const api = new BorsaAPI();

app.get('/api/market/stock/:symbol', async (req, res) => {
  try {
    const stock = await api.getStock(req.params.symbol);

    res.json({
      isSuccess: true,
      data: stock
    });
  } catch (error) {
    console.error('Stock API error:', error);

    res.status(500).json({
      isSuccess: false,
      message: 'Hisse verisi alınamadı.'
    });
  }
});

app.get('/api/market/index/:symbol', async (req, res) => {
  try {
    const index = await api.getIndex(req.params.symbol);

    res.json({
      isSuccess: true,
      data: index
    });
  } catch (error) {
    console.error('Index API error:', error);

    res.status(500).json({
      isSuccess: false,
      message: 'Endeks verisi alınamadı.'
    });
  }
});

app.listen(3001, () => {
  console.log('📈 Market Data Service: http://localhost:3001');
});