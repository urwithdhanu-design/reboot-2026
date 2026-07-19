package com.gcul.policy.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.time.Instant;
import java.util.Map;
import org.jboss.logging.Logger;

/**
 * Maps domain and unexpected exceptions to clean JSON error responses.
 */
@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {

    private static final Logger LOG = Logger.getLogger(GlobalExceptionMapper.class);

    @Override
    public Response toResponse(Exception exception) {
        if (exception instanceof PolicyNotFoundException) {
            LOG.debug("Not found: " + exception.getMessage());
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(errorBody(404, "Not Found", exception.getMessage()))
                    .build();
        }

        LOG.error("Unhandled exception", exception);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(errorBody(500, "Internal Server Error", "An unexpected error occurred"))
                .build();
    }

    private Map<String, Object> errorBody(int status, String error, String message) {
        return Map.of(
                "timestamp", Instant.now().toString(),
                "status", status,
                "error", error,
                "message", message
        );
    }
}
