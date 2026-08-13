const BorsaAPI = require('borsa-api');

async function main() {
  const api = new BorsaAPI();

  try {
    const xu100 = await api.getIndex('XU100');
    console.log('XU100:', xu100);

    const thyao = await api.getStock('THYAO');
    console.log('THYAO:', thyao);
  } catch (error) {
    console.error('API HATASI:', error.message);
  }
}

main();