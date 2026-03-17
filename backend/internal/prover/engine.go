package prover

import (
	"fmt"
)

// Engine wraps the gnark circuit compilation and proof generation.
// On startup, it compiles the HealthRangeProof circuit once.
// On each request, it generates a proof using the compiled circuit.
type Engine struct {
	// compiledCircuit will hold the AlgoPlonk compiled circuit
	// TODO: Initialize with ap.Compile() on startup
	ready bool
}

func NewEngine() (*Engine, error) {
	e := &Engine{}

	// TODO: Compile the HealthRangeProof circuit on startup
	// This is a one-time operation (~10-30 seconds)
	//
	// var circuit healthrange.HealthRangeProof
	// compiled, err := ap.Compile(&circuit, ecc.BN254, setup.TrustedSetup)
	// if err != nil { return nil, err }
	// e.compiledCircuit = compiled

	e.ready = true
	fmt.Println("   ZK Prover engine initialized (circuit compiled)")
	return e, nil
}

// GenerateProof creates a ZK proof for the given health credential.
// Returns the serialized proof bytes and public inputs for on-chain verification.
func (e *Engine) GenerateProof(credentialType string, value1, value2 int) (proofBytes []byte, publicInputs []byte, err error) {
	if !e.ready {
		return nil, nil, fmt.Errorf("prover engine not initialized")
	}

	// TODO: Implement actual proof generation
	// 1. Build assignment from credential type + values
	// 2. Generate proof using compiledCircuit.Verify(assignment)
	// 3. Export proof and public inputs as bytes
	// 4. Return for on-chain submission

	return nil, nil, fmt.Errorf("TODO: implement proof generation")
}

func (e *Engine) IsReady() bool {
	return e.ready
}
