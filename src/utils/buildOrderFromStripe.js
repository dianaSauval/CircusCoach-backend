// utils/buildOrderFromStripe.js (opcional)
module.exports = function buildOrderFromLineItems(lineItems) {
  const items = lineItems.data.map(li => ({
    title: li.description,
    type: "digital",
    price: (li.amount_total ?? li.amount_subtotal) / 100,
    qty: li.quantity || 1,
  }));
  const subtotal = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const shipping = 0;
  const taxes = 0;
  const total = subtotal + shipping + taxes;

  return { items, subtotal, shipping, taxes, total, deliveryOrAccessDate: "inmediata" };
};
