package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"github.com/privacyshield/backend/internal/api"
	"github.com/privacyshield/backend/internal/algorand"
	"github.com/privacyshield/backend/internal/prover"
)

func main() {
	fmt.Println("🛡️  PrivacyShield Backend — Starting...")

	// Initialize components
	fmt.Println("⚙️  Initializing ZK prover engine...")
	proverEngine, err := prover.NewEngine()
	if err != nil {
		log.Fatalf("❌ Failed to initialize prover: %v", err)
	}
	fmt.Println("✅ ZK prover ready")

	fmt.Println("⛓️  Connecting to Algorand TestNet...")
	algoClient, err := algorand.NewClient()
	if err != nil {
		log.Fatalf("❌ Failed to connect to Algorand: %v", err)
	}
	fmt.Println("✅ Algorand client ready")

	// Setup API handlers
	handler := api.NewHandler(proverEngine, algoClient)

	router := mux.NewRouter()
	router.HandleFunc("/api/health", handler.HealthCheck).Methods("GET")

	// Proof endpoints
	router.HandleFunc("/api/proof/generate", handler.GenerateProof).Methods("POST")
	router.HandleFunc("/api/proof/generate-all", handler.GenerateAllProofs).Methods("POST")
	router.HandleFunc("/api/credential/{id}", handler.GetCredential).Methods("GET")

	// Consent endpoints
	router.HandleFunc("/api/consent/log", handler.LogConsent).Methods("POST")
	router.HandleFunc("/api/consent/history/{userHash}", handler.GetConsentHistory).Methods("GET")
	router.HandleFunc("/api/consent/revoke/{consentId}", handler.RevokeConsent).Methods("POST")

	// CORS for frontend
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("\n🚀 PrivacyShield API running on http://localhost:%s\n", port)
	fmt.Println("   GET  /api/health              — Health check")
	fmt.Println("   POST /api/proof/generate       — Generate ZK proof for one credential")
	fmt.Println("   POST /api/proof/generate-all   — Generate ZK proofs for all credentials")
	fmt.Println("   GET  /api/credential/:id       — Get credential verification status")
	fmt.Println("   POST /api/consent/log          — Log consent on Algorand")
	fmt.Println("   GET  /api/consent/history/:hash — Get consent history")
	fmt.Println("   POST /api/consent/revoke/:id   — Revoke consent")

	log.Fatal(http.ListenAndServe(":"+port, c.Handler(router)))
}
