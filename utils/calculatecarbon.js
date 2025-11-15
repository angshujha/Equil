module.exports = function calculateCarbon(data) {

  // -----------------------------
  // 1. TRAVEL & TRANSPORTATION
  // -----------------------------
  const travelData = data.travel || {};

  const travel =
    (parseFloat(travelData.carKm) || 0) * 0.21 +
    (parseFloat(travelData.bikeKm) || 0) * 0.05 +
    (parseFloat(travelData.busKm) || 0) * 0.05 +
    (parseFloat(travelData.trainKm) || 0) * 0.04 +
    (parseFloat(travelData.flightHours) || 0) * 90;


  // -----------------------------
  // 2. HOME ENERGY
  // -----------------------------
  const homeData = data.home || {};

  const home =
    (parseFloat(homeData.electricityKwh) || 0) * 0.82 +
    (parseFloat(homeData.lpgCylinders) || 0) * 44 +
    (parseFloat(homeData.waterUsage) || 0) * 0.003;


  // -----------------------------
  // 3. FOOD & DIET
  // -----------------------------
  const foodData = data.fooddiet || {};

  const dietFactors = {
    omnivore: 3.3,
    vegetarian: 1.7,
    vegan: 1.5,
  };

  const meatScore =
    foodData.meatConsumption === "daily"
      ? 50
      : foodData.meatConsumption === "weekly"
        ? 20
        : 5;

  const food =
    (dietFactors[foodData.dietType] || 2.5) * 30 +
    meatScore -
    ((parseFloat(foodData.localFoodPercentage) || 0) / 10);


  // -----------------------------
  // 4. WASTE & RECYCLING
  // -----------------------------
  const wasteData = data.waste || {};

  const waste =
    (parseFloat(wasteData.weeklyWasteKg) || 0) * 4 +
    (wasteData.recycle === "on" || wasteData.recycle === true ? -10 : 0) +
    (wasteData.compost === "on" || wasteData.compost === true ? -15 : 0);


  // -----------------------------
  // FINAL TOTAL
  // -----------------------------
  const total = travel + home + food + waste;

  return {
    total: Number(total.toFixed(2)),
    breakdown: {
      travel: Number(travel.toFixed(2)),
      home: Number(home.toFixed(2)),
      food: Number(food.toFixed(2)),
      waste: Number(waste.toFixed(2)),
    }
  };
};
