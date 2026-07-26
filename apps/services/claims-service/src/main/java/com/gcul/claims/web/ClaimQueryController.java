package com.gcul.claims.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.claims.service.ClaimQueryService;

@RestController
@RequestMapping("/api/claims/{claimId}/queries")
public class ClaimQueryController {

	private final ClaimQueryService queries;

	public ClaimQueryController(ClaimQueryService queries) {
		this.queries = queries;
	}

	@GetMapping
	public Map<String, Object> list(@PathVariable String claimId) {
		List<Map<String, Object>> items = queries.listForClaim(claimId);
		long open = items.stream().filter(q -> "open".equals(q.get("status"))).count();
		return Map.of("queries", items, "count", items.size(), "open_count", open);
	}

	@PostMapping
	public Map<String, Object> create(@PathVariable String claimId, @RequestBody Map<String, Object> body) {
		return queries.createAdminQuery(claimId, body);
	}

	@PostMapping("/{queryId}/reply")
	public Map<String, Object> reply(
			@PathVariable String claimId,
			@PathVariable String queryId,
			@RequestBody Map<String, Object> body) {
		return queries.replyToQuery(claimId, queryId, body);
	}
}
