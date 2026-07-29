package com.gcul.audit.security;

public final class PlatformRoles {

	private PlatformRoles() {
	}

	public static boolean isPlatformAdmin(String role) {
		if (role == null) {
			return false;
		}
		String normalized = role.trim().toLowerCase();
		return normalized.equals("platform_admin") || normalized.equals("admin");
	}
}
