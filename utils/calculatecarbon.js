const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = "https://beta3.api.climatiq.io/estimate";

const FACTORS = {
  travel: { car: 0.21, bus: 0.05, train: 0.06, bike: 0.0 },
  energy: { electricity: 0.82 },
  diet: { meat: 6.9, mixed: 3.0, vegetarian: 1.5 }
};

async function calculateTravelCO2(distance, mode) {
  try {
    let activityId;
    switch (mode.toLowerCase()) {
      case "car": activityId = "passenger_vehicle-vehicle_type_car-fuel_source_na-distance_na-engine_size_na"; break;
      case "bus": activityId = "passenger_vehicle-vehicle_type_bus-fuel_source_na-distance_na-engine_size_na"; break;
      case "train": activityId = "passenger_vehicle-vehicle_type_train-fuel_source_na-distance_na-engine_size_na"; break;
      default: return 0;
    }

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLIMATIQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emission_factor: { activity_id: activityId },
        parameters: { distance: parseFloat(distance), distance_unit: "km" },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error("API error");

    return data.co2e || 0;
  } catch (err) {
    console.warn("⚠️ API failed, using local formula");
    return distance * (FACTORS.travel[mode] || 0);
  }
}

async function calculateEnergyCO2(kwh) {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLIMATIQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emission_factor: { activity_id: "electricity-energy_source_grid_mix" },
        parameters: { energy: kwh, energy_unit: "kWh" },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error("API error");

    return data.co2e || 0;
  } catch (err) {
    console.warn("⚠️ API failed, using local formula");
    return kwh * FACTORS.energy.electricity;
  }
}

async function calculateDietCO2(dietType) {
  try {
    let activityId;
    switch (dietType.toLowerCase()) {
      case "meat": activityId = "food-type_meat"; break;
      case "mixed": activityId = "food-type_mixed"; break;
      case "vegetarian": activityId = "food-type_vegetarian"; break;
      default: return 0;
    }

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLIMATIQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emission_factor: { activity_id: activityId },
        parameters: { amount: 1, amount_unit: "meal" },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error("API error");

    return data.co2e || 0;
  } catch (err) {
    console.warn("⚠️ API failed, using local formula");
    return FACTORS.diet[dietType] || 0;
  }
}

module.exports = { calculateTravelCO2, calculateEnergyCO2, calculateDietCO2 };
