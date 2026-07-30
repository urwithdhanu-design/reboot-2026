package com.gcul.blockchain.canton;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.gcul.blockchain.config.CantonProperties;

class CantonCapitalMarketServiceTest {

	private CantonCapitalMarketService service;

	@BeforeEach
	void setUp() {
		CantonProperties props = new CantonProperties();
		props.setPackageId("pkg-capital");
		props.setNetwork("Canton Local Sandbox");
		service = new CantonCapitalMarketService(props);
	}

	@Test
	void statusListsPhaseDTemplates() {
		var status = service.status();
		assertEquals("D", status.get("phase"));
		assertEquals("Gcul.CapitalMarketDemo:demo", status.get("demoScript"));
		assertEquals("pkg-capital", status.get("packageId"));

		@SuppressWarnings("unchecked")
		var templates = (java.util.List<java.util.Map<String, Object>>) status.get("templates");
		assertTrue(templates.size() >= 4);
		assertTrue(templates.stream().anyMatch(t -> "Gcul.Common.DvP".equals(t.get("module")));
	}
}
