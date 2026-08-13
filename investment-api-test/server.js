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
app.get('/api/market/history/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;

    const period = req.query.period || '1mo';
    const interval = req.query.interval || '1d';

    const history = await api.getHistoricalData(symbol, {
      period,
      interval
    });

    res.json({
      isSuccess: true,
      data: history
    });

  } catch (error) {
    console.error('Historical data error:', error);

    res.status(500).json({
      isSuccess: false,
      message: 'Geçmiş fiyat verisi alınamadı.'
    });
  }
});
app.listen(3001, () => {
  console.log('📈 Market Data Service: http://localhost:3001');
});