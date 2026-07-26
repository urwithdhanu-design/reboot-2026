package com.gcul.claims.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.claims.model.ClaimDocument;
import com.gcul.claims.model.ClaimQuery;
import com.gcul.claims.repository.ClaimDocumentRepository;
import com.gcul.claims.repository.ClaimQueryRepository;
import com.gcul.claims.repository.ClaimRepository;

@Service
public class ClaimDocumentService {

	private static final int MAX_FILES_PER_CLAIM = 15;
	private static final long MAX_FILE_BYTES = 8L * 1024 * 1024;
	private static final Set<String> ALLOWED_TYPES = Set.of(
			MediaType.APPLICATION_PDF_VALUE,
			MediaType.IMAGE_JPEG_VALUE,
			MediaType.IMAGE_PNG_VALUE,
			MediaType.IMAGE_GIF_VALUE,
			"image/webp");

	private final ClaimRepository claims;
	private final ClaimDocumentRepository documents;
	private final ClaimQueryRepository queries;
	private final Path storageRoot;

	public ClaimDocumentService(
			ClaimRepository claims,
			ClaimDocumentRepository documents,
			ClaimQueryRepository queries,
			@Value("${gcul.claims.documents-dir:./data/claim-documents}") String documentsDir) throws IOException {
		this.claims = claims;
		this.documents = documents;
		this.queries = queries;
		this.storageRoot = Path.of(documentsDir).toAbsolutePath().normalize();
		Files.createDirectories(storageRoot);
	}

	@Transactional
	public Map<String, Object> upload(String claimId, MultipartFile file, String label, String queryId) {
		claims.findById(claimId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId));

		String linkedQueryId = queryId == null ? "" : queryId.trim();
		if (!linkedQueryId.isBlank()) {
			ClaimQuery query = queries.findByIdAndClaimId(linkedQueryId, claimId).orElseThrow(
					() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid query_id for this claim"));
			if (!"open".equalsIgnoreCase(query.getStatus())) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "Query is no longer open for uploads");
			}
		}

		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file is required");
		}
		if (documents.countByClaimId(claimId) >= MAX_FILES_PER_CLAIM) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Maximum " + MAX_FILES_PER_CLAIM + " documents per claim");
		}
		if (file.getSize() > MAX_FILE_BYTES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds 8 MB limit");
		}

		String contentType = normalizeContentType(file);
		String originalName = sanitizeFileName(file.getOriginalFilename());
		if (originalName.isBlank()) {
			originalName = "document";
		}

		String docId = "DOC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
		String storedName = docId + "-" + originalName;
		Path claimDir = storageRoot.resolve(claimId);
		Path target = claimDir.resolve(storedName).normalize();
		if (!target.startsWith(storageRoot)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
		}

		try {
			Files.createDirectories(claimDir);
			file.transferTo(target);
		}
		catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Could not store document: " + ex.getMessage());
		}

		ClaimDocument doc = new ClaimDocument();
		doc.setId(docId);
		doc.setClaimId(claimId);
		doc.setFileName(storedName);
		doc.setOriginalFileName(originalName);
		doc.setContentType(contentType);
		doc.setFileSize(file.getSize());
		doc.setLabel(label == null || label.isBlank() ? guessLabel(originalName) : label.trim());
		if (!linkedQueryId.isBlank()) {
			doc.setQueryId(linkedQueryId);
			doc.setLabel(firstNonBlank(doc.getLabel(), "Query response"));
		}
		doc.setStoragePath(target.toString());
		doc.setUploadedAt(Instant.now());
		return toMap(documents.save(doc));
	}

	public List<Map<String, Object>> listForClaim(String claimId) {
		return documents.findByClaimIdOrderByUploadedAtAsc(claimId).stream().map(this::toMap).toList();
	}

	public long countForClaim(String claimId) {
		return documents.countByClaimId(claimId);
	}

	public Resource loadContent(String claimId, String docId) {
		ClaimDocument doc = documents.findByIdAndClaimId(docId, claimId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
		Path path = Path.of(doc.getStoragePath()).normalize();
		if (!Files.exists(path)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document file missing on disk");
		}
		return new FileSystemResource(path);
	}

	public String contentTypeFor(String claimId, String docId) {
		return documents.findByIdAndClaimId(docId, claimId)
				.map(ClaimDocument::getContentType)
				.orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE);
	}

	public String downloadNameFor(String claimId, String docId) {
		return documents.findByIdAndClaimId(docId, claimId)
				.map(ClaimDocument::getOriginalFileName)
				.orElse("document");
	}

	private Map<String, Object> toMap(ClaimDocument doc) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", doc.getId());
		map.put("claim_id", doc.getClaimId());
		map.put("file_name", doc.getOriginalFileName());
		map.put("label", doc.getLabel());
		map.put("content_type", doc.getContentType());
		map.put("file_size", doc.getFileSize());
		map.put("query_id", doc.getQueryId());
		map.put("uploaded_at", doc.getUploadedAt().toString());
		return map;
	}

	private static String normalizeContentType(MultipartFile file) {
		String type = file.getContentType() == null ? "" : file.getContentType().trim().toLowerCase(Locale.ROOT);
		if (ALLOWED_TYPES.contains(type)) {
			return type;
		}
		String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
		if (name.endsWith(".pdf")) {
			return MediaType.APPLICATION_PDF_VALUE;
		}
		if (name.endsWith(".png")) {
			return MediaType.IMAGE_PNG_VALUE;
		}
		if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
			return MediaType.IMAGE_JPEG_VALUE;
		}
		if (name.endsWith(".gif")) {
			return MediaType.IMAGE_GIF_VALUE;
		}
		if (name.endsWith(".webp")) {
			return "image/webp";
		}
		throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
				"Unsupported file type — upload PDF or image files only");
	}

	private static String sanitizeFileName(String name) {
		if (!StringUtils.hasText(name)) {
			return "";
		}
		return name.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
	}

	private static String guessLabel(String fileName) {
		String lower = fileName.toLowerCase(Locale.ROOT);
		if (lower.contains("receipt") || lower.contains("invoice")) {
			return "Receipt / invoice";
		}
		if (lower.contains("photo") || lower.contains("image") || lower.endsWith(".jpg") || lower.endsWith(".png")) {
			return "Photo evidence";
		}
		if (lower.endsWith(".pdf")) {
			return "Supporting document";
		}
		return "Evidence";
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value.trim();
			}
		}
		return "";
	}
}
