package com.gcul.policy.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.gcul.policy.dto.PolicyCategoryDto;
import com.gcul.policy.dto.PolicyTypeDto;
import com.gcul.policy.exception.PolicyNotFoundException;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * Integration tests for {@link PolicyCatalogService} against the seeded H2 database.
 */
@QuarkusTest
class PolicyCatalogServiceTest {

    @Inject
    PolicyCatalogService policyCatalogService;

    @Test
    void getAllPolicies_returnsTravelAndHealth() {
        List<PolicyTypeDto> policies = policyCatalogService.getAllPolicies();

        assertNotNull(policies);
        assertEquals(2, policies.size());

        PolicyTypeDto travel = policies.stream()
                .filter(p -> "TRAVEL".equals(p.type()))
                .findFirst()
                .orElseThrow();
        assertEquals(2, travel.categories().size());
        assertTrue(travel.categories().stream().anyMatch(c -> "Trip Protection".equals(c.name())));
        assertTrue(travel.categories().stream().anyMatch(c -> "Trip Cancellation".equals(c.name())));
        // Travel categories must not expose addons
        travel.categories().forEach(c -> assertTrue(c.addons() == null || c.addons().isEmpty()));

        PolicyTypeDto health = policies.stream()
                .filter(p -> "HEALTH".equals(p.type()))
                .findFirst()
                .orElseThrow();
        assertEquals(3, health.categories().size());
        PolicyCategoryDto individual = health.categories().stream()
                .filter(c -> "Individual".equals(c.name()))
                .findFirst()
                .orElseThrow();
        assertNotNull(individual.addons());
        assertFalse(individual.addons().isEmpty());
        assertTrue(individual.addons().contains("Dental Cover"));
        assertTrue(individual.addons().contains("Maternity"));
    }

    @Test
    void getPolicyByType_travel_success() {
        PolicyTypeDto dto = policyCatalogService.getPolicyByType("TRAVEL");
        assertEquals("TRAVEL", dto.type());
        assertEquals(2, dto.categories().size());
    }

    @Test
    void getPolicyByType_health_caseInsensitive() {
        PolicyTypeDto dto = policyCatalogService.getPolicyByType("health");
        assertEquals("HEALTH", dto.type());
        assertEquals(3, dto.categories().size());
    }

    @Test
    void getPolicyByType_unknown_throwsNotFound() {
        assertThrows(PolicyNotFoundException.class,
                () -> policyCatalogService.getPolicyByType("AUTO"));
    }
}
