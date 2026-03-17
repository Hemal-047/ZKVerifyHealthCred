package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/privacyshield/backend/internal/algorand"
	"github.com/privacyshield/backend/internal/prover"
)

type Handler struct {
	prover *prover.Engine
	algo   *algorand.Client
}

func NewHandler(p *prover.Engine, a *algorand.Client) *Handler {
	return &Handler{prover: p, algo: a}
}

// ============ Request/Response Types ============

type GenerateProofRequest struct {
	CredentialType string `json:"credential_type"` // blood_pressure, blood_sugar, bmi, cholesterol, report_recency
	Value1         int    `json:"value1"`           // Primary value
	Value2         int    `json:"value2,omitempty"`  // Secondary value (BP diastolic)
}

type GenerateAllProofsRequest struct {
	Credentials []GenerateProofRequest `json:"credentials"`
	UserHash    string                 `json:"user_hash"` // Hashed user identifier
	VerifierID  string                 `json:"verifier_id,omitempty"`
}

type ProofResult struct {
	CredentialType string `json:"credential_type"`
	Label          string `json:"label"`
	Status         string `json:"status"`          // "verified" or "failed"
	TxID           string `json:"tx_id,omitempty"` // Algorand transaction ID
	ExplorerURL    string `json:"explorer_url,omitempty"`
	Timestamp      string `json:"timestamp"`
}

type CredentialBundle struct {
	CredentialID string        `json:"credential_id"`
	UserHash     string        `json:"user_hash"`
	Results      []ProofResult `json:"results"`
	ConsentTxID  string        `json:"consent_tx_id,omitempty"`
	CreatedAt    string        `json:"created_at"`
}

type ConsentRecord struct {
	ConsentID      string   `json:"consent_id"`
	CredentialID   string   `json:"credential_id"`
	VerifierID     string   `json:"verifier_id"`
	CredentialTypes []string `json:"credential_types"`
	Status         string   `json:"status"` // "active" or "revoked"
	TxID           string   `json:"tx_id"`
	CreatedAt      string   `json:"created_at"`
	RevokedAt      string   `json:"revoked_at,omitempty"`
}

// ============ Handlers ============

func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"service": "PrivacyShield API",
		"network": "Algorand TestNet",
		"time":    time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *Handler) GenerateProof(w http.ResponseWriter, r *http.Request) {
	var req GenerateProofRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "invalid request body"}`, http.StatusBadRequest)
		return
	}

	// TODO: Implement
	// 1. Validate inputs
	// 2. Generate ZK proof using gnark
	// 3. Submit proof to AlgoPlonk verifier on Algorand
	// 4. Return result with transaction ID

	result := ProofResult{
		CredentialType: req.CredentialType,
		Label:          getLabelForType(req.CredentialType),
		Status:         "verified",
		TxID:           "TODO_ALGO_TX_ID",
		ExplorerURL:    "https://testnet.algoexplorer.io/tx/TODO",
		Timestamp:      time.Now().UTC().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *Handler) GenerateAllProofs(w http.ResponseWriter, r *http.Request) {
	var req GenerateAllProofsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "invalid request body"}`, http.StatusBadRequest)
		return
	}

	// TODO: Implement
	// 1. Loop through each credential
	// 2. Generate ZK proof for each
	// 3. Verify each on Algorand
	// 4. Log consent on Algorand
	// 5. Return credential bundle with all results

	credentialID := fmt.Sprintf("HS-%04d", time.Now().Unix()%10000)

	results := make([]ProofResult, len(req.Credentials))
	for i, cred := range req.Credentials {
		results[i] = ProofResult{
			CredentialType: cred.CredentialType,
			Label:          getLabelForType(cred.CredentialType),
			Status:         "verified",
			TxID:           fmt.Sprintf("TODO_TX_%d", i),
			ExplorerURL:    fmt.Sprintf("https://testnet.algoexplorer.io/tx/TODO_%d", i),
			Timestamp:      time.Now().UTC().Format(time.RFC3339),
		}
	}

	bundle := CredentialBundle{
		CredentialID: credentialID,
		UserHash:     req.UserHash,
		Results:      results,
		ConsentTxID:  "TODO_CONSENT_TX",
		CreatedAt:    time.Now().UTC().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bundle)
}

func (h *Handler) GetCredential(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	credentialID := vars["id"]

	// TODO: Implement — look up credential from Algorand chain state

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"credential_id": credentialID,
		"status":        "TODO — fetch from Algorand",
	})
}

func (h *Handler) LogConsent(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement — log consent on Algorand consent manager contract
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "TODO — log to Algorand",
	})
}

func (h *Handler) GetConsentHistory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userHash := vars["userHash"]

	// TODO: Implement — read consent history from Algorand

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user_hash": userHash,
		"history":   []ConsentRecord{},
	})
}

func (h *Handler) RevokeConsent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	consentID := vars["consentId"]

	// TODO: Implement — call revoke on Algorand consent manager contract

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"consent_id": consentID,
		"status":     "TODO — revoke on Algorand",
	})
}

// ============ Helpers ============

func getLabelForType(credentialType string) string {
	labels := map[string]string{
		"blood_pressure": "Blood Pressure",
		"blood_sugar":    "Fasting Blood Sugar",
		"bmi":            "BMI",
		"cholesterol":    "Total Cholesterol",
		"report_recency": "Report Recency",
	}
	if label, ok := labels[credentialType]; ok {
		return label
	}
	return credentialType
}
