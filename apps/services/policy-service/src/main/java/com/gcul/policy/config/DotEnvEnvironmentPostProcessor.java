package com.gcul.policy.config;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Loads optional {@code .env} from the policy-service working directory into the
 * Spring Environment (without overriding real OS env vars).
 */
public class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor {

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		Path envFile = Path.of(".env");
		if (!Files.isRegularFile(envFile)) {
			envFile = Path.of("apps/services/policy-service/.env");
		}
		if (!Files.isRegularFile(envFile)) {
			return;
		}

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
			return;
		}

		if (!values.isEmpty()) {
			environment.getPropertySources()
					.addLast(new MapPropertySource("dotenv", values));
		}
	}
}
