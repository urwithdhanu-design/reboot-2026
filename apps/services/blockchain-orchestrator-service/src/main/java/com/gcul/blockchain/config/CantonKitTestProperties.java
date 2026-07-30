package com.gcul.blockchain.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "gcul.canton.kit-tests")
public class CantonKitTestProperties {

	/** When false, /api/blockchain/canton/kit-tests/* returns 404. */
	private boolean enabled = true;

	private String dockerContainer = "gcul-canton-sandbox";

	private String darPathInContainer = "/sandbox/gcul-policy.dar";

	private int scriptTimeoutSeconds = 180;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getDockerContainer() {
		return dockerContainer;
	}

	public void setDockerContainer(String dockerContainer) {
		this.dockerContainer = dockerContainer;
	}

	public String getDarPathInContainer() {
		return darPathInContainer;
	}

	public void setDarPathInContainer(String darPathInContainer) {
		this.darPathInContainer = darPathInContainer;
	}

	public int getScriptTimeoutSeconds() {
		return scriptTimeoutSeconds;
	}

	public void setScriptTimeoutSeconds(int scriptTimeoutSeconds) {
		this.scriptTimeoutSeconds = scriptTimeoutSeconds;
	}
}
