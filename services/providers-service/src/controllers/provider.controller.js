const providerService = require('../services/provider.service');

const listProviders = async (req, res, next) => {
  try {
    const result = await providerService.listProviders(req.query);
    res.json(result);
  } catch (err) { next(err); }
};

const searchProviders = async (req, res, next) => {
  try {
    const q = req.query.q || req.query.qs || '';
    const result = await providerService.searchProviders(q);
    res.json(result);
  } catch (err) { next(err); }
};

const getProvider = async (req, res, next) => {
  try {
    const provider = await providerService.getProviderById(req.params.id);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    res.json(provider);
  } catch (err) { next(err); }
};

const createProvider = async (req, res, next) => {
  try {
    const created = await providerService.createProvider(req.body);
    res.status(201).json(created);
  } catch (err) { next(err); }
};

const updateProvider = async (req, res, next) => {
  try {
    const updated = await providerService.updateProvider(req.params.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

const deleteProvider = async (req, res, next) => {
  try {
    await providerService.deleteProvider(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};

const getProviderProducts = async (req, res, next) => {
  try {
    const products = await providerService.getProviderProducts(req.params.id);
    res.json(products);
  } catch (err) { next(err); }
};

const addProviderProduct = async (req, res, next) => {
  try {
    const product = await providerService.addProviderProduct(req.params.id, req.body);
    res.status(201).json(product);
  } catch (err) { next(err); }
};

const updateProviderProduct = async (req, res, next) => {
  try {
    const product = await providerService.updateProviderProduct(req.params.id, req.params.productId, req.body);
    res.json(product);
  } catch (err) { next(err); }
};

const deleteProviderProduct = async (req, res, next) => {
  try {
    await providerService.deleteProviderProduct(req.params.id, req.params.productId);
    res.status(204).end();
  } catch (err) { next(err); }
};

module.exports = {
  listProviders,
  searchProviders,
  getProvider,
  createProvider,
  updateProvider,
  deleteProvider,
  getProviderProducts,
  addProviderProduct,
  updateProviderProduct,
  deleteProviderProduct,
};
