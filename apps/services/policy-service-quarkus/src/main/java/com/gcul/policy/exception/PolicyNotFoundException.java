package com.gcul.policy.exception;

/**
 * Thrown when a requested policy type does not exist in the catalog.
 */
public class PolicyNotFoundException extends RuntimeException {

    public PolicyNotFoundException(String message) {
        super(message);
    }
}
