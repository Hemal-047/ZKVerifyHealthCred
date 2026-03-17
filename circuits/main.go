package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/consensys/gnark-crypto/ecc"
	ap "github.com/giuliop/algoplonk"
	"github.com/giuliop/algoplonk/setup"
	"github.com/giuliop/algoplonk/verifier"

	"github.com/privacyshield/circuits/healthrange"
)

func main() {
	fmt.Println("🛡️  PrivacyShield — ZK Health Credential Circuit Compiler")
	fmt.Println("=========================================================")

	// Step 1: Define the circuit
	fmt.Println("\n📐 Step 1: Defining HealthRangeProof circuit...")
	var circuit healthrange.HealthRangeProof

	// Step 2: Compile with AlgoPlonk using BN254 curve
	// BN254 is cheaper on Algorand (~208 min tx fees vs ~265 for BLS12-381)
	fmt.Println("⚙️  Step 2: Compiling circuit with AlgoPlonk (BN254)...")

	compiledCircuit, err := ap.Compile(&circuit, ecc.BN254, setup.PerpetualPowersOfTauBN254)
	if err != nil {
		log.Fatalf("❌ Circuit compilation failed: %v", err)
	}
	fmt.Println("✅ Circuit compiled successfully!")

	// Step 3: Generate Algorand smart contract verifier
	fmt.Println("📝 Step 3: Generating Algorand smart contract verifier...")

	outputDir := filepath.Join("..", "contracts", "verifier")
	os.MkdirAll(outputDir, 0755)

	verifierPath := filepath.Join(outputDir, "verifier.py")
	err = compiledCircuit.WritePuyaPyVerifier(verifierPath, verifier.SmartContract)
	if err != nil {
		log.Fatalf("❌ Verifier generation failed: %v", err)
	}
	fmt.Printf("✅ Algorand verifier written to: %s\n", verifierPath)

	// Step 4: Generate a test proof to verify everything works
	fmt.Println("\n🧪 Step 4: Generating test proof (BP 125/82)...")

	min1, max1, min2, max2, checkDual := healthrange.BloodPressureConfig()
	testAssignment := &healthrange.HealthRangeProof{
		Value1:    125,
		Value2:    82,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	verifiedProof, err := compiledCircuit.Verify(testAssignment)
	if err != nil {
		log.Fatalf("❌ Test proof failed: %v", err)
	}
	fmt.Println("✅ Test proof generated and verified locally!")

	// Step 5: Export proof and public inputs for on-chain verification
	fmt.Println("💾 Step 5: Exporting proof and public inputs...")

	proofDir := filepath.Join(outputDir, "generated")
	os.MkdirAll(proofDir, 0755)

	proofPath := filepath.Join(proofDir, "proof.bin")
	publicInputsPath := filepath.Join(proofDir, "public_inputs.bin")

	err = verifiedProof.ExportProofAndPublicInputs(proofPath, publicInputsPath)
	if err != nil {
		log.Fatalf("❌ Export failed: %v", err)
	}
	fmt.Printf("✅ Proof exported to: %s\n", proofPath)
	fmt.Printf("✅ Public inputs exported to: %s\n", publicInputsPath)

	fmt.Println("\n=========================================================")
	fmt.Println("🎉 Circuit compilation complete!")
	fmt.Println("")
	fmt.Println("Next steps:")
	fmt.Println("  1. cd ../contracts/verifier")
	fmt.Println("  2. algokit compile verifier.py        # compile to TEAL")
	fmt.Println("  3. algokit deploy                     # deploy to TestNet")
	fmt.Println("  4. Use generated/proof.bin to test on-chain verification")
	fmt.Println("=========================================================")
}

// GenerateProof creates a ZK proof for a given credential type and values.
// This function is called by the backend API at runtime.
func GenerateProof(
	compiledCircuit *ap.CompiledCircuit,
	credentialType string,
	value1, value2 int,
) (*ap.VerifiedProof, error) {

	var min1, max1, min2, max2, checkDual int

	switch credentialType {
	case "blood_pressure":
		min1, max1, min2, max2, checkDual = healthrange.BloodPressureConfig()
	case "blood_sugar":
		min1, max1, min2, max2, checkDual = healthrange.FastingBloodSugarConfig()
	case "bmi":
		min1, max1, min2, max2, checkDual = healthrange.BMIConfig()
	case "cholesterol":
		min1, max1, min2, max2, checkDual = healthrange.CholesterolConfig()
	case "report_recency":
		min1, max1, min2, max2, checkDual = healthrange.ReportRecencyConfig()
	default:
		return nil, fmt.Errorf("unknown credential type: %s", credentialType)
	}

	assignment := &healthrange.HealthRangeProof{
		Value1:    value1,
		Value2:    value2,
		Min1:      min1,
		Max1:      max1,
		Min2:      min2,
		Max2:      max2,
		CheckDual: checkDual,
	}

	proof, err := compiledCircuit.Verify(assignment)
	if err != nil {
		return nil, fmt.Errorf("proof generation failed (values out of range): %w", err)
	}

	return proof, nil
}

// GetCredentialLabel returns a human-readable label for the credential type.
func GetCredentialLabel(credentialType string) string {
	labels := map[string]string{
		"blood_pressure":  "Blood Pressure",
		"blood_sugar":     "Fasting Blood Sugar",
		"bmi":             "BMI",
		"cholesterol":     "Total Cholesterol",
		"report_recency":  "Report Recency",
	}
	if label, ok := labels[credentialType]; ok {
		return label
	}
	return credentialType
}

// GetCredentialThresholdDescription returns what the verifier sees.
func GetCredentialThresholdDescription(credentialType string) string {
	descriptions := map[string]string{
		"blood_pressure":  "Systolic 60-140 mmHg, Diastolic 40-90 mmHg",
		"blood_sugar":     "Fasting glucose 70-100 mg/dL",
		"bmi":             "BMI 18.5-24.9",
		"cholesterol":     "Total cholesterol 100-200 mg/dL",
		"report_recency":  "Report within last 90 days",
	}
	if desc, ok := descriptions[credentialType]; ok {
		return desc
	}
	return "Unknown"
}

// ValidateInputs checks if the user-provided values are sane before proof generation.
// This prevents wasting time generating proofs for obviously invalid inputs.
func ValidateInputs(credentialType string, value1, value2 int) error {
	switch credentialType {
	case "blood_pressure":
		if value1 < 30 || value1 > 300 {
			return fmt.Errorf("systolic must be between 30-300, got %d", value1)
		}
		if value2 < 20 || value2 > 200 {
			return fmt.Errorf("diastolic must be between 20-200, got %d", value2)
		}
	case "blood_sugar":
		if value1 < 20 || value1 > 600 {
			return fmt.Errorf("glucose must be between 20-600, got %d", value1)
		}
	case "bmi":
		if value1 < 100 || value1 > 600 { // BMI * 10
			return fmt.Errorf("BMI (x10) must be between 100-600, got %d", value1)
		}
	case "cholesterol":
		if value1 < 50 || value1 > 500 {
			return fmt.Errorf("cholesterol must be between 50-500, got %d", value1)
		}
	case "report_recency":
		if value1 < 0 || value1 > 365 {
			return fmt.Errorf("days since report must be between 0-365, got %d", value1)
		}
	}
	return nil
}
