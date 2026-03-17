package healthrange

import (
	"github.com/consensys/gnark/frontend"
)

// HealthRangeProof is a configurable ZK circuit that proves a health value
// falls within a specified range WITHOUT revealing the actual value.
//
// One circuit handles all 5 credential types:
//   1 = Blood Pressure (dual value: systolic + diastolic)
//   2 = Fasting Blood Sugar (single value)
//   3 = BMI (single value, scaled by 10 for decimal precision)
//   4 = Total Cholesterol (single value)
//   5 = Report Recency (single value: days since report)
//
// The verifier only learns: "value is within acceptable range" (true/false)
// The actual value NEVER leaves the prover's device.
type HealthRangeProof struct {
	// ---- Private inputs (secret — only the prover knows these) ----
	Value1 frontend.Variable `gnark:",secret"` // Primary value (e.g., systolic BP, glucose, BMI*10, cholesterol, days)
	Value2 frontend.Variable `gnark:",secret"` // Secondary value (e.g., diastolic BP) — ignored for single-value credentials

	// ---- Public inputs (verifier sees these — they define the "acceptable range") ----
	Min1 frontend.Variable `gnark:",public"` // Minimum acceptable for Value1 (inclusive)
	Max1 frontend.Variable `gnark:",public"` // Maximum acceptable for Value1 (inclusive)
	Min2 frontend.Variable `gnark:",public"` // Minimum acceptable for Value2 (inclusive) — 0 if unused
	Max2 frontend.Variable `gnark:",public"` // Maximum acceptable for Value2 (inclusive) — 0 if unused

	// Control flags
	CheckDual frontend.Variable `gnark:",public"` // 1 = also check Value2 (for BP), 0 = skip Value2
}

// Define implements the gnark circuit constraints.
// If all constraints are satisfied, the proof is valid = "health values are in range."
// If any constraint fails, proof generation fails = "values are out of range."
func (c *HealthRangeProof) Define(api frontend.API) error {
	// ================================================================
	// CONSTRAINT 1: Value1 must be >= Min1
	// We compute (Value1 - Min1) and assert it's non-negative
	// ================================================================
	diff1Lower := api.Sub(c.Value1, c.Min1)
	api.AssertIsLessOrEqual(c.Min1, c.Value1) // Min1 <= Value1

	// ================================================================
	// CONSTRAINT 2: Value1 must be <= Max1
	// ================================================================
	_ = diff1Lower // used implicitly by the constraint above
	api.AssertIsLessOrEqual(c.Value1, c.Max1) // Value1 <= Max1

	// ================================================================
	// CONSTRAINT 3 (conditional): If CheckDual == 1, Value2 >= Min2
	// CONSTRAINT 4 (conditional): If CheckDual == 1, Value2 <= Max2
	//
	// For single-value credentials (blood sugar, BMI, cholesterol, recency),
	// CheckDual = 0 and Value2/Min2/Max2 are all set to 0, so the
	// constraints are trivially satisfied (0 >= 0 and 0 <= 0).
	//
	// For blood pressure, CheckDual = 1 and Value2 = diastolic reading.
	// ================================================================

	// Effective values: if CheckDual == 0, replace with 0 so constraints pass trivially
	effectiveValue2 := api.Mul(c.CheckDual, c.Value2)
	effectiveMin2 := api.Mul(c.CheckDual, c.Min2)
	effectiveMax2 := api.Mul(c.CheckDual, c.Max2)

	api.AssertIsLessOrEqual(effectiveMin2, effectiveValue2) // Min2 <= Value2 (when active)
	api.AssertIsLessOrEqual(effectiveValue2, effectiveMax2) // Value2 <= Max2 (when active)

	return nil
}

// ================================================================
// CREDENTIAL CONFIGURATIONS
// These define the public inputs for each credential type.
// The private inputs (actual health values) come from the user.
// ================================================================

// BloodPressureConfig returns public inputs for BP verification.
// Normal BP: systolic < 140 AND diastolic < 90
// We use 60-140 for systolic and 40-90 for diastolic to catch both extremes.
func BloodPressureConfig() (min1, max1, min2, max2, checkDual int) {
	return 60, 140, 40, 90, 1
}

// FastingBloodSugarConfig returns public inputs for fasting glucose.
// Normal fasting glucose: 70-100 mg/dL
func FastingBloodSugarConfig() (min1, max1, min2, max2, checkDual int) {
	return 70, 100, 0, 0, 0
}

// BMIConfig returns public inputs for BMI verification.
// Normal BMI: 18.5-24.9 → scaled by 10 → 185-249 (to avoid decimals in circuit)
func BMIConfig() (min1, max1, min2, max2, checkDual int) {
	return 185, 249, 0, 0, 0
}

// CholesterolConfig returns public inputs for total cholesterol.
// Desirable: below 200 mg/dL. We set range as 100-200.
func CholesterolConfig() (min1, max1, min2, max2, checkDual int) {
	return 100, 200, 0, 0, 0
}

// ReportRecencyConfig returns public inputs for report date check.
// Value = number of days since report. Must be 0-90 (within last 90 days).
func ReportRecencyConfig() (min1, max1, min2, max2, checkDual int) {
	return 0, 90, 0, 0, 0
}
