// Shared band-derivation helpers — used by userController.js (to snapshot a
// band onto the User doc when the underlying value is set/updated) and by
// squadMatchService.js (to group users by those same bands).

const deriveAgeBand = (age) => {
  if (age >= 18 && age <= 24) return '18-24';
  if (age >= 25 && age <= 34) return '25-34';
  if (age >= 35 && age <= 44) return '35-44';
  if (age >= 45) return '45+';
  return null; // covers under-18 edge case, though age is validated to be >=13
};

const deriveWeightBand = (weightKg) => {
  if (weightKg < 60) return '<60kg';
  if (weightKg < 70) return '60-69kg';
  if (weightKg < 80) return '70-79kg';
  if (weightKg < 90) return '80-89kg';
  if (weightKg < 100) return '90-99kg';
  return '100kg+';
};

module.exports = { deriveAgeBand, deriveWeightBand };
