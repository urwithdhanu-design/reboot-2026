package com.gcul.policy;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.annotations.QuarkusMain;

/**
 * Entry point for the policy-service Quarkus application.
 * In most cases Quarkus starts automatically; this class is kept for explicit runs and documentation.
 */
@QuarkusMain
public class PolicyServiceApplication {

    public static void main(String... args) {
        Quarkus.run(args);
    }
}
