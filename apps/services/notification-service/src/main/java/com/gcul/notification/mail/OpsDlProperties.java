package com.gcul.notification.mail;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "gcul.ops")
public class OpsDlProperties {

	private String dlEmails =
			"beingfazal@gmail.com,dollanitri@gmail.com,vineesha.mekala@gmail.com,urwithdhanu@gmail.com";
	private String fromName = "Reboot 2026 Insurance platform";
	private String fromAddress = "";

	public List<String> recipients() {
		return Arrays.stream(dlEmails.split(","))
				.map(String::trim)
				.filter(s -> !s.isBlank())
				.collect(Collectors.toList());
	}

	public String getDlEmails() {
		return dlEmails;
	}

	public void setDlEmails(String dlEmails) {
		this.dlEmails = dlEmails;
	}

	public String getFromName() {
		return fromName;
	}

	public void setFromName(String fromName) {
		this.fromName = fromName;
	}

	public String getFromAddress() {
		return fromAddress;
	}

	public void setFromAddress(String fromAddress) {
		this.fromAddress = fromAddress;
	}

	public boolean isConfigured() {
		return fromAddress != null && !fromAddress.isBlank();
	}
}
