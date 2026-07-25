package com.gcul.kyc.config;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor {

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		for (Path envFile : findEnvCandidates()) {
			if (!Files.isRegularFile(envFile)) {
				continue;
			}
			Map<String, Object> values = loadEnvFile(envFile, environment);
			if (!values.isEmpty()) {
				environment.getPropertySources().addLast(new MapPropertySource("dotenv:" + envFile, values));
				return;
			}
		}
	}

	private static List<Path> findEnvCandidates() {
		List<Path> candidates = new ArrayList<>();
		Path cwd = Path.of("").toAbsolutePath().normalize();
		candidates.add(cwd.resolve(".env"));

		Path walk = cwd;
		for (int i = 0; i < 6 && walk != null; i++) {
			candidates.add(walk.resolve(".env"));
			candidates.add(walk.resolve("apps/services/kyc-service/.env"));
			Path parent = walk.getParent();
			if (parent != null && parent.equals(walk)) {
				break;
			}
			walk = parent;
		}
		return candidates;
	}

	private static Map<String, Object> loadEnvFile(Path envFile, ConfigurableEnvironment environment) {
		Map<String, Object> values = new HashMap<>();
		try (BufferedReader reader = Files.newBufferedReader(envFile)) {
			String line;
			while ((line = reader.readLine()) != null) {
				line = line.trim();
				if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
					continue;
				}
				int eq = line.indexOf('=');
				String key = line.substring(0, eq).trim();
				String value = line.substring(eq + 1).trim();
				if ((value.startsWith("\"") && value.endsWith("\""))
						|| (value.startsWith("'") && value.endsWith("'"))) {
					value = value.substring(1, value.length() - 1);
				}
				if ("EMAIL_PASS".equals(key)) {
					value = value.replace(" ", "");
				}
				if (!key.isEmpty() && environment.getProperty(key) == null) {
					values.put(key, value);
				}
			}
		}
		catch (IOException ignored) {
			return Map.of();
		}
		return values;
	}
}
