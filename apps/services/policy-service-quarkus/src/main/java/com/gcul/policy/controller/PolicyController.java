package com.gcul.policy.controller;

import com.gcul.policy.dto.PolicyTypeDto;
import com.gcul.policy.service.PolicyCatalogService;
import jakarta.inject.Inject;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

/**
 * REST API for the insurance policy catalog.
 * Exposes available policy types (TRAVEL, HEALTH), their categories and health add-ons.
 */
@Path("/policies")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Policies", description = "Policy catalog endpoints")
public class PolicyController {

    private final PolicyCatalogService policyCatalogService;

    @Inject
    public PolicyController(PolicyCatalogService policyCatalogService) {
        this.policyCatalogService = policyCatalogService;
    }

    /**
     * Returns the full catalog of policy types with categories and add-ons.
     */
    @GET
    @Operation(summary = "List all policy types", description = "Returns TRAVEL and HEALTH policy types with their categories and available add-ons.")
    @APIResponse(responseCode = "200", description = "Catalog retrieved successfully",
            content = @Content(schema = @Schema(implementation = PolicyTypeDto.class)))
    public List<PolicyTypeDto> getAllPolicies() {
        return policyCatalogService.getAllPolicies();
    }

    /**
     * Returns a single policy type by code.
     *
     * @param type TRAVEL or HEALTH (case-insensitive)
     */
    @GET
    @Path("/{type}")
    @Operation(summary = "Get policy type by code", description = "Returns one policy type. Path parameter is case-insensitive (TRAVEL / HEALTH).")
    @APIResponse(responseCode = "200", description = "Policy type found",
            content = @Content(schema = @Schema(implementation = PolicyTypeDto.class)))
    @APIResponse(responseCode = "404", description = "Policy type does not exist")
    public PolicyTypeDto getPolicyByType(@PathParam("type") @NotBlank String type) {
        return policyCatalogService.getPolicyByType(type);
    }
}

