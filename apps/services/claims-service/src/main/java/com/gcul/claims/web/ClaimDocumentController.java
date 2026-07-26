package com.gcul.claims.web;

import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.gcul.claims.service.ClaimDocumentService;

@RestController
@RequestMapping("/api/claims/{claimId}/documents")
public class ClaimDocumentController {

	private final ClaimDocumentService documents;

	public ClaimDocumentController(ClaimDocumentService documents) {
		this.documents = documents;
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public Map<String, Object> upload(
			@PathVariable String claimId,
			@RequestParam("file") MultipartFile file,
			@RequestParam(value = "label", required = false) String label,
			@RequestParam(value = "query_id", required = false) String queryId) {
		return documents.upload(claimId, file, label, queryId);
	}

	@GetMapping
	public Map<String, Object> list(@PathVariable String claimId) {
		List<Map<String, Object>> items = documents.listForClaim(claimId);
		return Map.of("documents", items, "count", items.size());
	}

	@GetMapping("/{docId}/content")
	public ResponseEntity<Resource> content(@PathVariable String claimId, @PathVariable String docId) {
		Resource resource = documents.loadContent(claimId, docId);
		String contentType = documents.contentTypeFor(claimId, docId);
		String fileName = documents.downloadNameFor(claimId, docId);
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(contentType))
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
				.body(resource);
	}
}
