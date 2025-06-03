package com.farmboy;

import com.farmboy.model.*;
import okhttp3.OkHttpClient;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Your API key
        String apiKey = "rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv";

        // Create a new instance of OkHttpClient
        OkHttpClient okHttpClient = new OkHttpClient();

        // Create a new instance of EFClient
        EFClient efClient = new EFClient(okHttpClient, apiKey);

        try {
            System.out.println("EternalFarm API Client Demo\n");

            // Get accounts by category (example: P2P)
            System.out.println("Fetching P2P accounts:");
            PageResult<EFAccount> p2pAccounts = efClient.getAccountsByCategory("p2p", 1, 10);
            if (p2pAccounts.getData() != null && !p2pAccounts.getData().isEmpty()) {
                System.out.println("Found " + p2pAccounts.getTotalItems() + " P2P accounts (showing first 10):");
                EFAccount testAccount = p2pAccounts.getData().get(0);
                System.out.println("Selected test account:");
                System.out.println("- Account ID: " + testAccount.getId());
                System.out.println("  Username: " + testAccount.getUsername());
                System.out.println();

                // Test all control endpoints
                System.out.println("\nTesting account control endpoints:");
                
                // Test Stop
                System.out.println("\n1. Testing STOP endpoint:");
                try {
                    efClient.stopAccount(testAccount.getId());
                    System.out.println("✓ Successfully stopped account: " + testAccount.getUsername());
                } catch (Exception e) {
                    System.out.println("✗ Failed to stop account: " + e.getMessage());
                }
                
                // Wait 2 seconds
                Thread.sleep(2000);

                // Test Pause
                System.out.println("\n2. Testing PAUSE endpoint:");
                try {
                    efClient.pauseAccount(testAccount.getId());
                    System.out.println("✓ Successfully paused account: " + testAccount.getUsername());
                } catch (Exception e) {
                    System.out.println("✗ Failed to pause account: " + e.getMessage());
                }
                
                // Wait 2 seconds
                Thread.sleep(2000);

                // Test Resume
                System.out.println("\n3. Testing RESUME endpoint:");
                try {
                    efClient.resumeAccount(testAccount.getId());
                    System.out.println("✓ Successfully resumed account: " + testAccount.getUsername());
                } catch (Exception e) {
                    System.out.println("✗ Failed to resume account: " + e.getMessage());
                }
            } else {
                System.out.println("No accounts found to test with.");
            }

            // Example: Get agents status
            System.out.println("\nAgent Status:");
            PageResult<EFAgent> agentResult = efClient.getAgentPage(1, 100);
            if (agentResult.getData() != null) {
                for (EFAgent agent : agentResult.getData()) {
                    System.out.println("- Agent: " + agent.getName());
                    System.out.println("  Status: " + agent.getStatus());
                    System.out.println("  Last Seen: " + (agent.getLastSeenAt() != null ? agent.getLastSeenAt() : "Never"));
                    System.out.println();
                }
            }

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 