package healthrange

import (
	"testing"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/test"
)

// TestBloodPressureNormal — proves BP 125/82 is within normal range
func TestBloodPressureNormal(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := BloodPressureConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    125, // systolic (private)
		Value2:    82,  // diastolic (private)
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingSucceeded(circuit, assignment, test.WithCurves(ecc.BN254))
}

// TestBloodPressureHigh — should FAIL for hypertensive BP 155/95
func TestBloodPressureHigh(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := BloodPressureConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    155, // systolic too high (private)
		Value2:    95,  // diastolic too high (private)
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingFailed(circuit, assignment, test.WithCurves(ecc.BN254))
}

// TestFastingBloodSugarNormal — proves glucose 92 is normal
func TestFastingBloodSugarNormal(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := FastingBloodSugarConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    92, // glucose level (private)
		Value2:    0,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingSucceeded(circuit, assignment, test.WithCurves(ecc.BN254))
}

// TestFastingBloodSugarHigh — should FAIL for pre-diabetic glucose 115
func TestFastingBloodSugarHigh(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := FastingBloodSugarConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    115, // glucose too high (private)
		Value2:    0,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingFailed(circuit, assignment, test.WithCurves(ecc.BN254))
}

// TestBMINormal — proves BMI 23.5 (235 scaled) is healthy
func TestBMINormal(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := BMIConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    235, // BMI 23.5 * 10 (private)
		Value2:    0,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingSucceeded(circuit, assignment, test.WithCurves(ecc.BN254))
}

// TestBMIObese — should FAIL for BMI 31.2 (312 scaled)
func TestBMIObese(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := BMIConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    312, // BMI 31.2 * 10 (private)
		Value2:    0,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingFailed(circuit, assignment, test.WithCurves(ecc.BN254))
}

// TestCholesterolDesirable — proves cholesterol 185 is desirable
func TestCholesterolDesirable(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := CholesterolConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    185, // cholesterol (private)
		Value2:    0,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingSucceeded(circuit, assignment, test.WithCurves(ecc.BN254))
}

// TestCholesterolHigh — should FAIL for cholesterol 245
func TestCholesterolHigh(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := CholesterolConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    245, // cholesterol too high (private)
		Value2:    0,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingFailed(circuit, assignment, test.WithCurves(ecc.BN254))
}

// TestReportRecent — proves report from 15 days ago is recent
func TestReportRecent(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := ReportRecencyConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    15, // 15 days ago (private)
		Value2:    0,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingSucceeded(circuit, assignment, test.WithCurves(ecc.BN254))
}

// TestReportExpired — should FAIL for report from 120 days ago
func TestReportExpired(t *testing.T) {
	assert := test.NewAssert(t)

	min1, max1, min2, max2, checkDual := ReportRecencyConfig()

	circuit := &HealthRangeProof{}
	assignment := &HealthRangeProof{
		Value1:    120, // 120 days ago — expired (private)
		Value2:    0,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	assert.SolvingFailed(circuit, assignment, test.WithCurves(ecc.BN254))
}
