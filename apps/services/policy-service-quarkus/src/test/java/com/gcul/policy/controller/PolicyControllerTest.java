package com.gcul.policy.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

/**
 * REST endpoint tests for the policy catalog API.
 */
@QuarkusTest
class PolicyControllerTest {

    @Test
    void getAllPolicies_returns200WithTwoTypes() {
        given()
                .when().get("/policies")
                .then()
                .statusCode(200)
                .body("$", hasSize(2))
                .body("type", hasItems("TRAVEL", "HEALTH"));
    }

    @Test
    void getTravel_returnsCategoriesWithoutAddons() {
        given()
                .when().get("/policies/TRAVEL")
                .then()
                .statusCode(200)
                .body("type", equalTo("TRAVEL"))
                .body("categories", hasSize(2))
                .body("categories.name", hasItems("Trip Protection", "Trip Cancellation"));
    }

    @Test
    void getHealth_returnsCategoriesWithAddons() {
        given()
                .when().get("/policies/HEALTH")
                .then()
                .statusCode(200)
                .body("type", equalTo("HEALTH"))
                .body("categories", hasSize(3))
                .body("categories[0].addons", notNullValue())
                .body("categories[0].addons", hasItems("Dental Cover", "Vision Cover", "Critical Illness", "Maternity", "Personal Accident"));
    }

    @Test
    void getUnknownType_returns404() {
        given()
                .when().get("/policies/LIFE")
                .then()
                .statusCode(404)
                .body("status", equalTo(404))
                .body("error", equalTo("Not Found"));
    }

    @Test
    void getHealthLowerCase_succeeds() {
        given()
                .when().get("/policies/health")
                .then()
                .statusCode(200)
                .body("type", equalTo("HEALTH"));
    }
}
