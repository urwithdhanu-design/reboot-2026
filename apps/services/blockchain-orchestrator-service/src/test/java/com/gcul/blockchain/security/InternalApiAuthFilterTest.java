package com.gcul.blockchain.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.gcul.blockchain.config.InternalApiProperties;

import jakarta.servlet.FilterChain;

class InternalApiAuthFilterTest {

	private InternalApiProperties properties;
	private InternalApiAuthFilter filter;

	@BeforeEach
	void setUp() {
		properties = new InternalApiProperties();
		filter = new InternalApiAuthFilter(properties);
	}

	@Test
	void skipsNonInternalPaths() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/blockchain/canton/health");
		MockHttpServletResponse response = new MockHttpServletResponse();
		FilterChain chain = mock(FilterChain.class);
		properties.setKey("secret");

		filter.doFilter(request, response, chain);
		verify(chain).doFilter(request, response);
	}

	@Test
	void allowsWhenProtectionDisabled() throws Exception {
		properties.setKey("");
		MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/blockchain/internal/policy-nft/mint");
		MockHttpServletResponse response = new MockHttpServletResponse();
		FilterChain chain = mock(FilterChain.class);

		filter.doFilter(request, response, chain);
		verify(chain).doFilter(request, response);
	}

	@Test
	void rejectsMissingKey() throws Exception {
		properties.setKey("secret");
		MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/blockchain/internal/policy-nft/mint");
		MockHttpServletResponse response = new MockHttpServletResponse();
		FilterChain chain = mock(FilterChain.class);

		filter.doFilter(request, response, chain);
		assertEquals(401, response.getStatus());
	}

	@Test
	void allowsWithCorrectHeader() throws Exception {
		properties.setKey("secret");
		MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/blockchain/internal/policy-nft/mint");
		request.addHeader(InternalApiAuthFilter.HEADER_NAME, "secret");
		MockHttpServletResponse response = new MockHttpServletResponse();
		FilterChain chain = mock(FilterChain.class);

		filter.doFilter(request, response, chain);
		verify(chain).doFilter(request, response);
	}
}
