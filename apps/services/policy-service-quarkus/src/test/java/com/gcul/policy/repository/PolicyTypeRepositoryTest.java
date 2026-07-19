package com.gcul.policy.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.gcul.policy.entity.PolicyTypeEntity;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

@QuarkusTest
class PolicyTypeRepositoryTest {

    @Inject
    PolicyTypeRepository repository;

    @Test
    void findAllOrdered_returnsTwoTypes() {
        List<PolicyTypeEntity> all = repository.findAllOrdered();
        assertEquals(2, all.size());
        assertEquals("TRAVEL", all.get(0).code);
        assertEquals("HEALTH", all.get(1).code);
    }

    @Test
    void findByCodeIgnoreCase_found() {
        Optional<PolicyTypeEntity> result = repository.findByCodeIgnoreCase("travel");
        assertTrue(result.isPresent());
        assertEquals("TRAVEL", result.get().code);
        assertEquals(2, result.get().categories.size());
    }

    @Test
    void findByCodeIgnoreCase_notFound() {
        Optional<PolicyTypeEntity> result = repository.findByCodeIgnoreCase("MOTOR");
        assertTrue(result.isEmpty());
    }
}
