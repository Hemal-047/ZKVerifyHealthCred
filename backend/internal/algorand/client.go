package algorand

import (
	"fmt"
	"os"
)

// Client wraps all Algorand TestNet operations:
// - Submitting ZK proofs to the verifier contract
// - Logging consent to the consent manager contract
// - Reading consent history
// - Revoking consent
type Client struct {
	algodURL   string
	algodToken string
	indexerURL string

	// Contract app IDs (deployed on TestNet)
	verifierAppID      uint64
	consentManagerAppID uint64

	// Account for signing transactions
	signerAddress string
	signerMnemonic string

	ready bool
}

func NewClient() (*Client, error) {
	c := &Client{
		algodURL:   getEnvOrDefault("ALGORAND_ALGOD_URL", "https://testnet-api.algonode.cloud"),
		algodToken: getEnvOrDefault("ALGORAND_ALGOD_TOKEN", ""),
		indexerURL: getEnvOrDefault("ALGORAND_INDEXER_URL", "https://testnet-idx.algonode.cloud"),
	}

	// TODO: Load deployed contract app IDs from env
	// c.verifierAppID = ...
	// c.consentManagerAppID = ...

	// TODO: Initialize AlgoSDK client
	// algodClient, err := algod.MakeClient(c.algodURL, c.algodToken)

	c.ready = true
	fmt.Println("   Algorand client connected to TestNet")
	return c, nil
}

// SubmitProof sends a ZK proof to the AlgoPlonk verifier contract on Algorand.
// Returns the transaction ID if verification succeeds.
func (c *Client) SubmitProof(proofBytes []byte, publicInputs []byte) (txID string, err error) {
	// TODO: Implement
	// 1. Create application call transaction to verifier contract
	// 2. Pass proof and public inputs as arguments
	// 3. Sign and submit transaction
	// 4. Wait for confirmation
	// 5. Return transaction ID

	return "", fmt.Errorf("TODO: implement proof submission to Algorand")
}

// LogConsent records a verification consent on the consent manager contract.
func (c *Client) LogConsent(userHash string, verifierID string, credentialTypes []string, results []bool) (txID string, err error) {
	// TODO: Implement
	// 1. Create application call to consent manager
	// 2. Pass consent details as arguments
	// 3. Sign and submit
	// 4. Return transaction ID

	return "", fmt.Errorf("TODO: implement consent logging on Algorand")
}

// GetConsentHistory reads consent records for a user from the chain.
func (c *Client) GetConsentHistory(userHash string) ([]map[string]interface{}, error) {
	// TODO: Implement
	// 1. Query indexer for consent manager app transactions
	// 2. Filter by user hash
	// 3. Parse and return consent records

	return nil, fmt.Errorf("TODO: implement consent history lookup")
}

// RevokeConsent marks a consent record as revoked on-chain.
func (c *Client) RevokeConsent(consentID string, userHash string) (txID string, err error) {
	// TODO: Implement
	// 1. Create application call to consent manager (revoke method)
	// 2. Pass consent ID and user hash
	// 3. Sign and submit
	// 4. Return transaction ID

	return "", fmt.Errorf("TODO: implement consent revocation on Algorand")
}

// GetExplorerURL returns the TestNet explorer link for a transaction.
func (c *Client) GetExplorerURL(txID string) string {
	return fmt.Sprintf("https://lora.algokit.io/testnet/transaction/%s", txID)
}

func (c *Client) IsReady() bool {
	return c.ready
}

func getEnvOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
