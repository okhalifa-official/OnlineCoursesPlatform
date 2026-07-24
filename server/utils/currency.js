function convertPrice(egpAmount, targetCurrency, egpPerUsd) {
  const amount = Number(egpAmount) || 0;

  if (targetCurrency === "EGP") {
    return { amount, currency: "EGP" };
  }

  if (targetCurrency !== "USD") {
    throw new Error(`Unsupported target currency: ${targetCurrency}`);
  }

  if (amount === 0) {
    return { amount: 0, currency: "USD" };
  }

  if (!Number.isFinite(egpPerUsd) || egpPerUsd <= 0) {
    throw new Error("egpPerUsd must be a positive finite number");
  }

  const rawUsd = amount / egpPerUsd;
  const roundedUp = Math.ceil(rawUsd / 5) * 5;

  return { amount: roundedUp, currency: "USD" };
}

module.exports = { convertPrice };
