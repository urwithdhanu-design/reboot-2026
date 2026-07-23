package com.gcul.kyc.ops;

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
}
