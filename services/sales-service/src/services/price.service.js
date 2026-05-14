const config = require('../config');

const PriceService = {
  calculatePrices(basePrice, currency = 'VES') {
    const rates = config.exchangeRates.default;
    const prices = {};

    for (const curr of config.currencies.supported) {
      if (curr === currency) {
        prices[curr] = basePrice;
      } else {
        const baseInUSD = basePrice / rates[currency];
        prices[curr] = baseInUSD * rates[curr];
      }
    }

    return prices;
  },

  convertPrice(amount, fromCurrency, toCurrency) {
    const rates = config.exchangeRates.default;
    
    const amountInUSD = amount / rates[fromCurrency];
    const converted = amountInUSD * rates[toCurrency];
    
    return Math.round(converted * 100) / 100;
  },

  calculateSaleTotals(items, currency = 'VES') {
    let subtotal = 0;
    
    const itemsWithConversion = items.map(item => {
      const convertedPrice = this.convertPrice(item.unit_price, currency, currency);
      const total = item.quantity * convertedPrice;
      subtotal += total;
      
      return {
        ...item,
        unit_price_converted: convertedPrice,
        total,
      };
    });

    const iva = subtotal * config.tax.iva;
    const total = subtotal + iva;

    return {
      items: itemsWithConversion,
      subtotal: Math.round(subtotal * 100) / 100,
      iva: Math.round(iva * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency,
    };
  },

  getExchangeRates() {
    return config.exchangeRates.default;
  },

  formatPrice(amount, currency = 'VES') {
    const symbols = {
      VES: 'Bs.',
      USD: '$',
      COP: '$',
    };
    
    return `${symbols[currency] || ''} ${amount.toFixed(2)}`;
  },
};

module.exports = PriceService;
