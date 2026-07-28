package com.gcul.kyc.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.model.UserAccount;

@Service
public class KycUploadService {

	private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
	private static final Set<String> ALLOWED_TYPES = Set.of(
			MediaType.IMAGE_JPEG_VALUE,
			MediaType.IMAGE_PNG_VALUE,
			"image/webp");

	private final Path storageRoot;

	public KycUploadService(@Value("${gcul.kyc.uploads-dir:./data/kyc-uploads}") String uploadsDir)
			throws IOException {
		this.storageRoot = Path.of(uploadsDir).toAbsolutePath().normalize();
		Files.createDirectories(storageRoot);
	}

	public Map<String, Object> saveDocument(UserAccount user, MultipartFile file) {
		return saveFile(user, "document", file, DOCUMENT_TYPES);
	}

	private static final Set<String> DOCUMENT_TYPES = Set.of(
			MediaType.APPLICATION_PDF_VALUE,
			MediaType.IMAGE_JPEG_VALUE,
			MediaType.IMAGE_PNG_VALUE,
			"image/webp");

	public Map<String, Object> saveSelfie(UserAccount user, MultipartFile file) {
		return saveFile(user, "selfie", file, ALLOWED_TYPES);
	}

	private Map<String, Object> saveFile(
			UserAccount user,
			String kind,
			MultipartFile file,
			Set<String> allowedTypes) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file is required");
		}
		if (file.getSize() > MAX_FILE_BYTES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds 5 MB limit");
		}

		String contentType = normalizeContentType(file, allowedTypes);
		String extension = extensionFor(contentType);
		Path userDir = storageRoot.resolve(user.getId()).normalize();
		if (!userDir.startsWith(storageRoot)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid storage path");
		}

		Path target = userDir.resolve(kind + extension).normalize();
		if (!target.startsWith(storageRoot)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
		}

		try {
			Files.createDirectories(userDir);
			file.transferTo(target);
		}
		catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store file");
		}

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("uploaded", true);
		response.put("kind", kind);
		response.put("file_name", target.getFileName().toString());
		response.put("content_type", contentType);
		response.put("file_size", file.getSize());
		return response;
	}

	private static String normalizeContentType(MultipartFile file, Set<String> allowedTypes) {
		String raw = file.getContentType();
		if (raw != null) {
			String normalized = raw.toLowerCase(Locale.ROOT);
			if (allowedTypes.contains(normalized)) {
				return normalized;
			}
		}
		String name = file.getOriginalFilename();
		if (name != null) {
			String lower = name.toLowerCase(Locale.ROOT);
			String inferred = null;
			if (lower.endsWith(".pdf")) {
				inferred = MediaType.APPLICATION_PDF_VALUE;
			} else if (lower.endsWith(".png")) {
				inferred = MediaType.IMAGE_PNG_VALUE;
			} else if (lower.endsWith(".webp")) {
				inferred = "image/webp";
			} else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
				inferred = MediaType.IMAGE_JPEG_VALUE;
			}
			if (inferred != null && allowedTypes.contains(inferred)) {
				return inferred;
			}
		}
		throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file type");
	}

	private static String extensionFor(String contentType) {
		return switch (contentType) {
			case MediaType.APPLICATION_PDF_VALUE -> ".pdf";
			case MediaType.IMAGE_PNG_VALUE -> ".png";
			case "image/webp" -> ".webp";
			default -> ".jpg";
		};
	}

	public boolean hasSelfie(UserAccount user) {
		return hasKind(user, "selfie");
	}

	public boolean hasDocument(UserAccount user) {
		return hasKind(user, "document");
	}

	private boolean hasKind(UserAccount user, String kind) {
		Path userDir = storageRoot.resolve(user.getId());
		if (!Files.isDirectory(userDir)) {
			return false;
		}
		try (var stream = Files.list(userDir)) {
			return stream.anyMatch(path -> {
				String name = path.getFileName().toString().toLowerCase(Locale.ROOT);
				return name.startsWith(kind + ".");
			});
		}
		catch (IOException ex) {
			return false;
		}
	}

	public String sanitizeFileName(String original) {
		if (!StringUtils.hasText(original)) {
			return "upload";
		}
		return original.replaceAll("[^a-zA-Z0-9._-]", "_");
	}
}
