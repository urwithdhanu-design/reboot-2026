package com.gcul.blockchain.canton;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.gcul.blockchain.config.CantonKitTestProperties;

/**
 * Runs Daml demo scripts inside the local Canton Docker sandbox when available.
 */
@Component
public class CantonDamlScriptRunner {

	private static final Logger log = LoggerFactory.getLogger(CantonDamlScriptRunner.class);

	private final CantonKitTestProperties properties;

	public CantonDamlScriptRunner(CantonKitTestProperties properties) {
		this.properties = properties;
	}

	public ScriptRunResult runCapitalMarketDemo() {
		if (!isDockerAvailable()) {
			return ScriptRunResult.fail("Docker CLI not available on orchestrator host");
		}
		if (!containerRunning(properties.getDockerContainer())) {
			return ScriptRunResult.fail(
					"Canton container not running — start with: local-dev.cmd canton");
		}

		List<String> command = List.of(
				"docker", "exec", properties.getDockerContainer(),
				"daml", "script",
				"--dar", properties.getDarPathInContainer(),
				"--script-name", "Gcul.CapitalMarketDemo:demo",
				"--ledger-host", "localhost",
				"--ledger-port", "6865");

		try {
			Process process = new ProcessBuilder(command)
					.redirectErrorStream(true)
					.start();
			boolean finished = process.waitFor(properties.getScriptTimeoutSeconds(), TimeUnit.SECONDS);
			String output = readStream(process.getInputStream());
			if (!finished) {
				process.destroyForcibly();
				return ScriptRunResult.fail("Daml script timed out after " + properties.getScriptTimeoutSeconds() + "s");
			}
			int code = process.exitValue();
			if (code == 0) {
				return ScriptRunResult.ok("Gcul.CapitalMarketDemo:demo completed", truncate(output, 400));
			}
			return ScriptRunResult.fail("Daml script exit " + code + ": " + truncate(output, 400));
		}
		catch (Exception ex) {
			log.debug("Capital market Daml script failed: {}", ex.getMessage());
			return ScriptRunResult.fail(ex.getMessage() == null ? "script failed" : ex.getMessage());
		}
	}

	private static boolean isDockerAvailable() {
		try {
			Process process = new ProcessBuilder("docker", "version")
					.redirectErrorStream(true)
					.start();
			return process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
		}
		catch (Exception ex) {
			return false;
		}
	}

	private static boolean containerRunning(String name) {
		try {
			Process process = new ProcessBuilder("docker", "inspect", "-f", "{{.State.Running}}", name)
					.redirectErrorStream(true)
					.start();
			if (!process.waitFor(15, TimeUnit.SECONDS)) {
				process.destroyForcibly();
				return false;
			}
			String out = readStream(process.getInputStream()).trim();
			return process.exitValue() == 0 && "true".equalsIgnoreCase(out);
		}
		catch (Exception ex) {
			return false;
		}
	}

	private static String readStream(InputStream stream) throws Exception {
		ByteArrayOutputStream buffer = new ByteArrayOutputStream();
		byte[] chunk = new byte[4096];
		int read;
		while ((read = stream.read(chunk)) != -1) {
			buffer.write(chunk, 0, read);
		}
		return buffer.toString(StandardCharsets.UTF_8);
	}

	private static String truncate(String value, int max) {
		if (value == null) {
			return "";
		}
		String trimmed = value.trim();
		if (trimmed.length() <= max) {
			return trimmed;
		}
		return trimmed.substring(0, max) + "…";
	}

	public record ScriptRunResult(boolean success, String message, String detail) {
		static ScriptRunResult ok(String message, String detail) {
			return new ScriptRunResult(true, message, detail);
		}

		static ScriptRunResult fail(String message) {
			return new ScriptRunResult(false, message, "");
		}
	}
}
