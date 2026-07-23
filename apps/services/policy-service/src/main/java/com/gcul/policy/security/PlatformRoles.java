package com.gcul.policy.security;

public final class PlatformRoles {

	public static final String PLATFORM_ADMIN = "platform_admin";

	private PlatformRoles() {
	}

	public static boolean isPlatformAdmin(String role) {
		return PLATFORM_ADMIN.equals(role);
	}
}
